# Anu's Bake House

Astro + React + TypeScript foundation for a mobile/desktop-friendly public menu and a private bakery workspace. **This is boilerplate, not a completed order-management application.**

Read the workspace [AGENTS.md](../AGENTS.md), [context](docs/PROJECT_CONTEXT.md), [status](docs/STATUS.md), [architecture](docs/ARCHITECTURE.md), and [decisions](docs/DECISIONS.md) before further work.

## Run locally

Use Node >=22.23.4 (Node 24 recommended) and npm. From this directory:

```powershell
npm ci
Copy-Item .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

Open the local URL printed by Astro (normally http://127.0.0.1:4321).

Use `npm ci` for reproducible installs from the committed lockfile. Direct framework packages are pinned; the lockfile also records transitive versions.

| Route | Current behaviour |
| --- | --- |
| `/` | Branded public foundation with an interactive collection preview |
| `/menu` | Menu categories and current-menu contact link; no live catalogue |
| `/reviews` | Honest review-space placeholder; no fake submissions/testimonials |
| `/admin` | Protected React workspace shell |
| `/api/health` | Public liveness response, no secret/configuration disclosure |
| `/api/admin/status` | Protected foundation-status response |

Customers never need accounts. All quotations/order/invoice workflows are future private functionality.

## Admin development preview

Default access is closed. For explicit local UI work, set `LOCAL_ADMIN_PREVIEW=true` in ignored `.dev.vars`, restart `npm run dev`, and open `/admin` on loopback. The page labels this as a local preview. The flag grants access only in Astro development mode on `localhost`, `127.0.0.1`, or `::1`; it does not work in the built Worker or on remote hosts. No customer records are loaded.

For actual login, configure Cloudflare Access and `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `ADMIN_EMAILS`. The server validates signatures and claims, not just a supplied email header. Missing configuration returns 503. No real login configuration or remote resources are included.

## Checks

```powershell
npm run check
npm test
npm run build
npm run preview
```

The preview command serves the built Cloudflare Worker locally. Admin access still requires verified Access credentials in this mode.

## Database

```powershell
npm run db:generate
npm run db:migrate:local
npm run db:inspect:local
```

Only products, product variants, and moderated reviews have initial tables. The database starts empty. Local D1/R2 state is under ignored `.wrangler/`. Money is stored as integer paise. No production migrations, seed data, order writes, or uploads occur automatically.

## Hosting

The target is **direct Cloudflare Workers**, with D1, R2, and Access in the user's account. `wrangler.jsonc` contains local placeholder resource names and a placeholder database ID; it must be reviewed/replaced for a separately authorized launch. There is intentionally no deploy script. The local Wrangler helper rejects remote/deploy operations.

No cloud resource or paid plan was provisioned in this milestone. The old private Sites draft is not used by this application.

Public pages have noindex/robots restrictions until launch. Image transformation is passthrough; no paid image service is configured. Real catalogue freshness, uploads, backups, usage alerts, domain setup, public review abuse controls, and production Access policies must be completed before launch.

## Ongoing context

New chats need access to this workspace and must read AGENTS.md; they do not automatically inherit this conversation. After substantive work, update STATUS.md with changes and exact checks, DECISIONS.md when decisions change, and architecture/context when their facts change. Never store credentials or personal admin details in these documents.
