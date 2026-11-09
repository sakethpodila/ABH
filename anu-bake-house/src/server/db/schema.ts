import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// The first migration establishes catalogue/review storage only. Order and invoice
// tables follow the next workflow-design milestone; do not imply those features exist.
export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    category: text('category').notNull(),
    description: text('description').notNull().default(''),
    status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
    revision: text('revision').notNull().default(''),
    imagePath: text('image_path'),
    available: integer('available', { mode: 'boolean' }).notNull().default(true),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    index('products_category_idx').on(table.category),
    check('product_status_valid', sql`${table.status} IN ('draft', 'published')`),
  ],
);

export const productVariants = sqliteTable(
  'product_variants',
  {
    id: text('id').primaryKey(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    sizeLabel: text('size_label').notNull(),
    preparation: text('preparation', { enum: ['with-egg', 'eggless', 'not-applicable'] }).notNull(),
    pricePaise: integer('price_paise').notNull(),
    available: integer('available', { mode: 'boolean' }).notNull().default(true),
  },
  (table) => [
    uniqueIndex('product_variants_option_idx').on(
      table.productId,
      table.sizeLabel,
      table.preparation,
    ),
    check(
      'variant_price_nonnegative',
      sql`${table.pricePaise} >= 0 AND typeof(${table.pricePaise}) = 'integer'`,
    ),
    check(
      'variant_preparation_valid',
      sql`${table.preparation} IN ('with-egg', 'eggless', 'not-applicable')`,
    ),
  ],
);

export const productTags = sqliteTable('product_tags', {
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'restrict' }),
  label: text('label').notNull(),
  key: text('key').notNull(),
}, (table) => [
  uniqueIndex('product_tags_product_key_idx').on(table.productId, table.key),
  check('product_tag_label_length', sql`length(${table.label}) BETWEEN 1 AND 32`),
]);

export const reviews = sqliteTable(
  'reviews',
  {
    id: text('id').primaryKey(),
    displayName: text('display_name').notNull(),
    rating: integer('rating').notNull(),
    body: text('body').notNull(),
    status: text('status', { enum: ['pending', 'approved', 'rejected'] })
      .notNull()
      .default('pending'),
    socialSharingConsent: integer('social_sharing_consent', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAt: integer('created_at').notNull(),
    moderatedAt: integer('moderated_at'),
  },
  (table) => [
    index('reviews_status_created_idx').on(table.status, table.createdAt),
    check(
      'review_rating_valid',
      sql`${table.rating} BETWEEN 1 AND 5 AND typeof(${table.rating}) = 'integer'`,
    ),
    check('review_status_valid', sql`${table.status} IN ('pending', 'approved', 'rejected')`),
  ],
);
