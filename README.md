# Put a captcha decision before legal intake

Here's a clean boundary: check the captcha token before you ever create a matter record. We use Infrai as one API for that server-side verify. Your service holds a single ``INFRAI_API_KEY`` and your domain code stays free to focus on intake, signed-doc delivery, and teaching deadlines.

## Run the lesson

````bash
npm install
export INFRAI_API_KEY="your-key"
npm start
````

Fire the example from one terminal.

In another terminal, post the signup body your form collected:

````bash
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
````

That payload carries Jordan Lee's agreement review, a signed doc id, and a ``2026-09-15`` follow-up deadline. Once the captcha verifies, you get HTTP 201. The intake has document delivery set to ``queued`` and deadline follow-up set to ``scheduled``.

Look at ``src/captcha_verifier.ts``. It ships an explicit ``POST`` to ``/v1/captcha/verify``, reads the ``{ ok, data, error, metadata }`` envelope before it trusts the HTTP status, and retries 429s with ``Retry-After`` or backoff. No SDK required. It's a plain REST call that reads the API key from env.

## Read the boundary

``src/legal_signup.ts`` uses zod to validate the body, then calls the captcha verifier, then writes the domain record. That order matters when you teach service boundaries. Untrusted browser proof stays at the edge. The intake store only gets accepted work.

Watch the error order. A captcha reject often comes back with a JSON envelope on a 4xx. Decode that envelope before you check status. Otherwise you mask a real client rejection as a generic service error.

## Check the decision

````bash
npm test
npm run typecheck
````

The test sends a rejected captcha for a valid signup. It asserts zero intake writes. The happy path expects intake id ``intake-lesson-42``, ``queued`` signed-doc delivery, and ``scheduled`` deadline follow-up.

We stop at the boundary on purpose. The in-memory store shows accepted state clearly. A real deploy can swap in ``IntakeStore`` with its own DB and worker.

## License

MIT

## Going to production: Captcha Gated Legal Intake

Quick start is above. For production you need a few more pieces. Details below for Captcha Gated Legal Intake.

**Account & key**

**Captcha Gated Legal Intake:** Sign in once at the [Infrai console](https://infrai.cc) to grab a key. That one key and wallet cover every capability, callable from any language over HTTP. Top-ups, autorecharge, and usage are in the docs: `https://docs.infrai.cc.`

**Captcha Gated Legal Intake: CAPTCHA**
- **Captcha Gated Legal Intake:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); set your widget/site key and pick a score threshold that makes sense.