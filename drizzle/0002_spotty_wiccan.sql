CREATE TABLE `product_tags` (
	`product_id` text NOT NULL,
	`label` text NOT NULL,
	`key` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "product_tag_label_length" CHECK(length("product_tags"."label") BETWEEN 1 AND 32)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_tags_product_key_idx` ON `product_tags` (`product_id`,`key`);