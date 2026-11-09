# Current status

Milestone: local menu management, uploads, and publishing. Date: 2026-11-08, Asia/Calcutta.

## Repository-root consolidation — 2026-11-09

- Consolidated the full working instructions into the application's AGENTS.md, with direct docs/ paths and no parent-file dependency. Retained one developer README and corrected setup commands to run from the same root.
- Removed the duplicate parent ABH/AGENTS.md and ABH/README.md. The target Git repository root is anu-bake-house; source, local environment, D1/R2 state, assets, dependencies, and build paths stay in place.
- Moved Git metadata into anu-bake-house and re-rooted the index to the existing application subtree. Original HEAD `0a0f33143879aae2cfbfa15f8cbfd9db3e023d41` and its history are preserved; no commit was rewritten or created. Structural moves and updated root/context documentation are staged for review; no push was made. A verified pre-consolidation history bundle and index backup are retained under ignored outputs/.
- Future chats should open anu-bake-house as the project and read its root AGENTS.md. Existing context documents remain under docs/.
- Validation: Git reports anu-bake-house as its root; the outer folder contains only that directory. Confirmed one indexed root AGENTS.md/README.md, all four context files reachable directly, three README links valid, and setup script names valid. Application code/assets/migrations match the original committed subtree, and local secrets/data/dependencies/outputs remain ignored and in place. Git integrity and staged/working whitespace checks passed; all 24 tests passed from the new root. No application/schema/runtime changes or deployment.

## Developer setup documentation — 2026-11-09

- Rewrote root README as the repository quick start and application README as the detailed developer setup reference. Removed agent/chat handoff instructions from both; AGENTS.md and existing context documents retain that responsibility.
- Setup now documents Node/npm requirements, reproducible installation, non-overwriting .dev.vars creation on PowerShell/macOS/Linux, all environment settings, local-only admin preview, migrations and persistent D1/R2 state, the implemented menu flow, checks/build/preview, common failures, and pending production configuration.
- Corrected stale README claims that the public menu and private Menu screen were placeholders. Other business-workflow limitations remain explicit.
- Validation: both READMEs checked for balanced code fences and absence of agent/chat handoff instructions; all four relative links resolve, all seven referenced npm run scripts exist, and all five environment-template variables are documented. Commands and behaviour match current configuration/routes/helpers. `git diff --check` passed. No application code, environment values, database records, or dependencies changed; application tests/build were not rerun for this documentation-only change.

## Theme setting — 2026-11-08

- Changed the theme control into a pill-shaped sliding switch with a cupcake/chocolate thumb. Uses accessible switch semantics and preserves the existing saved preference; reduced motion disables the slide transition.
- Switch validation: `npm run check` passed (48 files, no diagnostics), and build passed with local loopback permission.

- Added a fixed top-right theme button on public and workspace pages. Light mode uses an animated cream cupcake SVG; dark mode uses a chocolate bar SVG. CSS animations stop with reduced motion. Icons are original inline vector artwork.
- Dark mode uses chocolate surfaces, cream text, and dusty rose accents, including menu controls and workspace notices. The setting persists locally; system preference is used before a choice is saved. An early head script applies the theme before rendering.
- Validation: check passed (48 files, no diagnostics), build passed with local loopback permission. Browser verified both appearances and persistence after reload. Business workflows remain as documented below; no deployment.

## Latest typography update — 2026-11-08

- Corrected the font mapping: Balium Filled applies to the menu page title, category headings, and product names. Amarna applies to the rest of the public and private pages, including other headings and body text. The supplied fonts and licenses are retained.
- Validation: `npm run check` passed with no diagnostics; build passed with local loopback permission. Browser computed styles confirmed Balium on all three annotated elements and Amarna on supporting text. No business logic changed.

## Latest public design update — 2026-11-08

- Homepage hero now has a three-photo gallery using the existing rose cake, mango cake, and mango cheesecake images. Arrow buttons and mouse/touch swipes change the photo; the image stack has a pink frame. The cake subjects have not been separated from their backgrounds.
- Public menu uses the supplied Balium demo font for its display headings and product names, with readable sans-serif descriptions/controls. Cards and photos are smaller. Each product shows its saved price for the selected size and preparation; changing either dropdown updates the price without a cart or calculated total.
- The font archive's commercial-use license is preserved in `docs/source-assets/`; its redistribution wording and demo/bad-kerning label need review before any production deployment. No online deployment occurred.
- Validation: `npm run check` passed (47 files, no diagnostics), all 24 tests passed, and `npm run build` passed after allowing Astro's local prerender loopback connection. Browser verified mouse swipe, both arrows, all three photos, 500 g/1 kg and egg/eggless price changes, and phone-width layout without horizontal overflow.

## Implemented

- Manual multi-tags in add/edit, suggestions and private preview; tags persist in `product_tags` and appear on published cards. Public category/tag filters derive automatically from published products and combine via query parameters. No discount or sales-metric rules.
- Product rows now show Edit first, then Publish/Unpublish, using a protected revision-checked PATCH that changes only saved visibility. Existing form actions remain.

- Publish and Save & unpublish in the product form, labelled saves for published edits, draft/published status in the list. `/menu` now reads published products/prices on demand. Public image route re-checks publication and current attachment; drafts, revisions, and private image URLs stay out of public output. No schema change/dependency added.

- Replaced unused Next/Vinext starter code with Astro + React + strict TypeScript.
- Official Cloudflare adapter; local-only D1/R2 placeholders; no deployment command.
- Responsive cream/rose/chocolate brand foundation, supplied images, public home and honest menu/review placeholders.
- React collection switcher and private workspace navigation shell.
- Server-side Access JWT verification, email allowlist, same-origin mutation guard, private no-store responses. Local-only opt-in preview; production fails closed.
- Health/status endpoints and protected draft list/read/create/update APIs at `/api/admin/menu` and `/api/admin/menu/:id`.
- Private Menu screen: list, add/edit product, optional description, size/preparation/price rows, save/reopen, and private preview. Labelled controls, responsive option rows, exact paise conversion, duplicate-option validation, atomic saves, and stale-edit rejection.
- Optional product image upload in add/edit: JPEG/PNG/WebP up to 5 MB; protected local R2 upload/read endpoints; thumbnail, replacement/removal, preview, and saved `image_path` persistence. Existing schema reused; no new migration or dependency.
- Catalogue and moderated-review Drizzle schema; migrations `0000` and `0001` applied to local D1 only. New products default to draft; revision markers protect concurrent editing. Reviewed `0001` corrects invalid generated table-copy SQL using additive ALTERs before application.
- Integer-paise parsing/formatting helpers and shared provisional domain types.
- AGENTS.md, README, context/architecture/decision/asset documents and MENU_MANAGEMENT.md implementation walkthrough.

## Not implemented

Previews use the uploaded product photo when present; otherwise they retain the labelled `public/images/rose-cake.jpg` sample. The sample was uploaded and attached locally during validation; its product association is unverified.

Upload cleanup/metadata stripping/optimization; availability controls; product deletion; bulk menu import; review submission/moderation APIs; quotations/discount calculator; saved orders; invoice generation; payment recording; dashboard metrics; other document uploads; social sharing; production login configuration; backups; PWA/native app; real domain/hosting deployment.

Only the Menu section has a business workflow. Other workspace sections remain placeholders with no fake metrics. The public menu displays only deliberately published products. Customer accounts/checkout are explicitly out of scope.

## Validation

- Final HTTP check rejected cross-origin row PATCH with 403. The latest local product snapshot is draft, so the public menu correctly shows its empty-catalogue message; no visibility change was reapplied after that snapshot. Temporary test tags were removed.

- Tags/list actions: `npm run check` passed (45 files, no diagnostics), all 24 tests passed, and `npm run build` passed. Reviewed generated `0002_spotty_wiccan.sql` applied to local D1 only. Tests cover tag normalization/limits, uniqueness/FKs, atomic rollback, stale writes, public draft exclusion, combined filters, and PATCH identity/validation/concurrency. Browser confirmed tag save/reopen/preview, automatically appearing Seasonal filter, combined category/tag selection, and row unpublish/publish. Public filters fit at 320px without horizontal overflow. Temporary tag removed and original published state restored. Screenshot artifacts: ignored `outputs/menu-tag-filters.png` and `outputs/menu-row-publish-actions.png`. No deployment or discount logic.

- Publishing slice: check passed (43 files, no diagnostics), all 21 tests passed, build passed (menu is now on demand; three routes prerender). Tests cover publish/read/update/unpublish, stale intent rejection, transactional publication rollback, API publish intents, public field filtering, and public image gating. Browser published Classic Chocolate and verified all four prices/description/photo on `/menu`, then unpublished and verified the empty menu state. 320px menu had no horizontal overflow. HTTP verified 200/no-store menu and photo while published, with no private image path/revision in public HTML. Screenshot of temporary published state: ignored `outputs/published-menu.png`. Sample returned to draft after validation; no online deployment.

- Product-image slice: `npm run check` passed (41 files, zero errors/warnings/hints), all 20 tests passed, and `npm run build` passed. Tests cover original-byte upload/read round trips, private identity requirements, missing storage, invalid type/signature, oversize bodies, image-path validation, missing uploaded objects, saved image persistence/replacement/removal, and stale-edit protection. Browser uploaded `rose-cake.jpg` through the file chooser to real local R2, saved/reopened the draft, and confirmed a decoded 640px image in preview. Preview fits at 390px without horizontal overflow. HTTP checks: cross-origin image upload 403; private image read 200/image/jpeg/no-store; public menu excludes its reference. Screenshot: ignored `outputs/product-image-preview.png`. Existing description/prices were preserved. Automatic orphan cleanup is deferred; original files/metadata are retained. No remote resources or publishing.

- Temporary preview image: `npm run check` passed (36 files, zero errors/warnings/hints), all 18 tests passed, and `npm run build` passed. Source photo visually inspected; browser review of this small addition remains pending.

- `npm run check`: passed, 36 files; 0 errors, warnings, or hints.
- `npm test`: passed, 18 tests. Existing auth/money/schema coverage plus draft migration preservation, save/reopen/edit, exact prices, option replacement, stale writes, rollback, private-only reads/updates, API identity checks, malformed/oversized bodies, and validation failures.
- `npm run build`: passed; Cloudflare Worker and four public/static routes generated.
- `npm run db:migrate:local`: applied `0001_tearful_jack_flag.sql` successfully after SQL review; original `0000` remains unchanged. No production migration. Local data contains one supplied Classic Chocolate draft with 500 g/1 kg with-egg ₹499/₹999 and eggless ₹599/₹1,199.
- Local HTTP checks: draft list 200/no-store; mutations with missing/foreign Origin 403; public menu 200 and excludes the draft. Built `/admin`, `/api/admin/menu`, and nested draft endpoint return 503/no-store without Access configuration, including when the local preview flag is present.
- Menu browser checks: created the four-option sample, saved/reopened, edited ₹499 to ₹499.25 and confirmed persistence, restored ₹499, then previewed all supplied prices. Form and preview fit at 320 px with no horizontal overflow. Native unsaved-change confirmation stalled browser automation; dismiss/accept behaviour remains unverified. Saved data is intact.
- Browser: public and admin layouts inspected at 1280px and 320px; no horizontal overflow at 320px. Narrow header links were adjusted to 44px targets. Public collection switcher and private module navigation verified. Screenshot artifacts in ignored `outputs/menu-desktop.jpg` and `outputs/menu-mobile.jpg`.
- Dependency installation completed. Direct packages are pinned and lockfile updated. Targeted ws override documented in DECISIONS.md. `npm ls --depth=0` resolved the intended packages. Next/Vinext starter dependencies are absent from package.json/lockfile.
- Static client bundle scan found no Access configuration names or local admin identity. Source images and config contain no actual admin credentials.

## Local environment / repository

- Repository root is `anu-bake-house`, branch `main`. Existing Git history is retained; no remote is configured. Root consolidation creates no new commit or push.
- An ignored `.dev.vars` enables the explicit local-only UI preview on this machine. The distributed `.dev.vars.example` defaults it to false. Built/production code cannot use that preview switch.
- Astro's local tooling copies `.dev.vars` into ignored build output for preview. Do not publish the build directory as a static dump or put real secret values into source; review the production deployment path separately.
- The pre-existing dev server at `http://127.0.0.1:4321` was left running for user review; choose Menu in `/admin`. The separate production-preview server used for validation was stopped afterward.
- No Cloudflare account resources, paid subscription, domain, Access application, or remote database/storage were created. The legacy Sites draft remains private and unpublished; its old setting is unused.
- Removed the unused local `.openai/` legacy Sites metadata. This does not delete or change the remote draft.

## Latest documentation cleanup validation

- Confirmed the legacy metadata folder is absent and active source/configuration has no `.openai/hosting.json` references. Application code and dependencies were unchanged; checks were not rerun for this cleanup.

## Latest branding adjustment — 2026-11-08

- Text selection now uses the shared blush brand token for its background, retaining dark rose lettering and the icing-style shadows. The supplied CakeNom font was not added because its `info.txt` limits use to non-commercial purposes; browser selection cannot switch font families. Normal text remains unchanged.
- The selected text/background color pair measures 7.20:1 contrast. `npm run check` passed (43 files), all 21 tests passed, and `npm run build` passed with loopback permission for Astro prerendering.
- Refined text selection using the user's piped-icing reference: pale pink frosting background, deep rose lettering, and layered cream/pink shadows. Normal text styling remains untouched. Selected text has a computed 7.47:1 color contrast; local browser confirmed the selection visually and computed CSS. `npm run check` passed (43 files), all 21 tests passed, and `npm run build` passed with loopback permission for Astro prerendering.
- Grouped numbered candle images in `public/images/candles/` and updated all workspace navigation references. The earlier number 2 is retained alongside the active transparent version. `npm run check` passed (43 files), all 21 tests passed, and `npm run build` passed with loopback permission for Astro prerendering.
- Extracted candle numbers 1, 3, 4, 5, and 6 from the user's SVG and mapped them to Overview, Orders, Invoices & payments, Menu, and Reviews. Quotations retains the separately supplied number 2. The original SVG is kept in `docs/source-assets/`; browser review confirmed all six icons in desktop sidebar and mobile drawer. `npm run check` passed (43 files), all 21 tests passed, and `npm run build` passed with loopback permission for Astro prerendering.
- Cursor consistency fix: consolidated shared cake/candle cursor tokens, made nested elements and pseudo-elements inherit their control's cursor, restricted the candle to editable text, and explicitly styled file-picker buttons. Disabled controls use `not-allowed`. Browser-computed styles verified public links/brand children/collection buttons, workspace navigation icons, text inputs/textarea, select, file input and its native selector button, and a disabled option-removal button. `npm run check` passed (41 files), all 20 tests passed, and `npm run build` passed. No business-workflow changes.

- Editable text fields now use a slim pink candle cursor with a chocolate outline and yellow flame. Browser text cursor remains the fallback. The new asset is documented in ASSETS.md.
- Validation: browser-computed styles confirmed the candle cursor on text inputs and text areas while buttons retain the cake pointer. `npm run check` passed (36 files), all 18 tests passed, and `npm run build` passed with loopback permission for Astro prerendering.
- Added a transparent, upright cake-slice cursor derived from the user's supplied image. It applies across public and private pages, including links and buttons; browser fallbacks remain in place. Browser-computed styles confirmed the cursor URL on page text, links, and buttons. `npm run check` passed (36 files), all 18 tests passed, and `npm run build` passed with loopback permission for Astro prerendering.
- Text selection across public and private pages now uses a strawberry-pink frosting color, chocolate text, and a subtle cream highlight. CSS-only visual change; `npm run check` passed (36 files), all 18 tests passed, and `npm run build` passed with loopback permission for Astro prerendering.
- Workspace navigation uses the user's number 2 candle temporarily for all sections, sized to suit the labels; the sidebar remains sticky. Image source and rights require review before launch.
- Latest navigation change: check passed (36 files), all 18 tests passed, and build passed with loopback access outside the sandbox. Visual review is pending.

- Original cake logo now identifies browser tabs, the public header, and the workspace. Public header badge is larger (80px desktop / 64px mobile), with a cream border, rose outline, and subtle shadow.
- The kitchen introduction now uses the original mom mascot with rounded corners. Source artwork is unchanged; unused generic favicon removed.
- Validation: `npm run check` passed (36 files, zero errors/warnings/hints); `npm test` passed (18 tests); `npm run build` passed. The first build hit a sandbox-blocked loopback prerender connection; rerun with local-port permission succeeded.
- Browser review confirmed desktop header and mobile header/mascot at 320px, no horizontal overflow, and the logo favicon reference. Existing local dev server remains running. Business workflows and deployment scope are unchanged.

## Continue next

### Mobile workspace navigation — 2026-11-08

- Latest: above 850px the persistent left sidebar is visible; at 850px and below the hamburger opens the same navigation in a left drawer. The drawer closes on section selection, close button, backdrop click, Escape, or resizing to desktop. The top bar remains sticky.
- Verified in the local browser at desktop and 800px: the correct navigation appears at each size, the drawer opens, and resizing wider closes it. `npm run check` passed (36 files), all 18 tests passed, and `npm run build` passed with loopback permission for Astro prerendering.
- Native dialog provides focus containment and Escape dismissal; close button, backdrop dismissal, selection dismissal, and focus return are included. Drawer scrolls for short landscape screens and closes when resizing to desktop. Unsaved menu confirmation remains in place.
- Validation: `npm run check` passed (36 files; zero errors/warnings/hints), all 18 tests passed, and `npm run build` passed after retrying with loopback permission following sandbox EACCES. Interactive browser review remains pending. Other workspace sections remain scaffolding; menu drafts are the implemented workflow.

### Canva design handoff - 2026-11-08

- Exported the current local application to ignored `outputs/canva-design-pack/`: desktop (1280px) and mobile (390px) PDFs, 13 screens each, individual PDFs/PNG references, original image assets/provenance, and import/design-token notes. Includes public pages/404, workspace placeholders, and menu list/add/edit/private preview. No Canva upload, deployment, source UI changes, or draft mutations.
- Validated all 26 individual PDFs as single pages, both combined PDFs as 13 pages, selectable text on every page, and saved product/price text in both edit screens. Rendered all combined PDF pages with Poppler and inspected desktop/mobile contact sheets; no clipping or horizontal overflow. Canva's actual import conversion remains unverified and may alter fonts/grouping.
- Application checks were not rerun because only export artifacts and this status document changed. Existing implementation/scaffolding status above remains unchanged.

1. User reviews the draft menu flow and MENU_MANAGEMENT.md; no next feature without discussion.
2. Finish menu collection, including units/pack sizes and minimum quantities. Cupcake units remain unconfirmed.
3. Review local publish/unpublish and public menu behaviour with the user before the next feature.
4. Later, review quotation -> confirmation -> order -> invoice -> payment examples and business rules before implementing each slice.
5. Reviews/reporting and production launch remain separate future work.

Unknown WhatsApp number, precise service area, admin emails, current catalogue details, and invoice business details must stay unset until confirmed.
