CREATE TABLE `product_variants` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`size_label` text NOT NULL,
	`preparation` text NOT NULL,
	`price_paise` integer NOT NULL,
	`available` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "variant_price_nonnegative" CHECK("product_variants"."price_paise" >= 0 AND typeof("product_variants"."price_paise") = 'integer'),
	CONSTRAINT "variant_preparation_valid" CHECK("product_variants"."preparation" IN ('with-egg', 'eggless', 'not-applicable'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_variants_option_idx` ON `product_variants` (`product_id`,`size_label`,`preparation`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`image_path` text,
	`available` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`rating` integer NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`social_sharing_consent` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`moderated_at` integer,
	CONSTRAINT "review_rating_valid" CHECK("reviews"."rating" BETWEEN 1 AND 5 AND typeof("reviews"."rating") = 'integer'),
	CONSTRAINT "review_status_valid" CHECK("reviews"."status" IN ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE INDEX `reviews_status_created_idx` ON `reviews` (`status`,`created_at`);