import type { PublicMenuProduct, MenuOption } from '../business/menu';
import { productImageId, PRODUCT_IMAGE_ID, PRODUCT_IMAGE_TYPES } from '../business/product-image.ts';

export async function getPublishedMenu(db: D1Database): Promise<PublicMenuProduct[]> {
  const [productResult, variantResult, tagResult] = await db.batch([
    db.prepare("SELECT id, name, category, description, image_path AS imagePath FROM products WHERE status = 'published' AND available = 1 ORDER BY category COLLATE NOCASE, name COLLATE NOCASE, id"),
    db.prepare("SELECT v.product_id AS productId, v.size_label AS sizeLabel, v.preparation, v.price_paise AS pricePaise FROM product_variants v JOIN products p ON p.id = v.product_id WHERE p.status = 'published' AND p.available = 1 AND v.available = 1 ORDER BY v.rowid"),
    db.prepare("SELECT t.product_id AS productId, t.label FROM product_tags t JOIN products p ON p.id = t.product_id WHERE p.status = 'published' AND p.available = 1 ORDER BY t.rowid"),
  ]);
  const products = productResult.results as (Pick<PublicMenuProduct, 'id' | 'name' | 'category' | 'description'> & { imagePath: string | null })[];
  const variants = variantResult.results as (MenuOption & { productId: string })[];
  const tags = tagResult.results as { productId: string; label: string }[];
  return products.map((row) => ({
    id: row.id, name: row.name, category: row.category, description: row.description,
    imageUrl: productImageId(row.imagePath) ? `/api/menu/images/${row.id}` : null,
    tags: tags.filter((tag) => tag.productId === row.id).map((tag) => tag.label),
    options: variants.filter((option) => option.productId === row.id).map((option) => ({ sizeLabel: option.sizeLabel, preparation: option.preparation, pricePaise: option.pricePaise })),
  })).filter((product) => product.options.length > 0);
}

export async function publicMenuImage(db: D1Database | undefined, bucket: R2Bucket | undefined, id: string | undefined): Promise<Response> {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (!id || !PRODUCT_IMAGE_ID.test(id)) return new Response('Image not found.', { status: 404, headers });
  if (!db || !bucket) return new Response('Menu images are temporarily unavailable.', { status: 503, headers });
  try {
    // Re-check publication on every request, including after unpublishing or replacement.
    const result = await db.prepare("SELECT image_path AS imagePath FROM products WHERE id = ? AND status = 'published' AND available = 1 AND EXISTS (SELECT 1 FROM product_variants WHERE product_id = products.id AND available = 1)").bind(id).all<{ imagePath: string | null }>();
    const imageId = productImageId(result.results[0]?.imagePath);
    if (!imageId) return new Response('Image not found.', { status: 404, headers });
    const object = await bucket.get(`menu-images/${imageId}`);
    const type = object?.httpMetadata?.contentType;
    if (!object || !type || !PRODUCT_IMAGE_TYPES.includes(type)) return new Response('Image not found.', { status: 404, headers });
    return new Response(object.body, { headers: { ...headers, 'Content-Type': type, 'Content-Disposition': 'inline', 'Content-Security-Policy': "default-src 'none'; sandbox" } });
  } catch { return new Response('Menu images are temporarily unavailable.', { status: 503, headers }); }
}
