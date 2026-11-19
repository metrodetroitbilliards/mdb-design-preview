# Top Shooter backend deployment preparation - 2026-11-18

## Provisioned with owner authorization (message 1041)
- Created D1 database `mdb-top-shooters-2026`, ID `1daf0325-e101-44b2-8a66-d5c62e48387d`.
- Initialized schema and seed on the empty database. Remote queries verified 81 players, 104 qualifying listings, 5 events closed with capacity 24, 0 registrations, and both discipline-allowance triggers.
- Added production `TOP_SHOOTERS_DB` binding, encrypted `TOP_SHOOTERS_RATE_SALT`, and `TOP_SHOOTERS_ENABLED=0`. Secret generated in memory and sent directly to Cloudflare; never printed or saved locally.
- Verified all previous editor variables, preview environment, build settings, domains and latest production deployment unchanged. No redeployment was performed; newly configured binding/variables take effect on the next deployment. No claim of live new-backend operation.
- Private sanitized pre-change snapshot: workspace tmp/top-shooter-project-before-1041.json. Verification: tmp/top-shooter-db-verification-1041.json and tmp/top-shooter-binding-verification-1041.json.
- Next: reviewed migration implementation/import, controlled deployment and hosted runtime/auth verification. Public intake remains on the existing Google Form; final cutover remains separate.

## Live inspection completed after owner login (message 1038)
- Managed Chrome now runs in interactive Windows session 1; owner completed Cloudflare login. Account/project APIs successfully read through authenticated dashboard. CLI OAuth remains separate and was not changed.
- Pages project mdb-design-preview uses GitHub main, build command `exit 0`, output `launch-preview`; domains include apex, www and pages.dev. Latest production deployment: 6e004a1c-d957-4b26-be9e-59af9785c3b4.
- Production and preview compatibility date 2026-10-20, no compatibility flags, both fail_open=false. Production retains the six existing Access/editor variables including encrypted EDITOR_GITHUB_TOKEN; preview env_vars empty. No D1 bindings returned in either environment. Account D1 list empty.
- Existing Access app MDB Private Editor covers metrodetroitbilliards.com/admin, matches configured AUD and has one Allow policy limited to the league Gmail address. Anonymous owner API requests returned 401 on the canonical domain and 403 on pages.dev. This verifies denial, not successful authenticated new-owner API behavior (new backend not deployed).
- Sanitized inspection evidence saved outside repo in workspace tmp/top-shooter-hosting-inspection-20261118.json and tmp/top-shooter-access-inspection-20261118.json. No secret values captured.
- Login blocker resolved. Remaining account changes are concrete: provision dedicated D1, initialize schema/seed, bind TOP_SHOOTERS_DB and add rate salt; do not enable signup or change public links until migration and runtime verification. No remote changes performed during this inspection.

## Verified now
- Owner message 1030 authorizes the next task: inspect hosting and prepare backend deployment. Zac has communicated the time shift; no further notice is pending from this agent.
- Remote repository main remains 645c509a69713b441c5ff3533198fe85280c55c9, matching the feature branch base. No push, production deployment or remote configuration write performed.
- 23/23 Node tests passed. Wrangler 4.158.0 compiled Pages Functions successfully into ignored test-results/deployment-worker.
- Wrangler whoami reports not authenticated. Existing-session Chrome connection is unavailable. Managed browser reaches Cloudflare sign-in; continuing with the remembered league account reaches Google sign-in, not an authenticated dashboard. Owner sign-in is required; historical October authentication is not current proof.
- Private reviewed migration snapshot is outside this repository: workspace tmp/top-shooter-migration-reviewed-1023.json. 14 retained entries, 4 excluded, 0 unresolved; original responses and duplicate provenance preserved. Do not publish this file or include it in a deployment archive.

## Inspect after account access is restored (read only first)
1. Confirm league Cloudflare account and Pages project mdb-design-preview; record current production deployment and Git branch/output configuration.
2. Export/snapshot existing project configuration privately, redacting secret values. Inspect production and preview bindings, variable names/types, compatibility date/flags and fail-closed behavior. Do not replace the whole project configuration.
3. List D1 databases and confirm whether TOP_SHOOTERS_DB already exists. Inspect its schema/data before any changes. Never seed/reset a populated database.
4. Verify Access application covers exact /admin plus subpaths, allows only the owner, and matches runtime issuer/AUD. Preserve the existing editor configuration.

## Proposed backend changes (not executed)
- Create a dedicated D1 database if absent; bind as TOP_SHOOTERS_DB. Keep preview and production databases separate.
- Apply signup/schema.sql and signup/seed.sql to the new empty database once. Verify 81 players, 104 qualifying division entries, 13 divisions, five events, 24 capacity each, all initially closed.
- Add encrypted TOP_SHOOTERS_RATE_SALT without printing or recording its value. TOP_SHOOTERS_ENABLED must remain disabled until initialization, migration and access checks are ready.
- Preserve ACCESS_TEAM_DOMAIN, ACCESS_AUD, EDITOR_EMAIL, EDITOR_ORIGIN, EDITOR_BRANCH and EDITOR_GITHUB_TOKEN. Do not copy the publishing token into a preview environment.
- Maintain launch-preview as static output, root functions/ as Functions source, existing routes and DNS unchanged. Redeploy is needed for new bindings.
- Do not use the loopback preview server in production; its synthetic database and owner bypass are local-only.

## Preview authentication constraint
The owner middleware deliberately rejects any origin other than EDITOR_ORIGIN. A pages.dev branch preview is not an authenticated owner preview automatically. Use a separately protected preview hostname/project with its own Access configuration and matching EDITOR_ORIGIN, or explicitly reviewed production-host staging with public signup links unchanged. Do not weaken the origin/JWT checks to make a preview work.

## Acceptance checks before cutover
- Anonymous owner routes denied; valid owner session accepted; wrong issuer/audience/email/origin denied.
- Real D1 catalog, controlled synthetic submission, retry, receipt across requests, cancellation, duplicate/allowance and capacity checks. Local Node tests are not proof of hosted D1/Access.
- Build and verify an idempotent import from the reviewed manifest, retaining source IDs/timestamps and all duplicate provenance; do not treat a JSON review manifest as an already executed import.
- Refresh old form at cutover, reconcile any new submissions and preserve old guarantees. Never run two independent active intake stores without reconciliation.
- Only after final launch authorization change signup links / close old intake. Rollback retains D1 and reconciles new entries before reverting links.

## External reference
Cloudflare Pages binding configuration, checked November 18:
https://developers.cloudflare.com/pages/functions/bindings/#d1-databases
