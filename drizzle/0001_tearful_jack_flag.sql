-- Reviewed generated migration: additive ALTERs preserve variant foreign keys.
-- The generator's table-copy SQL selected new columns from the old table.
ALTER TABLE `products` ADD `status` text DEFAULT 'draft' NOT NULL CONSTRAINT `product_status_valid` CHECK (`status` IN ('draft', 'published'));--> statement-breakpoint
ALTER TABLE `products` ADD `revision` text DEFAULT '' NOT NULL;
