import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { APIContext } from 'astro';
import { menuImageApi, imageType } from '../src/server/menu-images.ts';
import { MAX_PRODUCT_IMAGE_BYTES, productImageId } from '../src/business/product-image.ts';

test('private image upload and read round-trip retains original bytes and content type', async () => {
  const objects = new Map<string, { bytes: Uint8Array; type: string }>();
  const bucket = {
    async put(key: string, bytes: Uint8Array, options: { httpMetadata: { contentType: string } }) { objects.set(key, { bytes, type: options.httpMetadata.contentType }); },
    async get(key: string) { const object = objects.get(key); return object ? { body: object.bytes, httpMetadata: { contentType: object.type } } : null; },
  } as unknown as R2Bucket;
  const photo = readFileSync(new URL('../public/images/rose-cake.jpg', import.meta.url));
  function context(body?: Uint8Array, type = 'image/jpeg', admin = true, id?: string) {
    return { params: { id }, locals: { admin: admin ? { subject: 'test' } : undefined },
      request: new Request('http://localhost/api/admin/menu-images', { method: body ? 'POST' : 'GET', headers: { 'Content-Type': type }, body: body as BodyInit | undefined }),
    } as unknown as APIContext;
  }
  assert.equal((await menuImageApi(context(photo, 'image/jpeg', false), bucket, 'upload')).status, 401);
  assert.equal((await menuImageApi(context(photo), undefined, 'upload')).status, 503);
  const uploaded = await menuImageApi(context(photo), bucket, 'upload');
  assert.equal(uploaded.status, 201);
  const { imagePath } = await uploaded.json() as { imagePath: string };
  const id = productImageId(imagePath);
  assert.ok(id);
  const response = await menuImageApi(context(undefined, 'image/jpeg', true, id), bucket, 'read');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'image/jpeg');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array(photo));
  assert.equal((await menuImageApi(context(undefined, 'image/jpeg', false, id), bucket, 'read')).status, 401);
  assert.equal((await menuImageApi(context(undefined, 'image/jpeg', true, '../secret'), bucket, 'read')).status, 404);
  assert.equal((await menuImageApi(context(undefined, 'image/jpeg', true, crypto.randomUUID()), bucket, 'read')).status, 404);
  for (const [bytes, type, status] of [
    [new TextEncoder().encode('<svg></svg>'), 'image/svg+xml', 415],
    [new TextEncoder().encode('<html>wrong file</html>'), 'image/jpeg', 415],
    [photo, 'image/png', 415],
    [new Uint8Array(), 'image/jpeg', 415],
    [new Uint8Array(MAX_PRODUCT_IMAGE_BYTES + 1), 'image/jpeg', 413],
  ] as const) assert.equal((await menuImageApi(context(bytes, type), bucket, 'upload')).status, status);
  assert.equal(objects.size, 1, 'rejected uploads must not write storage');
});

test('only supported image signatures and private upload references are accepted', () => {
  assert.equal(imageType(new Uint8Array([137,80,78,71,13,10,26,10])), 'image/png');
  assert.equal(imageType(new TextEncoder().encode('RIFF0000WEBP')), 'image/webp');
  assert.equal(imageType(new Uint8Array([0xff,0xd8,0xff])), 'image/jpeg');
  assert.equal(imageType(new TextEncoder().encode('<svg>')), null);
  for (const path of ['https://example.test/a.jpg', '/images/rose-cake.jpg', '/api/admin/menu-images/../secret', null]) assert.equal(productImageId(path), null);
});
