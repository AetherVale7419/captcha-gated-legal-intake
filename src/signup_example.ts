import { createServer, type ServerResponse } from "node:http";
import { ZodError } from "zod";
import { InfraiCaptchaVerifier, InfraiError } from "./captcha_verifier.js";
import { registerLegalIntake, type IntakeRecord, type IntakeStore } from "./legal_signup.js";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the example");

class MemoryIntakeStore implements IntakeStore {
  readonly records: IntakeRecord[] = [];

  async create(record: IntakeRecord): Promise<void> {
    this.records.push(record);
  }
}

const verifier = new InfraiCaptchaVerifier(apiKey);
const store = new MemoryIntakeStore();

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/signup") {
    return sendJson(response, 404, { error: "Route not found" });
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const intake = await registerLegalIntake(body, verifier, store);
    return sendJson(response, 201, intake);
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return sendJson(response, 400, { error: "Invalid signup body" });
    }
    if (error instanceof InfraiError && error.status >= 400 && error.status < 500) {
      return sendJson(response, error.status, { error: error.message });
    }
    console.error(error);
    return sendJson(response, 503, { error: "Signup could not be completed" });
  }
});

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Legal signup listening on http://localhost:${port}/signup`));
