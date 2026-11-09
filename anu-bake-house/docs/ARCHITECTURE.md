# Architecture

## Active foundation

One Astro application with official React and Cloudflare integrations. Astro serves public pages and server endpoints; React islands handle interactive views. Plain CSS with shared tokens establishes the brand without adding a UI-kit dependency. D1 uses SQLite through Drizzle. R2 and Access have typed integration boundaries.

```
Customer (no account) -> public Astro pages -> future public menu/review endpoints
Administrator -> Cloudflare Access -> middleware -> private React workspace/API
                                             -> server services -> D1 / R2
```

## Code boundaries

- `src/config/`: non-secret public brand configuration.
- `src/layouts/`, `src/styles/`: shared layout, design tokens, responsive rules.
- `src/components/`: React islands; no server/database/credential imports.
- `src/business/`: runtime-independent types and integer-paise helpers.
- `src/server/`: Access verification, database and storage helpers, server-only code.
- `src/pages/`: public pages, private page shell, and endpoints.
- `src/middleware.ts`: private route protection, same-origin mutation checks, response headers.
- `drizzle/`: generated schema-only migrations and metadata.
- `tests/`: important security, monetary, and database invariants.

## Rendering and freshness

Brand home/review placeholders prerender. `/menu` renders on demand from D1, selecting only published/available products and available options; it exposes name/category/description/options/prices plus a product-based public image URL. Private pages and admin APIs render on demand. Public menu/image responses and private APIs use no-store, so the next request reflects publish/edit/unpublish without rebuilding. Previously loaded pages are not live-pushed.

No service worker or offline cache is installed. Private routes are `no-store` and `noindex`. Astro sessions are explicitly disabled, avoiding an unused automatic KV binding; Access handles admin identity. Image service is explicitly `passthrough` to avoid implicitly provisioning paid image transforms. Uploaded-file optimisation is future work.

## Authentication

Customers do not authenticate. `/admin`, `/admin/*`, `/api/admin`, and `/api/admin/*` require server-verified Cloudflare Access JWTs. Verification checks signature, issuer, audience, expiry, subject, and email allowlist. Hiding navigation is not access control. Protect these paths in the Cloudflare Access policy at launch; the application guard also protects direct Worker access.

Missing configuration returns 503; missing/invalid identity returns 401; non-admin identity returns 403. Every private mutation must have a same-origin Origin header. A development-only local preview requires `LOCAL_ADMIN_PREVIEW=true`, Astro development mode, and a loopback URL. The built Worker cannot use this bypass.

Access production setup is not complete: team domain, audience, actual admin allowlist, identity-provider settings, and host/path policy need configuration in the user's account. Legacy Sites identity headers are not trusted or used.

## Data model

Implemented schema: products, product variants, and moderated reviews. Products default to draft and carry revision markers for optimistic concurrency. Catalogue variants support size labels and independent preparation-specific integer-paise prices. Reviews default to pending; social-sharing permission defaults to false. There is no customer-account table. One user-supplied Classic Chocolate draft is saved locally; no customer/order records are loaded.

Menu management uses parameterized D1 statements under `src/server/menu.ts`, with atomic batches for product/option/status saves and revision-gated writes. Schema and generated migration metadata remain in Drizzle. Admin list/read APIs include draft and published products. Explicit publish/unpublish intents change status; ordinary updates preserve status. New products otherwise default to draft. No new migration was needed. Future quote/order references require review. See MENU_MANAGEMENT.md for the request path and walkthrough.

Product-image uploads use protected `POST /api/admin/menu-images` and `GET /api/admin/menu-images/:id`. Server code bounds the body to 5 MB and checks allowed MIME types against JPEG/PNG/WebP signatures. Random object keys live under R2 `menu-images/`; admin reads are private/no-store/nosniff. Save validates object existence and writes its path into existing `products.image_path`. Public `/api/menu/images/:productId` re-checks published/available status and serves only that product's current image, with no-store/nosniff. Unpublished/draft image requests return 404. Upload and D1 save are separate; abandoned/replaced objects remain pending cleanup. Remote R2 provisioning is unimplemented.

Next schema milestone, after workflow review: customer contact records (not accounts), quotations and revisions, quote lines, orders and agreed line snapshots, invoices, payments/refunds, audit events. Fulfilment and payment status remain separate. Unique invoice numbers, atomic issuance, duplicate-write protection, and concurrency checks must be designed before implementing writes.

Manual tags use `product_tags(product_id, label, key)` with a product foreign key and unique product/key pair. Migration `0002_spotty_wiccan.sql` was generated/reviewed/applied locally. Server normalization supports up to 12 tags of 32 characters, folds case/spacing for uniqueness, and saves tags in the same revision-gated batch as product/options. Public reads join only published products. `/menu?category=…&tag=…` filters on the server, with choices derived from all visible published products; these are manual labels, not discount logic or measured bestsellers. `PATCH /api/admin/menu/:id` handles list-row publication only and preserves saved product/options/tags.

## Hosting and ownership

Target: user-owned Cloudflare account and domain, source repository owned by the user. `wrangler.jsonc` contains local placeholder bindings only. Do not deploy it as production configuration. D1 and R2 remote resources have not been created.

The old private Sites draft is not part of the active application. Do not republish it.

Proposed production budget: Workers Paid starting at US$5/month plus domain, tax and usage; database/storage can fit included allowances for a small bakery, but this is an estimate, not a cap. No paid plan was enabled. Before launch: reviewed production configuration, secret storage, backups/restore test, logs without personal data, usage alerts/limits, domain, and public/private access verification.
