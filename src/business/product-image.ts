export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PRODUCT_IMAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export function productImageId(path: unknown): string | null {
  if (typeof path !== 'string' || !path.startsWith('/api/admin/menu-images/')) return null;
  const id = path.slice('/api/admin/menu-images/'.length);
  return PRODUCT_IMAGE_ID.test(id) ? id : null;
}
