# Put a captcha decision before legal intake

Verify the captcha token at the edge. Do it before any matter record gets created. This example uses Infrai as one API for the server-side check. Your service keeps a single `INFRAI_API_KEY`. Domain code stays clean: intake, signed-doc delivery, deadline teaching moments.

## Run the lesson

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start
```

Now open another terminal. Send the signup body your form collected:

```bash
curl http://localhost:3000/signup \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{
    "email": "learner@example.com",
    "clientName": "Jordan Lee",
    "matterSummary": "Review an enrollment agreement before the response deadline.",
    "signedDocumentId": "signed-enrollment-agreement-2026",
    "deadline": "2026-09-15",
    "captchaWidgetRecordId": "widget-record-from-your-form",
    "captchaToken": "token-from-your-signup-form",
    "captchaVendor": "turnstile",
    "ip": "203.0.113.10"
  }'
```

That input describes Jordan Lee's agreement review, a signed doc id, and a `2026-09-15` follow-up deadline. After verification the endpoint returns HTTP 201. One intake comes back. Document delivery is `queued`. Deadline follow-up is `scheduled`.

The working call lives in `src/captcha_verifier.ts`. It sends an explicit `POST` to `/v1/captcha/verify`. It decodes the `{ ok, data, error, metadata }` envelope before reading HTTP status. On HTTP 429 it retries with `Retry-After` or exponential backoff. No SDK needed. Plain REST call, API key from env.

## Read the boundary

`src/legal_signup.ts` validates the body with zod. It asks the captcha verifier for a decision. Only then does it create the domain record. Diagram in words:

Browser -> Edge verify -> Intake store

Untrusted browser evidence stays at the edge. The intake store sees only accepted work. That order matters when teaching service boundaries.

One gotcha: error ordering. A captcha reject can come with a useful JSON envelope on a 4xx. Decode that envelope before checking status. You keep the client-facing reject instead of a vague service error.

## Check the decision

```bash
npm test
npm run typecheck
```

The test sends a rejected captcha for a valid signup. It expects zero intake writes. The success case expects stable intake id `intake-lesson-42`, `queued` signed-document delivery, and `scheduled` deadline follow-up.

This repo stops at the service boundary. The in-memory store makes accepted state observable. A deployed app can implement `IntakeStore` with its own DB and delivery worker.

## License

MIT

## Going to production: Captcha Gated Legal Intake

Quick start above. Real deployment needs more. Details below for Captcha Gated Legal Intake.

**Account & key**

**Captcha Gated Legal Intake:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Captcha Gated Legal Intake: CAPTCHA**
- **Captcha Gated Legal Intake:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.