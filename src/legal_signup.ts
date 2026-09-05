import { z } from "zod";
import type { CaptchaVerifier } from "./captcha_verifier.js";

export const signupRequestSchema = z.object({
  email: z.string().email(),
  clientName: z.string().min(1),
  matterSummary: z.string().min(10).max(2_000),
  signedDocumentId: z.string().min(1),
  deadline: z.string().date(),
  captchaToken: z.string().min(1),
  captchaWidgetRecordId: z.string().min(1),
  captchaVendor: z.string().min(1).optional(),
  ip: z.string().ip().optional()
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;

export type IntakeRecord = {
  intakeId: string;
  email: string;
  clientName: string;
  matterSummary: string;
  delivery: {
    documentId: string;
    status: "queued";
  };
  followUp: {
    deadline: string;
    status: "scheduled";
  };
};

export interface IntakeStore {
  create(record: IntakeRecord): Promise<void>;
}

export async function registerLegalIntake(
  input: unknown,
  verifier: CaptchaVerifier,
  store: IntakeStore,
  createId: () => string = () => crypto.randomUUID()
): Promise<IntakeRecord> {
  const request = signupRequestSchema.parse(input);

  await verifier.verify({
    widget_record_id: request.captchaWidgetRecordId,
    token: request.captchaToken,
    vendor: request.captchaVendor,
    ip: request.ip,
    action: "legal_signup",
    score_threshold: 0.7
  });

  const record: IntakeRecord = {
    intakeId: createId(),
    email: request.email,
    clientName: request.clientName,
    matterSummary: request.matterSummary,
    delivery: {
      documentId: request.signedDocumentId,
      status: "queued"
    },
    followUp: {
      deadline: request.deadline,
      status: "scheduled"
    }
  };

  await store.create(record);
  return record;
}
