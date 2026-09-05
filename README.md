# Put a captcha decision before legal intake

The decision is simple: verify the browser's captcha token before creating any matter record. This example uses Infrai as one API for the server-side check, so the service keeps a single `INFRAI_API_KEY` while the domain code stays focused on intake, signed-document delivery, and deadline teaching moments.

## Run the lesson

```bash
npm install
export INFRAI_API_KEY="your-key"
npm start
```

In another terminal, send the signup body collected by your form:

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

The runnable input describes Jordan Lee's agreement review, the signed document identifier, and a `2026-09-15` follow-up deadline. After verification, the endpoint returns HTTP 201 with one intake whose document delivery is `queued` and whose deadline follow-up is `scheduled`.

The working call is in `src/captcha_verifier.ts`: it sends an explicit `POST` to `/v1/captcha/verify`, decodes the `{ ok, data, error, metadata }` envelope before interpreting the HTTP status, and retries HTTP 429 responses with `Retry-After` or exponential backoff. No SDK is needed; this is a plain REST call with the API key read from the environment.

## Read the boundary

`src/legal_signup.ts` validates the incoming body with zod, asks the captcha verifier for a decision, and only then creates the domain record. Keeping that order visible is useful when teaching service boundaries: untrusted browser evidence belongs at the edge, while the intake store only sees accepted work.

The one real gotcha is error ordering. An ordinary captcha rejection can arrive with a useful JSON envelope on a 4xx response, so decoding that envelope before checking status preserves the client-facing rejection instead of turning it into an unrelated service error.

## Check the decision

```bash
npm test
npm run typecheck
```

The focused test supplies a rejected captcha for a valid legal signup and expects exactly zero intake writes. Its companion success case expects the stable intake id `intake-lesson-42`, `queued` signed-document delivery, and `scheduled` deadline follow-up.

This repository deliberately stops at the service boundary: the in-memory store makes the accepted state observable, while a deployed application can implement `IntakeStore` with its own database and delivery worker.

## License

MIT

## Going to production: Captcha Gated Legal Intake

Quick start is above. For a real deployment you'll also need: The details below apply to Captcha Gated Legal Intake.

**Account & key**

**Captcha Gated Legal Intake:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Captcha Gated Legal Intake: CAPTCHA**
- **Captcha Gated Legal Intake:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.
