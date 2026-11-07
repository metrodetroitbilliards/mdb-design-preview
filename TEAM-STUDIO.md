# MDB Team Logo Studio

Public page: `/team-studio/`, linked from Shop. Root and `launch-preview` copies must stay identical. The public deployment serves `launch-preview`.

Eight browser-rendered templates, local font files (existing Barlow/Inter licenses in assets), team name/subtitle, two lettering choices, ink/accent/shirt palette, shirt-style and placement concepts. No external generation API, no paid dependency, no remote draft database, no print-file download control. This is a template designer, not free-text AI art generation. Browser-rendered artwork is inspectable/copyable; do not promise copy prevention.

State is versioned in `design.js` and stored locally under `mdb-team-studio-v1`. URL fragment `#design=BASE64URL_JSON` reconstructs the same choices; no identity/contact fields are stored in that recipe. IDs are deterministic labels, not authentication or database keys. Keep version-1 template geometry available if later versions are added so old quotes stay reproducible. Changing font or geometry changes old artwork unless versioned.

The quote review links to the existing Google contact deployment with a bounded `shirt` query parameter. Contact version 2 prefills the `Other` topic and message, includes recipe link, colors, lettering, placement and estimated quantity. The user adds contact details and explicitly submits. No order/payment is placed. Existing email sender, recipient, validation, rate limits and request deduplication are unchanged. No production email was sent during this feature's tests; new prefill was verified live, submission tested with a mock.

Production artwork workflow: reopen the exact recipe, confirm the quote, garment dimensions, colors and decoration method, then render the SVG at the required print dimensions. The browser `logo(state)` function yields vector geometry with text; provide the bundled font faces or outline text before passing SVG to another application. A PNG export must render at final print size, not enlarge a preview screenshot. Embroidery requires separate digitization and proofing. There is no automated Printify order integration.

Shop entry is added in both `app.js` mirrors and the generated `editor-lib/site-renderer.js`, so publishing unrelated private-editor content preserves it. Regenerate renderer with `node scripts/prepare-renderer.mjs`. Existing awards, registration, event and payment behavior remains unchanged.

Verification artifacts and scripts on the owner's workspace: `work/team-logo-studio-20261106/` (outside the public repository). Contact backups: `deployment-before.json`, `head-before.json`, `live-before.json`. Initial contact version 1; new version 2. Website rollback is a revert of the studio feature commit; keep contact v2 if submitted design links are still in use, as it preserves the normal contact route.
