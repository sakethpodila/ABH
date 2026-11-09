# Anu's Bake House — developer setup

Astro + React + TypeScript application targeting Cloudflare Workers, with D1 for structured data, R2 for uploaded images, and Cloudflare Access for administrator authentication.

Implemented functionality includes private menu editing, product variants and prices, optional image uploads, manual tags, and local publish/unpublish. The public menu displays published products with category/tag filters. Reviews, quotations, orders, invoices, payments, and reporting are not complete.

## Requirements

- **Node.js 24 recommended**, matching `.node-version`. The minimum supported version is **22.23.4**.
- **npm**, bundled with Node.js.
- **Git** for source control.

Check your installation:

```sh
node --version
npm --version
```

Use npm and the checked-in `package-lock.json` for reproducible installs. Astro, Wrangler, and Drizzle are installed locally by `npm ci`; global installations are unnecessary.

Local development does not require a Cloudflare account, account login, domain, or paid subscription.

## 1. Install dependencies

From the repository root:

```sh
npm ci
```

The directory containing this README, `package.json`, and `AGENTS.md` is the repository root. Run all commands in this guide from that directory; no additional nested application directory is needed.

## 2. Create the local environment file

Use `.dev.vars` for server-side Cloudflare variables. No `.env` file is required for the current setup.

**PowerShell:**

```powershell
if (-not (Test-Path -LiteralPath .dev.vars)) {
    Copy-Item -LiteralPath .dev.vars.example -Destination .dev.vars
}
```

**macOS/Linux:**

```sh
if [ ! -f .dev.vars ]; then
    cp .dev.vars.example .dev.vars
fi
```

These commands preserve an existing environment file. Edit `.dev.vars` in your editor and restart the development server after changing it.

### Environment variables

| Variable | Local default | Purpose |
| --- | --- | --- |
| `LOCAL_ADMIN_PREVIEW` | `false` | Set to `true` to inspect and use the private workspace through the development server on loopback. Not a production login mechanism. |
| `ACCESS_TEAM_DOMAIN` | Empty | Cloudflare Access team hostname, such as `my-team.cloudflareaccess.com`, without `https://`. Needed for real Access authentication. |
| `ACCESS_AUD` | Empty | Audience identifier for the Cloudflare Access application protecting the workspace. |
| `ADMIN_EMAILS` | Empty | Comma-separated administrator email allowlist. Required along with Access configuration for real authentication. |
| `TURNSTILE_SECRET_KEY` | Empty | Reserved for future review-submission spam protection; unused by the current implementation. |

For ordinary local menu development, the only value you need to change is:

```dotenv
LOCAL_ADMIN_PREVIEW=true
```

Leave Access and Turnstile values empty when using this local preview. It requires **Astro development mode**, the explicit flag, and a request to `localhost`, `127.0.0.1`, or `::1`. It does not work with `npm run preview` or a deployed Worker.

The `APP_ENV` value in `wrangler.jsonc` is a runtime label, not an authentication switch. D1's `DB` and R2's `BUCKET` are resource bindings defined in that configuration, not credentials to paste into `.dev.vars`.

`.dev.vars` and `.env*` files are ignored by Git. Keep real tokens, personal admin addresses, and credentials out of source files and documentation. Share the template rather than your configured environment file.

## 3. Prepare local storage

```sh
npm run db:migrate:local
```

This applies the checked-in SQL migrations in order to the **local D1 database only**. It does not modify Cloudflare-hosted databases. You do not need to generate migrations when setting up an existing checkout.

Inspect the local table names if needed:

```sh
npm run db:inspect:local
```

The schema currently covers products, product variants, product tags, and moderated reviews. There is no automatic seed/import, so a new checkout has no menu products.

D1 records and local R2 uploads are persisted beneath the ignored `.wrangler/` directory. Keep that directory to retain your local menu and images between sessions. It is machine-local data, not part of a clone or a Git pull. The local R2 emulator is available through the configured `BUCKET` binding when the development server starts; no separate bucket-creation command is needed.

## 4. Start development

```sh
npm run dev
```

Open the URL printed by Astro, normally [http://127.0.0.1:4321](http://127.0.0.1:4321/). Follow the printed port if the default is already occupied.

| Route | Purpose |
| --- | --- |
| `/` | Public homepage |
| `/menu` | Published menu, size/preparation price selectors, and category/tag filters |
| `/reviews` | Placeholder for future customer reviews |
| `/admin` | Private workspace; select **Menu** to manage products |
| `/api/health` | Application liveness response |
| `/api/admin/status` | Protected workspace-status response |

To use another port:

```sh
npm run dev -- --port 4323
```

### Check the menu workflow

1. Enable local admin preview as described above and open `/admin`.
2. Select **Menu**, then **Add product**.
3. Enter the product details and one or more size/preparation/price options. A photo and manual tags are optional.
4. Save the draft, reopen it, and check its private preview.
5. Publish it to make it visible at `/menu`. Refresh an already-open public menu to see changes.
6. Unpublish it to remove it from public menu reads while retaining it in the private list.

Publication here changes the local database; it does not deploy the website online. Public browsing requires no customer account. Other workspace modules remain placeholders.

## 5. Run validation and a built preview

```sh
npm run check
npm test
npm run build
```

Then serve the built Worker locally, on a separate port if development is still running:

```sh
npm run preview -- --port 4322
```

Open [http://127.0.0.1:4322](http://127.0.0.1:4322/). Preview uses the built Cloudflare Worker, rather than the development server.

**Admin authentication differs in built preview:** `LOCAL_ADMIN_PREVIEW=true` cannot bypass it. Without real Access configuration, protected pages/API routes return `503`; with configured Access but no valid token they return `401`. Use `npm run dev` for routine local admin work. Configuring variable names alone does not provide a signed Access token.

The local tooling may copy `.dev.vars` into ignored build output for preview. That output is not a public static-site upload package.

## Everyday development

After pulling changes, stop the development server and run:

```sh
npm ci
npm run db:migrate:local
npm run dev
```

`npm ci` is necessary when dependency/lockfile changes arrive; it can be skipped otherwise. Apply pending migrations when schema changes arrive. Neither command intentionally clears existing local application records.

If you change the database schema yourself:

1. Edit `src/server/db/schema.ts`.
2. Run `npm run db:generate`.
3. Review the generated SQL and metadata under `drizzle/`.
4. Run `npm run db:migrate:local`, then the relevant checks/tests.
5. Include the schema and migration files together in the change. Do not rewrite an already-applied migration.

## Project layout

| Path | Contents |
| --- | --- |
| `src/pages/` | Astro pages and HTTP API routes |
| `src/components/` | Interactive React components |
| `src/layouts/`, `src/styles/` | Shared layout, themes, typography, and responsive styles |
| `src/config/` | Public brand configuration |
| `src/business/` | Shared product types, validation, and money helpers |
| `src/server/` | Authentication, menu services, database, and storage code |
| `drizzle/` | SQL migrations and Drizzle metadata |
| `public/` | Static images, fonts, and other assets |
| `scripts/` | Local Astro/Wrangler command wrappers |
| `tests/` | Automated tests |
| `wrangler.jsonc` | Cloudflare bindings and local runtime configuration |

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Installation reports an unsupported Node version | Run `node --version`; use Node 24 or a version satisfying `package.json`. Run `npm ci` again after switching. |
| Installation fails because of registry/network metadata | Check registry/proxy connectivity and retry `npm ci --prefer-online`. Keep the lockfile; do not bypass dependency checks with `--force`. |
| `/admin` returns `503` during development | Check `.dev.vars` is in this application directory, set `LOCAL_ADMIN_PREVIEW=true`, restart `npm run dev`, and use its loopback URL. |
| `/admin` returns `503` or `401` in built preview | This is expected without configured and verified Access authentication. The development flag is intentionally inactive in built code. |
| Menu/storage errors or a missing-table message | Run `npm run db:migrate:local` from this directory, then restart development. |
| Public menu is empty | Add and explicitly publish a product in the private Menu screen. Drafts are intentionally excluded; fresh local databases are empty. |
| Saved or published changes do not appear in an open menu | Refresh `/menu`; updates are read on the next request, not pushed into already-open pages. |
| Product image is rejected | Use a decodable JPEG, PNG, or WebP up to 5 MB. |
| Existing port is occupied | Follow Astro's printed URL or specify another port with `-- --port 4323`. |
| A restricted environment blocks prerendering or local D1 with `EACCES`/`fetch failed` | Permit the tools' local loopback connections in that environment. This does not require remote database access or online deployment. |

Runtime logs are written under `.wrangler/logs/`. The command wrappers disable Astro telemetry and default Cloudflare telemetry to off; caller-provided Wrangler logging and telemetry settings are preserved.

## Production configuration

The target is direct Cloudflare Workers hosting. The checked-in D1 ID and D1/R2 names are **local placeholders**; production deployment is not configured, and no deploy script is provided.

Production setup will require real D1/R2 bindings, the reviewed migrations, Cloudflare Access host/path policies and server configuration, runtime secrets, a domain, backups, and usage monitoring. Keep private pages and APIs protected. Public indexing restrictions and asset/font licensing also need review before launch.

The local Wrangler wrapper intentionally permits only local database operations. Do not use the placeholder configuration for a production deployment.

## Technical references

- [Architecture](./docs/ARCHITECTURE.md)
- [Menu-management implementation](./docs/MENU_MANAGEMENT.md)
- [Asset provenance](./docs/ASSETS.md)
