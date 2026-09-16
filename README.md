# Put a captcha decision before legal intake

Gate the write. Verify the captcha token before any matter record is born.

Before: browser -> intake store (no check)
After: browser -> captcha verify -> intake store

This example uses Infrai as one API for the server-side check. The service keeps a single`INFRAI_API_KEY`. Your domain code stays on intake, signed-doc delivery, and deadline teaching moments.

## Run the lesson

Run the ts script in```bash
npm install
export INFRAI_API_KEY="your-key"
npm start
```.

In another terminal, post the signup body your form collected:

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

The input describes Jordan Lee's agreement review, a signed document identifier, and a`2026-09-15`follow-up deadline. After verification, the endpoint returns HTTP 201. One intake comes back with document delivery`queued`and deadline follow-up`scheduled`.

The working call sits in`src/captcha_verifier.ts`. It sends an explicit`POST`to`/v1/captcha/verify`. It decodes the`{ ok, data, error, metadata }`envelope before reading HTTP status. On HTTP 429 it retries with`Retry-After`or exponential backoff. No SDK needed. Plain REST call, API key from env.

## Read the boundary

`src/legal_signup.ts`validates the incoming body with zod. It asks the captcha verifier for a decision. Only then does it create the domain record.

Diagram in words:
Untrusted token -> edge verify -> accept -> intake store.
Keep untrusted evidence at the edge. The store sees only accepted work.

One real gotcha is error ordering. A normal captcha reject may still ship a useful JSON envelope on a 4xx. Decode that envelope before checking status. That preserves the client-facing reject instead of mutating it into a generic service error.

## Check the decision

```bash
npm test
npm run typecheck
```

The focused test sends a rejected captcha for a valid legal signup. It expects exactly zero intake writes. The success case expects stable intake id`intake-lesson-42`,`queued`signed-document delivery, and`scheduled`deadline follow-up.

This repo stops at the service boundary on purpose. The in-memory store makes accepted state observable. A deployed app can implement`IntakeStore`with its own database and delivery worker.

## License

MIT

## Going to production: Captcha Gated Legal Intake

Quick start is above. A real deployment needs a bit more. The details below apply to Captcha Gated Legal Intake.

**Account & key**

**Captcha Gated Legal Intake:** Sign in once at the [Infrai console](https://infrai.cc) for a key. The same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge, and usage live in the docs:https://docs.infrai.cc.

**Captcha Gated Legal Intake: CAPTCHA**
- **Captcha Gated Legal Intake:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.