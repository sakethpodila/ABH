# Project context

Last reviewed: 2026-11-09 (Asia/Calcutta).

## Repository and context entry point

`anu-bake-house/` is the standalone Git repository and application root. Open that directory as the project for future work. Its `AGENTS.md` contains the complete working instructions and points directly to this file, STATUS.md, ARCHITECTURE.md, and DECISIONS.md under `docs/`; no parent-directory instruction file is required. README.md is the developer setup guide, not the agent-context entry point.

## Business and assets

- Brand: Anu's Bake House. The mascot represents the user's mom.
- Instagram: https://www.instagram.com/anu_sbakehouse/
- Supplied visual direction: warm cream, dusty rose, strawberry pink, chocolate brown; baking-inspired elements and real product photography.
- Public profile mentions 24–48 hours' advance ordering. Cake menu pairs are confirmed by the user as **500 g / 1 kg**. With-egg and eggless variants have independent prices.
- Categories: cakes, cupcakes, brownies, cookies, chocolates, energy bars; plus Indian hot snacks, pickles, and sweets.
- Public imagery has been collected, but there is no imported/verified live catalogue. See ASSETS.md.
- WhatsApp number, exact service area, business/invoice details, full current menu, dietary details, and registration information are not confirmed. Do not invent them.

## Approved scope

Customers browse the menu and read/submit reviews **without accounts**. Ordering and discussion remain on Instagram/WhatsApp. No public basket, checkout, quotation calculator, or customer account system.

Private workspace, for the user and mom only:
- Maintain products, options, prices, and availability.
- Build/revise/save quotations during social-media conversations; copy/download and manually share them in the chat.
- Convert accepted quotations into database-backed orders; support direct order entry later.
- Issue invoices, record advances and balances, track preparation and payment separately.
- Dashboard: monthly confirmed orders, order value, payments received, outstanding balances, upcoming orders, bestsellers by quantity/value, order sources, and quote conversion.
- Moderate reviews; preserve permission for later social-card generation.

## Scope control

The user stopped an earlier attempt to build the whole product in one pass. Discuss/review business flows and screens incrementally, explaining implementation as work proceeds. Latest authorization: **local menu management**, including drafts, add/edit, save/reopen, preview, image uploads, publish/unpublish, and public menu reads. Availability controls, product deletion, bulk import, other workflows, and production launch require later review. Full menu collection is pending; one supplied cake can be used to validate this slice. Local publishing is not authorization to deploy online.

Selected architecture: Astro + React + TypeScript; proposed direct Cloudflare Workers + D1 + R2 + Access. One responsive application for desktop and mobile. No paid services have been provisioned as part of this milestone.

Latest menu extension: manual multi-tag field (including Seasonal, Best seller, Discounted, and custom labels), automatically derived public category/tag filters, and list-row Edit followed by Publish/Unpublish. Discounted is a manual label only; discount rules are explicitly deferred. No product is automatically labelled as a bestseller or discounted.

Social auto-publishing, payments integration, native mobile apps, offline order editing, and profit/ingredient-cost tracking are later possibilities, not initial requirements. Do not send messages or publish posts without explicit authorization.
