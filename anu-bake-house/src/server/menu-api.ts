import type { APIContext } from 'astro';
import { getDraft, listDrafts, MenuError, saveDraft, validateDraft, setPublication } from './menu.ts';
import { productImageId } from '../business/product-image.ts';

async function readJson(request: Request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json')
    throw new MenuError(415, 'Send product details as JSON.');
  const reader = request.body?.getReader();
  if (!reader) throw new MenuError(400, 'Enter product details.');
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 32768) { await reader.cancel(); throw new MenuError(413, 'Product details are too large.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new MenuError(400, 'Product details contain invalid JSON.'); }
}

export async function menuApi(context: APIContext, db: D1Database | undefined, action: 'list' | 'get' | 'create' | 'update' | 'publication', bucket?: R2Bucket) {
  const headers = { 'Cache-Control': 'no-store' };
  if (!context.locals.admin) return Response.json({ error: 'Administrator sign-in is required.' }, { status: 401, headers });
  if (!db) return Response.json({ error: 'Menu storage is unavailable.' }, { status: 503, headers });
  try {
    if (action === 'list') return Response.json({ products: await listDrafts(db, true) }, { headers });
    const id = context.params.id;
    if ((action === 'get' || action === 'update' || action === 'publication') && (!id || !/^[a-zA-Z0-9-]{1,80}$/.test(id)))
      throw new MenuError(400, 'Invalid product reference.');
    if (action === 'get') return Response.json({ product: await getDraft(db, id!, true) }, { headers });
    const input = await readJson(context.request);
    if (action === 'publication') {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new MenuError(400, 'Invalid publishing action.');
      const { intent, revision } = input as Record<string, unknown>;
      if (intent !== 'publish' && intent !== 'unpublish') throw new MenuError(400, 'Invalid publishing action.');
      if (intent === 'publish') {
        const product = await getDraft(db, id!, true);
        if (product.imagePath && (!bucket || !await bucket.head(`menu-images/${productImageId(product.imagePath)}`))) throw new MenuError(400, 'Product image is unavailable. Edit the product before publishing.');
      }
      return Response.json(await setPublication(db, id!, revision, intent === 'publish' ? 'published' : 'draft'), { headers });
    }
    const { imagePath } = validateDraft(input);
    const intent = (input as Record<string, unknown>).intent;
    if (intent !== undefined && intent !== 'publish' && intent !== 'unpublish') throw new MenuError(400, 'Invalid publishing action.');
    if (imagePath) {
      if (!bucket) throw new MenuError(503, 'Image storage is unavailable.');
      if (!await bucket.head(`menu-images/${productImageId(imagePath)}`)) throw new MenuError(400, 'Uploaded image was not found. Please upload it again.');
    }
    const result = await saveDraft(db, input, action === 'update' ? id : undefined, intent === 'publish' ? 'published' : intent === 'unpublish' ? 'draft' : undefined);
    return Response.json(result, { status: action === 'create' ? 201 : 200, headers });
  } catch (error) {
    if (error instanceof MenuError) return Response.json({ error: error.message }, { status: error.status, headers });
    return Response.json({ error: 'Unable to access menu storage. Please try again.' }, { status: 503, headers });
  }
}
