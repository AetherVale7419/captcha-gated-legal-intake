import assert from "node:assert/strict";
import test from "node:test";
import { InfraiError, type CaptchaVerifier } from "../src/captcha_verifier.js";
import { registerLegalIntake, type IntakeRecord, type IntakeStore } from "../src/legal_signup.js";

const validRequest = {
  email: "learner@example.com",
  clientName: "Jordan Lee",
  matterSummary: "Review an enrollment agreement before the response deadline.",
  signedDocumentId: "signed-enrollment-agreement-2026",
  deadline: "2026-09-15",
  captchaToken: "browser-proof",
  captchaWidgetRecordId: "widget-record-lesson"
};

test("a rejected captcha cannot create a legal intake", async () => {
  const verifier: CaptchaVerifier = {
    async verify() {
      throw new InfraiError("rejected", "Captcha was rejected", 422);
    }
  };
  let writes = 0;
  const store: IntakeStore = {
    async create() {
      writes += 1;
    }
  };

  await assert.rejects(() => registerLegalIntake(validRequest, verifier, store));
  assert.equal(writes, 0);
});

test("a verified learner gets delivery and follow-up state", async () => {
  const verifier: CaptchaVerifier = { async verify() {} };
  let saved: IntakeRecord | undefined;
  const store: IntakeStore = {
    async create(record) {
      saved = record;
    }
  };

  const result = await registerLegalIntake(validRequest, verifier, store, () => "intake-lesson-42");

  assert.equal(result.intakeId, "intake-lesson-42");
  assert.equal(result.delivery.status, "queued");
  assert.equal(result.followUp.status, "scheduled");
  assert.deepEqual(saved, result);
});
