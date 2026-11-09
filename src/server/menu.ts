import { rupeesToPaise } from '../business/money.ts';
import { productImageId } from '../business/product-image.ts';
import { normalizeMenuTags, menuLabelKey } from '../business/menu-tags.ts';
import type { MenuDraft, MenuOption, MenuSummary } from '../business/menu';

export class MenuError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

function field(value: unknown, label: string, max: number, optional = false): string {
  if (typeof value !== 'string') throw new MenuError(400, `${label} must be text.`);
  const text = value.trim();
  if ((!optional && !text) || text.length > max)
    throw new MenuError(400, `${label} ${optional ? 'must be' : 'is required and must be'} at most ${max} characters.`);
  return text;
}

export function validateDraft(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new MenuError(400, 'Enter product details.');
  const data = value as Record<string, unknown>;
  const name = field(data.name, 'Product name', 120);
  const category = field(data.category, 'Category', 60);
  const description = field(data.description ?? '', 'Description', 2000, true);
  let tags: string[];
  try { tags = normalizeMenuTags(data.tags); } catch (error) { throw new MenuError(400, (error as Error).message); }
  const imagePath = data.imagePath ?? null;
  if (imagePath !== null && !productImageId(imagePath)) throw new MenuError(400, 'Choose an uploaded product image.');
  if (!Array.isArray(data.options) || data.options.length < 1 || data.options.length > 40)
    throw new MenuError(400, 'Add between 1 and 40 options.');
  const seen = new Set<string>();
  const options: MenuOption[] = data.options.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object') throw new MenuError(400, 'Invalid option.');
    const option = entry as Record<string, unknown>;
    const sizeLabel = field(option.sizeLabel, 'Size / pack', 80);
    const preparation = option.preparation;
    if (preparation !== 'with-egg' && preparation !== 'eggless' && preparation !== 'not-applicable')
      throw new MenuError(400, 'Choose a valid preparation.');
    const key = JSON.stringify([sizeLabel.toLowerCase(), preparation]);
    if (seen.has(key)) throw new MenuError(400, 'Each size and preparation combination must be unique.');
    seen.add(key);
    let pricePaise: number;
    try { pricePaise = rupeesToPaise(field(option.price, 'Price', 20)); }
    catch { throw new MenuError(400, 'Enter each price in rupees with at most two decimal places.'); }
    return { sizeLabel, preparation, pricePaise };
  });
  return { name, category, description, imagePath: imagePath as string | null, tags, options };
}

export async function listDrafts(db: D1Database, includePublished = false): Promise<MenuSummary[]> {
  const result = await db.prepare(
    includePublished
      ? 'SELECT id, name, category, status, revision FROM products ORDER BY category COLLATE NOCASE, name COLLATE NOCASE, id'
      : "SELECT id, name, category FROM products WHERE status = 'draft' ORDER BY category COLLATE NOCASE, name COLLATE NOCASE, id",
  ).all<MenuSummary>();
  return result.results;
}

export async function getDraft(db: D1Database, id: string, includePublished = false): Promise<MenuDraft> {
  // A D1 batch is a transaction, so the product and options come from the same snapshot.
  const [products, variants, tags] = await db.batch([
    db.prepare(`SELECT id, name, category, description, image_path AS imagePath, revision, status FROM products WHERE id = ?${includePublished ? '' : " AND status = 'draft'"}`).bind(id),
    db.prepare('SELECT size_label AS sizeLabel, preparation, price_paise AS pricePaise FROM product_variants WHERE product_id = ? ORDER BY rowid').bind(id),
    db.prepare('SELECT label FROM product_tags WHERE product_id = ? ORDER BY rowid').bind(id),
  ]);
  const product = products.results[0];
  if (!product) throw new MenuError(404, 'Product not found.');
  return { ...product, options: variants.results, tags: tags.results.map((row) => (row as { label: string }).label) } as unknown as MenuDraft;
}

export async function saveDraft(db: D1Database, input: unknown, id?: string, publication?: 'draft' | 'published'): Promise<{ id: string }> {
  const data = validateDraft(input);
  const productId = id ?? crypto.randomUUID();
  const revision = crypto.randomUUID();
  const now = Date.now();
  const statements: D1PreparedStatement[] = [];
  if (id) {
    const previous = field((input as Record<string, unknown>).revision, 'Draft revision', 80, true);
    // Every statement is gated on the new revision. A stale update cannot touch options.
    statements.push(db.prepare(
      'UPDATE products SET name = ?, category = ?, description = ?, image_path = ?, status = COALESCE(?, status), revision = ?, updated_at = ? WHERE id = ? AND revision = ?',
    ).bind(data.name, data.category, data.description, data.imagePath, publication ?? null, revision, now, id, previous));
    statements.push(db.prepare(
      'DELETE FROM product_variants WHERE product_id = ? AND EXISTS (SELECT 1 FROM products WHERE id = ? AND revision = ?)',
    ).bind(id, id, revision));
    statements.push(db.prepare('DELETE FROM product_tags WHERE product_id = ? AND EXISTS (SELECT 1 FROM products WHERE id = ? AND revision = ?)').bind(id, id, revision));
  } else {
    statements.push(db.prepare(
      'INSERT INTO products (id, slug, name, category, description, image_path, status, revision, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    ).bind(productId, `draft-${productId}`, data.name, data.category, data.description, data.imagePath, publication ?? 'draft', revision, now, now));
  }
  for (const option of data.options) {
    statements.push(db.prepare(
      'INSERT INTO product_variants (id, product_id, size_label, preparation, price_paise) SELECT ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM products WHERE id = ? AND revision = ?)',
    ).bind(crypto.randomUUID(), productId, option.sizeLabel, option.preparation, option.pricePaise, productId, revision));
  }
  for (const tag of data.tags) statements.push(db.prepare(
    'INSERT INTO product_tags (product_id, label, key) SELECT ?, ?, ? WHERE EXISTS (SELECT 1 FROM products WHERE id = ? AND revision = ?)',
  ).bind(productId, tag, menuLabelKey(tag), productId, revision));
  // D1 rolls back the entire batch if any statement fails.
  const result = await db.batch(statements);
  if (result[0].meta.changes !== 1)
    throw new MenuError(409, 'This product changed in another window. Return to the list and reopen it before saving.');
  return { id: productId };
}

export async function setPublication(db: D1Database, id: string, revision: unknown, status: 'draft' | 'published') {
  const previous = field(revision, 'Product revision', 80, true);
  const product = await getDraft(db, id, true);
  if (product.revision !== previous) throw new MenuError(409, 'This product changed in another window. Refresh the list before trying again.');
  if (status === 'published') validateDraft({ ...product, options: product.options.map((option) => ({ ...option, price: `${Math.floor(option.pricePaise / 100)}.${String(option.pricePaise % 100).padStart(2, '0')}` })) });
  const [result] = await db.batch([db.prepare('UPDATE products SET status = ?, revision = ?, updated_at = ? WHERE id = ? AND revision = ?').bind(status, crypto.randomUUID(), Date.now(), id, previous)]);
  if (result.meta.changes !== 1) throw new MenuError(409, 'This product changed in another window. Refresh the list before trying again.');
  return { id };
}
