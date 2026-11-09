# Decisions

## Accepted

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-11-09 | Make anu-bake-house the standalone repository root, retaining one self-contained AGENTS.md and one setup README.md | User requested removal of the outer ABH documents and duplicate project layer while preserving context retrieval and Git history |
| 2026-11-09 | Reserve root/application READMEs for developer setup and usage; keep agent instructions and continuing-chat context in AGENTS.md and docs/ | User requested conventional onboarding documentation instead of agentic context in README.md |
| 2026-11-08 | Add light/dark setting across public and private pages, stored in the browser | User requested a top-right cupcake/chocolate toggle and brand-matched dark colours; system preference supplies the initial theme |
| 2026-11-08 | Use Balium Filled for public menu title, category headings, and product names; Amarna for other text and pages | Corrected the earlier interpretation of the user's annotated font exceptions |
| 2026-11-08 | Use the supplied Balium demo font on local public menu display text; retain its license and review web distribution before launch | The user supplied the font for the menu, while its license restricts redistribution and the filename identifies it as a demo with bad kerning |
| 2026-11-08 | Public menu selectors show the saved price for one cake size and preparation | The user confirmed quantity means 500 g / 1 kg; no customer total or quotation calculation is introduced |
| 2026-11-08 | Add a manual, swipeable homepage cake gallery using existing photos and a CSS pink frame | The user asked to see the rose cake, mango cake, and mango cheesecake in a stack; subject-only cutouts would require image editing |
| 2026-11-08 | Do not include the supplied CakeNom font in the business site | Its accompanying `info.txt` permits non-commercial use only; native text selection also cannot change font family |
| 2026-11-08 | Show a persistent workspace sidebar above 850px and a hamburger drawer at 850px and below | Keep section access visible when space allows and preserve room for content on narrow screens |
| 2026-11-08 | Use a fixed hamburger and left modal drawer at workspace widths up to 850px | Keep mobile navigation reachable while scrolling, including narrow landscape layouts |
| 2026-11-08 | Use the cake logo for site identity and the mom mascot for the kitchen introduction | User requested the logo as the page icon, a more prominent logo, and the mascot beside the story |
| 2026-11-08 | Customer site is menu and reviews; no customer accounts or checkout | Orders remain in social-media conversations |
| 2026-11-08 | Quote calculations, discounts, orders, invoices, payments, metrics are private | These are business tools for the user and mom |
| 2026-11-08 | Astro + React + TypeScript | Lightweight public pages with interactive private components |
| 2026-11-08 | Target direct Cloudflare Workers, D1, R2, Access | Minimise recurring platform subscriptions |
| 2026-11-08 | Responsive browser application first | Same application should work on desktop and phones |
| 2026-11-08 | Boilerplate first; implement reviewed workflows incrementally | User explicitly rejected a one-pass full build |
| 2026-11-08 | Maintain AGENTS.md and living context/status documents | Future chats must recover decisions from the repository |
| 2026-11-08 | Plain token-based CSS initially | Enough for brand and responsive foundations; avoid unnecessary UI dependencies |
| 2026-11-08 | No deployment or paid provisioning in this milestone | This authorization is for local repository boilerplate |
| 2026-11-08 | Override the Cloudflare Vite plugin's ws dependency to 8.22.1 | Its exact 8.22.0 dependency is unavailable in the registry; use the available patch release and retain the lockfile |
| 2026-11-08 | Menu drafts are the first approved vertical slice | The full menu is still being gathered; validate one supplied cake through list/create/edit/save/reopen/private preview |
| 2026-11-08 | Defer publishing, photos, availability controls, deletion, and bulk import | User approved the smaller draft-only proposal; other workflows need discussion |
| 2026-11-08 | Use an existing public-folder cake image as a temporary private-preview photo | User requested a local image for now; the sample caption avoids implying a verified product association. Photo selection/uploads and publishing remain deferred |
| 2026-11-08 | Add optional image upload to product add/edit and private preview | User explicitly requested uploads; local R2 stores original JPEG/PNG/WebP files up to 5 MB, D1 retains their private path. No publishing or remote provisioning |
| 2026-11-08 | Add local Publish and Save & unpublish, backed by on-demand public menu reads | User requested Publish now. Publishing saves current form values; published edits use Save & update public menu. No online deployment |
| 2026-11-08 | Serve public photos through product IDs and re-check publication on every request; no-store for menu/images | Keep draft and replaced/unpublished image references private; immediate freshness on the next request without rebuilds |
| 2026-11-08 | Save draft products/options atomically with revision checks | Prevent partial saves and stale-window overwrites; parameterized D1 SQL stays server-only, Drizzle owns schema/migration metadata |
| 2026-11-08 | Store manual multi-tags in product_tags; derive public category/tag filters from published products | User approved tags now and deferred discount rules. Tags do not change prices or infer sales metrics; custom labels appear automatically |
| 2026-11-08 | List row shows Edit first, followed by Publish or Unpublish | User requested actions in the list layout. PATCH changes only publication state with revision protection; form actions still save current edits |

## Confirmed business facts

- Cake price pairs represent 500 g and 1 kg.
- With-egg/eggless options have separate prices; no universal surcharge assumption.
- Instagram handle and supplied logo/mascot are in PROJECT_CONTEXT.md.

## Open before relevant implementation

- Current public catalogue/prices and which non-cake pack sizes are offered.
- WhatsApp number, pickup/delivery/service area, contact and invoice business details.
- Admin emails and login preference; Cloudflare account/domain ownership.
- Discount scope and order of calculation, delivery/customisation charges, tax configuration if applicable.
- Quotation revision/expiry rules, order confirmation trigger, invoice issuance/correction policy.
- Payment/refund/cancellation rules and dashboard date definitions.
- Exact review form fields, photo-upload requirements, moderation and sharing consent wording.
- Backup/export destination and retention; production hosting budget/alerts.

Do not silently choose these business rules merely because the boilerplate contains provisional types or schema.
