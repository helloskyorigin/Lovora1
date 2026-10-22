# LOVORA 💜

**Phase 6:** Premium report, bilingual Hindi/English reading, secure email recovery, legal/support pages and server-verified Dodo checkout are implemented. Payments remain OFF until merchant approval and real integration testing.

## Quick start

\`\`\`bash
npm install
cp .env.example .env.local
# Set GeoNames username and generate 32+ character birth-session key.
npm run dev
\`\`\`

## Existing working routes

- \`/\`: bilingual landing and conversion journey.
- \`/birth-details\`: DOB, time, verified city search and encrypted session.
- \`/relationship\`: two lightweight personalized context questions.
- \`/insight\`: genuine chart-based Venus insight, requires Prokerala credentials.

## Phase 4: premium engine

- \`lib/report/rules.ts\`: pure, deterministic astrology *interpretation* engine with 7 chapters, traceable observed facts, house-ruler comparisons, transparency about conflicting evidence, explicit uncertainty. It does not predict a marriage type with percentages.
- \`lib/prokerala.ts\`: securely fetches real sidereal planet positions (required), and tries D9 Navamsa and Dasha (optional). Missing optional data is disclosed, never fabricated.
- \`lib/report/generate.ts\`: generation entry point for a **future verified payment webhook**, not a public API.
- \`lib/report/store.ts\`: AES-256-GCM-encrypted private reports stored in Upstash REST Redis. In-memory fallback is **only for local development**, not for production.
- \`lib/report/access.ts\`: encrypted, tamper-evident report access cookie. **Development test access is rejected in production.**
- \`GET /api/report\`: returns a complete report only if the server recognizes a valid secure entitlement.
- \`/report\`: premium report storybook, with print-to-PDF and evidence expanders; fails closed without entitlement.
- \`/report/sample\`: public **fictional illustration only**, conspicuously labeled; not a calculated reading for a visitor.
- \`/report/dev\`: local developer page to manually request a REAL report (uses Prokerala) after birth form + relationship questions.
- \`POST /api/report/dev-generate\`: **development environment only** + 32-char server-side secret. Rejected by design in \`NODE_ENV=production\`. Returns a server-set access cookie to open the premium UI.

### Required environment

\`\`\`dotenv
GEONAMES_USERNAME=...
BIRTH_SESSION_SECRET=<random 32+ characters>
PROKERALA_CLIENT_ID=...
PROKERALA_CLIENT_SECRET=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
REPORT_ENCRYPTION_SECRET=<random 32+ characters>
LOVORA_DEV_REPORT_SECRET=<random 32+ characters, local development only>
\`\`\`

For generating test secrets run \`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"\`.

**Never put API keys in the browser or in GitHub.** Do not deploy \`LOVORA_DEV_REPORT_SECRET\` on a public production app.

### Steps for a real dev report

1. Run \`npm run dev\` with GeoNames + Prokerala credentials.
2. Fill out \`/birth-details\` and select your city from the verified suggestions.
3. Answer the two relationship questions.
4. Open \`/report/dev\` and enter your configured development secret.
5. The development report calls Prokerala, stores an encrypted report, sets local dev access and opens \`/report\`.
6. Save PDF with the built-in button (browser print-to-PDF). No PDF service cost.

The page \`/report/sample\` previews the actual layout without API keys, but uses **synthetic facts** and is not proof of astrology accuracy.

## Automated verification

\`\`\`bash
npm run typecheck
npm run test
npm run build
\`\`\`

GitHub Actions CI runs typecheck, report unit tests and production build.

## Critical launch blockers

- **Not launched:** Merchant approval, deployment configuration, real provider integrations, live payment/refund tests and verified Resend email delivery are still pending. Policy pages and email recovery code are implemented; neither substitutes for production acceptance tests.
- The payment webhook currently re-fetches successful payments from Dodo and compares amount, product, checkout session, email and order before requesting report generation. Run a genuine Dodo test payment before enabling live mode.
- Phase 7 replaced the old per-runtime free-preview limiter with shared Upstash counters and configurable daily request ceilings. Verify the configured limits against actual provider quotas before public traffic.
- Historical timezone ambiguity and unusual birthplaces require further live API testing; unusual times currently fail rather than silently normalizing.
- Real Prokerala response variants, provider credit cost, Dasha parsing and D9 mapping require integration tests with legitimate credentials. If Dasha has an unsupported schema, timing is honestly unavailable.
- The engine is transparent **traditional symbolic astrology**, not scientifically validated predictive accuracy, counseling or certainty about a person's real partner.

Premium reports remain private, and new payments stay disabled by default until all launch checks are satisfied.


## Phase 5 — Dodo checkout integration (implemented, not live-validated)

### Routes

- `POST /api/checkout` — requires the verified free insight, adult acknowledgement from the form, receipt email, and `LOVORA_PAYMENTS_ENABLED=true`. Creates a single-use Dodo hosted checkout for the preconfigured product.
- `POST /api/webhooks/dodo` — checks Standard Webhooks signature with raw body and server secret, then re-fetches Dodo payment details. Success must match the stored order, email, checkout session, product, INR currency, and ₹299 before fulfillment. Failed/cancelled and refund events do not grant access.
- `/checkout/return` — customer status page. Dodo's query-string `status` is never trusted.
- `POST /api/checkout/status` — accepts only the signed first-party checkout browser cookie plus matching order ID; returns pending/failed/generating/ready. When ready, issues an HttpOnly premium access cookie.
- `GET /api/report` — for non-development orders, re-checks Redis purchase state and report binding before sending premium information. Refunded/revoked orders are denied.

### Environment variables (server-only)

```dotenv
LOVORA_BASE_URL=https://your-approved-domain.example
LOVORA_PAYMENTS_ENABLED=false
DODO_PAYMENTS_ENVIRONMENT=test_mode
DODO_PAYMENTS_API_KEY=
DODO_LOVORA_PRODUCT_ID=
DODO_PAYMENTS_WEBHOOK_KEY=
```

Other required configuration: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `PROKERALA_CLIENT_ID`, `PROKERALA_CLIENT_SECRET`, `REPORT_ENCRYPTION_SECRET` and GeoNames/Birth Session settings.

1. Obtain explicit Dodo business/astrology product approval using an eligible adult-operated merchant account.
2. In **Dodo test mode**, create a **one-time product** with base price **INR 299.00**, not subscription or pay-what-you-want. Verify that taxes are included so the customer is not billed extra, and the final settled payment's `total_amount` matches 29900 paise. The server refuses product-id, base currency or product price mismatch.
3. Create an API key with the minimum required product read, checkout creation and payment read permissions; paste the key only into encrypted hosting environment settings.
4. Add webhook URL `https://your-approved-domain.example/api/webhooks/dodo` under Developer → Webhooks. Subscribe to `payment.succeeded`, `payment.failed`, `payment.processing`, `payment.cancelled` and applicable refund/dispute events. Copy its own signing secret into `DODO_PAYMENTS_WEBHOOK_KEY`.
5. Point `LOVORA_BASE_URL` to the exact web origin (HTTPS, no extra path). Switch `LOVORA_PAYMENTS_ENABLED=true` only while testing in test mode.
6. Run one successful **test-mode** checkout, a failed checkout, a cancelled checkout, duplicate webhook deliveries, delayed payment confirmation, and a refund. Verify no report is exposed until success, report generation is idempotent, and revoked reports fail access checks.
7. Only after policy pages, support contact, merchant approval, price/tax checks, security review and actual test receipts are complete should the account switch to live mode and test the real product.

The server uses Upstash Redis to persist private 90-day orders and one fulfillment lock per purchase. It stores encrypted birth-session snapshots, removes them once a report is created, and leaves live payment disabled without explicit configuration.

**Current limitations:** A lost browser checkout cookie can be replaced with the email-recovery flow when a valid purchase is indexed and Resend email delivery is configured; the recovery flow has not yet been tested against live email delivery. Underlying astrology APIs, Dodo API and webhook events could not be exercised without merchant-owned secrets. Taxes, localized pricing and real checkout UI must be manually checked in Dodo test mode; a checkout can be rejected after verification if the amount differs from INR 299. Production legal/refund pages exist, but merchant/operator details and final policy review are required before live sales.

## Phase 6 — account-free email report recovery, legal and Hindi report

### Working routes

- `/recover`: request an email recovery link for the purchase email.
- `POST /api/recovery/request`: generic response regardless of whether an order exists, hashed IP/email throttling, latest paid order lookup via a private HMAC email index, 15-minute one-time token, Resend transactional email.
- `/recover/verify?token=...`: confirmation screen that clears the token from the browser URL after hydration. Email scanners visiting this URL do not consume the token.
- `POST /api/recovery/consume`: atomically consumes token using Redis `GETDEL`, then checks the linked order is still paid, ready and not revoked before setting secure HttpOnly report access.
- `/privacy`, `/terms`, `/refunds`, `/support`: policy/support content with operating entity and email dynamically rendered from the environment. Live checkout refuses operation without those values.
- `/report`, `/report/sample`: English ↔ Hindi premium reading including seven localized chapters, personalized traditional interpretation, evidence explanations and print-to-PDF in the selected language. Sample printouts have a prominent illustrative-only label.

### Additional server environment

```dotenv
RESEND_API_KEY=
RESEND_FROM_EMAIL=LOVORA <reports@YOUR_VERIFIED_DOMAIN>
LOVORA_OPERATOR_NAME=
LOVORA_SUPPORT_EMAIL=
```

**Resend setup:** Verify a sending domain you control in Resend. Create an API key with email-sending permissions. Configure the sender address using that verified domain. Emails contain a recovery link only, not sensitive birth details. All sensitive values belong in encrypted server hosting settings, **not** public NEXT_PUBLIC variables or GitHub.

**Important:** Redis order records, email index and reports expire after approximately 365 days. Recovery currently opens the **latest eligible purchased report** for a given email; multi-report browsing/history and an administrative deletion workflow are not implemented. Once an order is refunded, recovery access is denied by the live order check. This approach does not recover historical paid orders created before the recovery index existed unless an eligible fulfillment/indexing retry processes them.

### E2E scenarios still requiring real credentials

1. Real GeoNames place selection and historical timezone conversion.
2. Prokerala actual paid/free chart response and D9/Dasha compatibility.
3. Dodo test-mode approved INR one-time product, successful checkout, webhook signature and provider re-fetch, duplicated webhook, failed checkout, delayed fulfillment and refund reversal.
4. Real Resend transactional delivery from verified sender, nonexistent address generic response, consumed/expired recovery token, different device recovery and revoked-order access.
5. Hindi reading UX on mobile and actual generated Hindi print/PDF font rendering, including clearly marked sample printout.
6. Signed merchant/legal identity, applicable data privacy and refund policy legal review, verified adult-operated merchant approval.

**Do not enable live payments merely because GitHub build passes.** `LOVORA_PAYMENTS_ENABLED=false` is the safe default until provider test receipts, merchant approval and customer-support details are verified. Currently no real external API request, email delivery, paid purchase or refund has been tested using merchant-owned credentials.

## Phase 7 provider-cost and fulfillment resilience

- Public city search, birth verification and free astrology now require **shared Upstash Redis** rate counters, not per-instance memory. The default global 24-hour ceilings are 900 place searches, 250 birth verifications and 100 free chart requests. Adjust with server-only `LOVORA_PLACES_PER_DAY`, `LOVORA_BIRTH_VERIFICATIONS_PER_DAY`, and `LOVORA_FREE_CHARTS_PER_DAY` (each 1–5000) after checking provider quota. When Redis is unavailable, calls fail closed rather than spending unbounded third-party credits.
- Paid report generation now attempts at most six times, with backoff across webhook deliveries and browser polling. A paid order that exhausts attempts displays a support path instead of silently draining paid Prokerala credits. Merchant support must resolve a stuck purchase or provide an appropriate refund; never tell the customer to buy again.
- Payment state changes and report readiness use atomic Redis scripts to prevent a refund/dispute racing a successful webhook or report write.
- Historical birth times in DST folds/gaps are rejected as ambiguous rather than silently choosing an incorrect instant.
- **Still needs real integration testing:** GeoNames, Prokerala, Dodo test checkout/refund, Resend recovery, taxes and mobile PDF. No production credentials are embedded in this repository.

## Operator preflight (no real transactions)

Run `npm run preflight` locally after configuring `.env.local`, or run it in a provisioned deployment shell. It verifies required keys **by presence only**, HTTPS origin, paid-mode settings, and cost ceilings. It deliberately **does not send paid requests**, publish a site, fetch payment data, claim merchant approval, or verify external credentials; conduct provider-specific sandbox tests manually.

If checkout is disabled by default, missing payment settings are reported as preparation tasks, not reasons to expose a nonfunctional live pay button. **An eligible adult merchant must obtain Dodo approval** and supply verified contact/operating details before actual charges.


## Offline birthplace directory (Phase 8)

City autocomplete and city resolution use the bundled package `countries-states-cities-service@1.5.1` and local latitude/longitude timezone lookup via `@photostructure/tz-lookup@11.7.0`. **No GeoNames web services, account, username or HTTP calls are required at runtime.** The old `GEONAMES_USERNAME` configuration is obsolete.

City coverage is broad but not exhaustive; some smaller villages may be absent. Timezone boundaries from a compressed geographic dataset are approximations, especially around borders; unusual/historic birth times need further verification before charging users. Never invent location coordinates.

**Attribution:** Geographic source data is from dr5hn/countries-states-cities-database (ODbL, attribution required) and GeoNames (CC BY 4.0, attribution required). The npm wrapper is MIT licensed. Timezone lookup uses CC0 data. Review dataset redistribution/share-alike terms before commercial publishing.

## Read-only live provider verification

After the production variables are configured in the **server environment** (never GitHub), run `npm run verify:live` from a trusted shell with a protected `.env.local`. It checks the active switches, Upstash PING, Prokerala OAuth and the Dodo **live** ₹299 one-time tax-inclusive product. It performs **no purchase**, creates **no checkout**, sends **no email**, and cannot validate webhook delivery or real unlock. Never put credentials in the repository or paste them into chats. A green check does not prove merchant approval or successful live settlement. Conduct an authorized end-to-end transaction only after merchant approval, and verify Dodo webhook delivery plus report unlock and email recovery before public launch.
