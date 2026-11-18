# Top Shooter signup upgrade — working preview, not published

Owner request: Zac, Telegram poolleague2 message 992, November 17, 2026. Separate branch `feature/top-shooter-signup-20261117` from origin/main `645c509`. No old form or public signup links changed.

## Owner rules confirmed November 18 (message 1001)
- Maximum **24 players in each event**. All five event seeds now use capacity 24; owner/API/database reject capacities above 24.
- Count qualifying listings separately by discipline. One listing allows either date, not both; two listings allow both dates. Having one 8-ball and one 9-ball listing does not grant two 8-ball entries.
- Eligibility allowances are stored explicitly from division-entry counts. Database triggers enforce the allowance atomically across pending, waitlisted and confirmed entries, even across simultaneous/separate requests. A cancelled entry releases its allowance so a player can change dates. No listings or registration records are deduplicated away to calculate allowances.
- UI displays each discipline's allowance and disables additional date choices once selected. Server remains authoritative, including registrations made on another device.
- 23 Node tests pass, including a 25th confirmation rejection, one-list atomic/separate/concurrent submissions, two-list eligibility, cross-discipline isolation and cancellation. Browser checks verify both one-list and two-list choices; four viewport widths and receipt/owner flows pass. Worker compiled.
- Capacity/multiple-date policy questions are resolved. Migration reconciliation, production setup/testing and authorized cutover remain. No live form/site changes.

## Implemented
- Player name/division search; discipline-eligible future event choices; contact details, review, cash entry total and explicit pending-review receipt.
- 81 distinct exact-name player records representing 104 division entries. Seed is the October 26 website snapshot plus Zac's November 17 Jenn Karchefske correction. All events at 2:30 PM, The Rack, Livonia. $20 is inherited from the existing public form, not a newly approved fee.
- D1-compatible SQL persistence; atomic multi-event submissions; one active entry per player/event; payload-bound idempotent retry; server-side event eligibility and closure validation.
- Private management link using a random UUID token (hash only in database); token in URL fragment, not query string. Receipt/cancellation never expose email or phone; no contact-data lookup by name or reference alone.
- Requests start pending review. Owner can confirm, waitlist, cancel, mark paid and check in. Capacity must be set before confirmations; conditional SQL prevents oversubscription. Cancelling does NOT automatically promote a waitlisted player or issue a refund.
- Owner can set event capacity and open/closed state. Capacity cannot go below confirmed count. Owner writes recorded in audit table.
- Owner API uses existing `/admin/*` Cloudflare Access middleware, including JWT issuer/audience/email checks and same-origin write protection. Missing auth/config fails closed. API request size limit, honeypot, bounded fields and hashed-IP ten-minute rate window. Public name lookup is NOT identity verification; owner review is intentional.
- No email/SMS sends, automated reminder jobs, payments, or public player contact data. The screen explicitly states that no confirmation email was sent.

## Run and test locally
`npm ci`
`npm test`
`node scripts/preview-top-shooters.mjs`

Local preview: http://127.0.0.1:8799/top-shooter-signup/
Local owner desk: http://127.0.0.1:8799/admin/top-shooters.html

Preview binds loopback only, uses an in-memory database, opens events with capacity 24, and displays a preview banner. Its local owner bypass exists ONLY in the preview server; never deploy that server. No real form responses are loaded into the preview. Restart resets preview entries. Preview browser tests use synthetic contact data and the published qualifier names.

`node scripts/test-top-shooter-ui.mjs` uses the workspace's existing Playwright package and installed Chrome. Screenshots in ignored test-results/. Four widths: 320,390,768,1440. Runs search, eligible dates, error/retry, actual local SQL write, receipt reload, cancellation, owner roster. This is not a live Cloudflare persistence test.

Compile candidate with Wrangler Pages Functions build; output to ignored test-results/worker.js. Production output remains launch-preview. Only new `/api/top-shooters` added to _routes.json; admin routes preserved. Existing signup buttons remain on Google Forms until cutover.

## Existing signup preservation
Read-only backup of all 13 Google Form responses saved outside the repository: workspace tmp/top-shooter-existing-responses.json (private). No pagination remains. Linked response sheet identified through authenticated Forms API. No Google content edited.
`node scripts/review-legacy-signups.mjs PRIVATE_BACKUP_PATH` performs a non-mutating reconciliation: 11 responses match by normalized name; 2 require identity/eligibility review; 19 selected events contain 1 duplicate player/event selection. This is a preliminary exact-name comparison, not proof all responses belong to this session or have valid current eligibility. Retain every original response. Do not silently discard mismatches or import all as confirmed.

## Launch checklist — not executed
1. Owner reviews preview and inherited $20 fee. Capacity 24 and listing-count eligibility are confirmed (November 18); do not ask again. Approve final qualifier snapshot; Jenn correction currently applies to the local seed only.
2. Reconcile all 13 existing responses (including the 2 unmatched names and duplicate selection), identify cancellations, confirm current-session selections and preserve original IDs/timestamps in a private migration manifest. Build a reviewed idempotent migration, not an ad-hoc append. Existing guaranteed registrations must not be displaced.
3. Inspect current Cloudflare environment; create/bind a dedicated D1 database as TOP_SHOOTERS_DB only with launch authorization. Apply schema/seed once to the empty database. Seed events are CLOSED, capacity 24. Do not rerun seed against populated tables. This schema includes the eligibility table and enforcement triggers; an existing preview database must be recreated or explicitly migrated, never silently reset a production database.
4. Configure secret TOP_SHOOTERS_RATE_SALT and set TOP_SHOOTERS_ENABLED=1 only after migration and Access verification. Configure capacities and open states through the private owner desk. Preserve all existing bindings, editor settings, routes, build output and DNS.
5. Deploy candidate, verify unauthenticated owner API denial, authenticated owner access, public catalog, an authorized controlled registration, idempotent retry, persisted receipt across requests, and cancellation. Local tests/Worker compilation do not establish this.
6. Short cutover window: preserve final old-form response backup, import delta with review, freeze old intake only with owner authorization, reconcile counts, then update existing signup links in both site mirrors and generators. Do not run two independent intake stores without reconciliation.
7. Rollback: point links back to original form; keep new database intact and export/reconcile new entries first. Never drop or reset the database to roll back.

## Remaining work explicitly not claimed complete
Live D1 provisioning and persistence proof, reviewed existing-response migration, publication/cutover, email delivery/reminders, and secure recovery of lost private links. Owner can resolve lost-link cases using private roster/contact verification. Capacity and qualification decisions are not invented.

## Technical references
Cloudflare D1 batch transaction semantics: https://developers.cloudflare.com/d1/worker-api/d1-database/
Original form: https://docs.google.com/forms/d/e/1FAIpQLSf-DMyB17ldzG8CxDKVErUqZ1FbeIYsMxvUEaTIb2wqoOUn0w/viewform
