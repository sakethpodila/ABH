# Anu's Bake House — working instructions

## Read first

The application is in `anu-bake-house/`. Before changing it, read:
1. `anu-bake-house/docs/PROJECT_CONTEXT.md` — approved scope and business facts.
2. `anu-bake-house/docs/STATUS.md` — what exists, validation, and next work.
3. `anu-bake-house/docs/ARCHITECTURE.md` — architecture and data boundaries.
4. `anu-bake-house/docs/DECISIONS.md` — accepted decisions and unresolved questions.

These files are project memory, not a substitute for checking current code. A new chat must read them; chat history does not automatically transfer. Explicit current user instructions take precedence.

## Collaboration and scope

- Work incrementally. The user explicitly rejected building the entire application in one pass.
- Current authorized milestone: private menu management (list, add/edit, save/reopen, preview, optional image uploads, manual tags, local publish/unpublish from form/list, and public category/tag filters). Discount calculations, availability controls, product deletion, bulk import, other business workflows, and production deployment require further review.
- Do not deploy, provision paid resources, publish, connect social accounts, or send customer messages unless explicitly authorized for that step. The legacy private Sites draft is unused.
- Customers have NO accounts, checkout, cart, or quotation calculator. Public scope is menu browsing and review submission/reading. All pricing calculations, discounts, quotes, orders, invoices, payments, and metrics belong in the private workspace.
- Build one responsive web application. A native mobile application and offline order editing are not approved scope.
- Do not spawn other agents unless the user explicitly requests delegation.

## Engineering rules

- Stack: Astro + React + TypeScript; direct Cloudflare Workers, D1, R2, and Access planned. No Next.js/Vinext/Supabase/Vercel dependencies or Sites publishing helpers in the active application.
- Use stable packages and the lockfile. Keep dependencies purposeful; do not add a full component kit for a placeholder screen.
- Keep Cloudflare/database/secrets code under `src/server/`; never import it into hydrated React components.
- Verify admin identity server-side and fail closed. Missing Access configuration must never grant production access. Any local preview bypass must require development mode, an explicit flag, and a loopback request.
- Protect `/admin` and `/api/admin`, including nested routes. Never put private records into public caches, static output, logs, or client bundles.
- Store monetary values as integer paise. Retain agreed-price snapshots on quotes/orders/invoices. Invoice numbering must be unique and issuance atomic when implemented.
- Order fulfilment and payment status are separate. Dashboard order value and cash received are separate metrics. Never invent financial data, testimonials, registrations, dietary claims, or unavailable product prices.
- Schema changes require generated, reviewed migrations. Never edit an applied migration. No production migrations without the launch step being authorized.
- Preserve supplied logo/mascot and product images. Document provenance and limitations. Avoid paid image transformations unless deliberately approved.
- Use mobile-first layouts, visible keyboard focus, labelled controls, readable contrast, and reduced-motion support.

## Validation and handoff

From `anu-bake-house/`, run appropriate checks: `npm run check`, `npm test`, `npm run build`; run local D1 migrations when schema changes. Tests should cover important logic/security rather than mirror UI implementation.

After every substantive change, update `docs/STATUS.md` and its validation results. Record changed decisions in `docs/DECISIONS.md`; update architecture/context only when those facts change. Keep these documents concise and consistent; do not save secrets, personal admin emails, tokens, or entire chat transcripts. Finish by stating what works and what is still scaffolding.
