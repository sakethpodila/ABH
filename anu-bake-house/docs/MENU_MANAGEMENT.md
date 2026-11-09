# Menu drafts: first vertical slice

Approved scope: list, create, reopen, edit, preview, upload images, and locally publish/unpublish products with public menu reads. Availability controls, product deletion, bulk import, and online deployment remain deferred.

## How a save works

1. In `/admin`, select **Menu**, then **Add product**. `src/components/MenuManager.tsx` keeps unsaved form entries in React state. Category suggestions are editable text; they are not a verified catalogue. Each option has a size/pack label, preparation choice, and rupee price.
2. **Save draft** sends JSON to `POST /api/admin/menu`. Editing an existing draft uses `PUT /api/admin/menu/:id` and includes the revision received when it was opened.
3. Existing middleware verifies the administrator and rejects private mutations without a matching Origin. Private responses use `no-store`. Local preview still requires development mode, explicit opt-in, and loopback; built code fails closed without Access configuration.
4. `src/server/menu-api.ts` limits request size to 32 KiB, parses JSON, and returns useful errors. `src/server/menu.ts` validates required text, 1–40 options, preparation choices, duplicate size/preparation pairs (case-insensitive), and exact rupee amounts. Prices are converted to integer paise; the browser's validation is only a convenience.
5. D1 saves product details, options, and publication status in one transactional batch. Any SQL failure rolls back the whole save. Each successful save receives a new revision; stale edits return 409 and cannot change options or status. Future quote/order relationships must be reviewed before extending option replacement.
6. The screen returns to the list and reloads it. `GET /api/admin/menu` lists draft and published products; `GET /api/admin/menu/:id` reopens one with its options and revision. Saved products persist in local D1; unsaved entries do not.

## Storage and preview

- Reuses `products` and `product_variants`; no additional business tables.
- Migration `0001_tearful_jack_flag.sql` adds `status` (defaults to `draft`, constrained to draft/published) and `revision`. It was generated, reviewed, and corrected before application: additive ALTER statements replace invalid generated table-copy SQL and preserve variant foreign keys. The original applied migration is unchanged.
- **Save draft** keeps a new product private. **Publish** saves current values with explicit `intent: publish`. Published edits use **Save & update public menu**; **Save & unpublish** saves current values with `intent: unpublish` and returns it to draft. Raw status fields cannot publish a product. Internal slugs derive from IDs; no product detail URLs are exposed.
- **Preview** renders unsaved entries within the protected workspace and does not save or publish. Public `/menu` renders saved published products on demand, grouped by category. No rebuild is needed; an already-open menu needs refreshing to show changes. Empty and unavailable-storage states are distinct.
- Public DTOs exclude revisions, timestamps, slugs, and private object paths. Product-based public image URLs re-check publication and the current image on each request. Public menu/images use no-store; draft and unpublished images return 404. Products without images have no invented public photo.
- Without an upload, previews show the existing `rose-cake.jpg` as a clearly labelled sample photo.
- No unknown cupcake units or minimum quantities have been assumed. The only local sample is Classic Chocolate using the four user-supplied cake prices.

## Product-image upload

The add/edit form accepts one optional JPEG, PNG, or WebP up to 5 MB. It first checks file size/type and asks the browser to decode the image, then sends the original file bytes to protected `POST /api/admin/menu-images`. The server independently limits streamed size, compares the declared type to its file signature, and stores the bytes under a random R2 key without retaining the original filename. This is signature validation, not a full server-side decoder or metadata sanitizer.

The returned private image URL appears in the form and preview immediately. Saving verifies the R2 object exists, then stores the path with the product. Reopening reloads the same path. Removal clears the association on save; another file replaces it. Neither deletes stored objects. Abandoned uploads and previous versions remain until cleanup is designed. Files retain original content/metadata; no paid transformations are used. Publishing intentionally makes the current attached image publicly readable through its product URL; remote R2 setup and deployment remain future steps.

## Validation results

## Manual tags and list actions

- The optional Tags field accepts comma-separated labels, with suggestion buttons for Seasonal, Best seller, and Discounted. Custom labels work too. Tags appear in the private preview and published product cards. They do not change prices or calculate discounts; business owners assign claims manually.
- Server validation trims/normalizes whitespace, deduplicates case-insensitively, and limits input to 12 tags of 32 characters each. Migration `0002_spotty_wiccan.sql` adds only `product_tags`; existing product records remain intact. Tag replacement shares the atomic product/options save and revision guard.
- Public category and tag choices come from published products and update on the next request. Category and tag selections combine using AND. Links use query parameters, so filtering works without client JavaScript. All categories/All tags and Clear filters reset selections; an empty match has a clear message.
- Each list row shows Edit, then Publish or Unpublish. These use protected PATCH with intent/revision and change only saved publication state. The existing form actions save current edits as before. Failed or stale actions return errors without overwriting product details.
- Browser validation temporarily added Seasonal, saved/reopened/previewed it, exercised combined public filters, and used both row publication actions. The temporary tag was removed and the original published state restored; description, photo, and prices were preserved.

`tests/menu.test.ts` runs actual service SQL against SQLite through a D1-compatible test adapter. It checks migration preservation, create/read/update, exact prices, option replacement, stale-edit rejection, draft-only access, rollback of failed batches, API identity requirements, malformed/oversized requests, and invalid inputs. Existing auth/money/schema tests remain in place.

Local browser validation exercised save/reopen/edit/preview against real D1, including a temporary ₹499.25 edit restored to the supplied ₹499. Form and preview were checked at 320 px without horizontal overflow. A final native unsaved-change confirmation test stalled browser automation; its dismiss/accept behaviour was not verified. Core save/reopen/preview checks completed before that stall.
