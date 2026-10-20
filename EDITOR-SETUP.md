# Private website editor — staged, not enabled

Owner route: `https://metrodetroitbilliards.com/admin/`.
Authentication is **required in both Cloudflare Access and the Pages Function**.
Missing configuration returns 503; absent/invalid credentials return 401/403.
The public site remains static. Only `/admin` and `/admin/*` invoke Functions.
No passwords, GitHub tokens, draft content or private account details belong in chat or source control.

## Scope

Form-based editing: homepage announcement/headline/introduction; About text;
contact email and public links; season labels; league nights; events; FAQs;
player tools; homepage/About PNG/JPEG images. Existing layout is preserved.
Full bylaws text, FargoRate division directories, registration/awards application
logic and page-layout redesign are not editable in this first version. Shop
checkout/payment integration remains deferred. No existing public content changes
are bundled with this editor.

Drafts are stored **on this browser/device only** when Save draft is pressed.
They are not shared across devices. Download draft backup is available. An older
revision draft is not restored automatically over a newer site revision.
Preview is server-rendered, sandboxed and non-interactive. Publish commits all
edited content plus six freshly pre-rendered pages and images in one Git commit.
GitHub triggers the existing Cloudflare deployment. The UI separately checks
whether public content matches the published digest; a commit is not called live
until that check succeeds. Concurrent updates are rejected, never force-pushed.

## Setup sequence (owner/dashboard actions required)

1. In Cloudflare Zero Trust / Access, create a **Self-hosted application** for
   `metrodetroitbilliards.com/admin` and its subpaths. Verify the application
   covers both the exact `/admin` route and `/admin/*`; add both public-hostname
   path entries if needed. Do not protect the whole public website.
2. Use one-time PIN email login (or an existing trusted identity provider).
   Create an Allow policy with **Emails equals metrodetroitbilliards@gmail.com**.
   Do NOT select Everyone, an entire email domain, or a Bypass policy.
   Recommended session duration: one hour. Confirm only the owner has mailbox access.
3. Record the Access team domain (like `example.cloudflareaccess.com`) and the
   application's AUD tag. These are identifiers, not passwords.
4. Under Pages `mdb-design-preview` Settings > Variables and Secrets, set:
   - `ACCESS_TEAM_DOMAIN`: exact Access team hostname, no scheme/path
   - `ACCESS_AUD`: application's audience tag
   - `EDITOR_EMAIL`: `metrodetroitbilliards@gmail.com`
   - `EDITOR_ORIGIN`: `https://metrodetroitbilliards.com`
   - `EDITOR_BRANCH`: `main`
   - `EDITOR_GITHUB_TOKEN`: **encrypted secret**, never a plain-text variable
5. Generate the token in the owner's GitHub account, as a fine-grained token
   limited to **metrodetroitbilliards/mdb-design-preview** with Contents read/write
   and required Metadata read. No Actions, administration or unrelated-repo access.
   Choose a finite expiration and record a renewal reminder. Paste directly into
   Cloudflare's encrypted secret field, never into chat, files, or browser code.
   If account/organization policy blocks fine-grained access, stop and review the
   approved GitHub App alternative; do not substitute an all-repository token.
6. Deploy the reviewed editor branch only after local checks pass. For the existing
   Git integration, keep framework None, build command `exit 0`, output
   `launch-preview`, root blank. `package.json`/lockfile supply Function dependencies;
   Functions reside at repository root in `functions/`, outside static output.
   Ensure the deployment log includes successful Functions compilation.
7. Configure Pages Functions to **fail closed**, not fail open, on quota exhaustion.
   API cannot be served statically, but fail-closed also keeps the editor shell private.
8. Verify anonymous requests to `/admin`, `/admin/`, `/admin/index.html`, editor assets
   and `/admin/api/content` cannot open the editor. Verify wrong-user login is denied.
   `www`, `pages.dev` and branch-preview aliases are deliberately rejected by the
   backend origin check even if Access is not installed on those alternate hosts.
9. Sign in as owner. Confirm current content, image selection, draft save/restore and
   preview. Test publication on a **separate test branch/project** first; do not point
   production at a test branch or publish fabricated changes to the live site.
   For the first production write use an owner-approved real correction, then verify
   the deployment digest, browser content and no-JavaScript fallback. No registration
   or payment submissions are required.

## Recovery and maintenance

Every publish is one Git commit. Restore through a reviewed Git revert commit (not
a forced branch reset). Back up the repository and owner content; a Pages deployment
rollback alone will be superseded by the next Git deployment. If access is lost,
recover Cloudflare/GitHub via the owner's accounts; never add a public bypass.
Public site rendering logic is compiled into `editor-lib/site-renderer.js` with
`npm run prepare:renderer`; rerun this after changing `launch-preview/app.js`.
Run `npm test` and Wrangler Functions compilation before deployment.

## Not yet proven

Live Access policy, real owner email sign-in, encrypted publishing credential,
hosted Functions behavior and an actual GitHub-to-Cloudflare publish/rollback are
not proved by local mocks. Do not call this an operational private online editor
until those checks pass. Existing website registration and awards are unchanged.

References: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
and https://developers.cloudflare.com/pages/functions/routing/ .
