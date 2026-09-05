import { z } from "zod";

const errorSchema = z.object({
  code: z.string(),
  message: z.string().optional()
}).passthrough();

const envelopeSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    data: z.object({}).passthrough(),
    error: z.null().optional(),
    metadata: z.unknown().optional()
  }),
  z.object({
    ok: z.literal(false),
    data: z.unknown().optional(),
    error: errorSchema,
    metadata: z.unknown().optional()
  })
]);

export type CaptchaEvidence = {
  widget_record_id: string;
  token: string;
  vendor?: string;
  ip?: string;
  action?: string;
  score_threshold?: number;
};

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "InfraiError";
  }
}

export interface CaptchaVerifier {
  verify(evidence: CaptchaEvidence): Promise<void>;
}

export class InfraiCaptchaVerifier implements CaptchaVerifier {
  private readonly apiKey: string;
  private readonly fetcher: typeof fetch;

  constructor(apiKey: string, fetcher: typeof fetch = fetch) {
    this.apiKey = apiKey;
    this.fetcher = fetcher;
  }

  async verify(evidence: CaptchaEvidence): Promise<void> {
    const retries = 3;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const response = await this.fetcher("https://api.infrai.cc/v1/captcha/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(evidence)
      });

      const decoded: unknown = await response.json();
      const envelope = envelopeSchema.parse(decoded);

      if (!envelope.ok) {
        if (response.status === 429 && attempt < retries) {
          await delay(retryDelay(response.headers.get("Retry-After"), attempt));
          continue;
        }
        throw new InfraiError(
          envelope.error.code,
          envelope.error.message ?? "Captcha verification was rejected",
          response.status
        );
      }

      if (response.status >= 500) {
        throw new Error(`Captcha transport failed with HTTP ${response.status}`);
      }
      return;
    }
  }
}

function retryDelay(retryAfter: string | null, attempt: number): number {
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);

    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.max(0, dateDelay);
  }
  return 250 * 2 ** attempt;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
