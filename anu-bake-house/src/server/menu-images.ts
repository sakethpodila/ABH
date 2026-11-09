import type { APIContext } from 'astro';
import { MAX_PRODUCT_IMAGE_BYTES, PRODUCT_IMAGE_ID, PRODUCT_IMAGE_TYPES } from '../business/product-image.ts';
import { MenuError } from './menu.ts';

export function imageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value)) return 'image/png';
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

async function readImage(request: Request) {
  if (Number(request.headers.get('Content-Length')) > MAX_PRODUCT_IMAGE_BYTES)
    throw new MenuError(413, 'Choose an image no larger than 5 MB.');
  const reader = request.body?.getReader();
  if (!reader) throw new MenuError(400, 'Choose an image to upload.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_PRODUCT_IMAGE_BYTES) { await reader.cancel(); throw new MenuError(413, 'Choose an image no larger than 5 MB.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

export async function menuImageApi(context: APIContext, bucket: R2Bucket | undefined, action: 'upload' | 'read') {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (!context.locals.admin) return Response.json({ error: 'Administrator sign-in is required.' }, { status: 401, headers });
  if (!bucket) return Response.json({ error: 'Image storage is unavailable.' }, { status: 503, headers });
  try {
    if (action === 'read') {
      const id = context.params.id;
      if (!id || !PRODUCT_IMAGE_ID.test(id)) throw new MenuError(404, 'Image not found.');
      const object = await bucket.get(`menu-images/${id}`);
      const contentType = object?.httpMetadata?.contentType;
      if (!object || !contentType || !PRODUCT_IMAGE_TYPES.includes(contentType)) throw new MenuError(404, 'Image not found.');
      return new Response(object.body, { headers: { ...headers, 'Content-Type': contentType, 'Content-Disposition': 'inline', 'Content-Security-Policy': "default-src 'none'; sandbox" } });
    }
    const declaredType = context.request.headers.get('Content-Type')?.split(';')[0].trim() ?? '';
    if (!PRODUCT_IMAGE_TYPES.includes(declaredType)) throw new MenuError(415, 'Choose a JPEG, PNG, or WebP image.');
    const bytes = await readImage(context.request);
    const detectedType = imageType(bytes);
    if (detectedType !== declaredType) throw new MenuError(415, 'The file contents do not match a supported image type.');
    const id = crypto.randomUUID();
    await bucket.put(`menu-images/${id}`, bytes, { httpMetadata: { contentType: detectedType } });
    return Response.json({ imagePath: `/api/admin/menu-images/${id}` }, { status: 201, headers });
  } catch (error) {
    return Response.json({ error: error instanceof MenuError ? error.message : 'Unable to access image storage. Please try again.' }, { status: error instanceof MenuError ? error.status : 503, headers });
  }
}
