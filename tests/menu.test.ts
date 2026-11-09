import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { getDraft, listDrafts, saveDraft, validateDraft, setPublication } from '../src/server/menu.ts';
import { menuApi } from '../src/server/menu-api.ts';
import { getPublishedMenu, publicMenuImage } from '../src/server/public-menu.ts';
import type { APIContext } from 'astro';

// Execute the service's actual SQL against SQLite, with D1-compatible batch rollback.
function storage() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter((name) => name.endsWith('.sql')).sort())
    sqlite.exec(readFileSync(new URL(`../drizzle/${file}`, import.meta.url), 'utf8'));
  function prepare(sql: string) {
    let args: (string | number | null)[] = [];
    const query = {
      bind(...values: (string | number | null)[]) { args = values; return query; },
      async all() { return query.execute(); },
      execute() {
        const statement = sqlite.prepare(sql);
        if (/^SELECT/i.test(sql)) return { results: statement.all(...args).map((row) => ({ ...row })), meta: { changes: 0 } };
        return { results: [], meta: { changes: Number(statement.run(...args).changes) } };
      },
    };
    return query;
  }
  const db = {
    prepare,
    async batch(statements: ReturnType<typeof prepare>[]) {
      sqlite.exec('BEGIN');
      try { const results = statements.map((query) => query.execute()); sqlite.exec('COMMIT'); return results; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  } as unknown as D1Database;
  return { db, sqlite };
}

const example = () => ({ name: 'Classic Chocolate', category: 'Cake', description: '', options: [
  { sizeLabel: '500 g', preparation: 'with-egg', price: '499' },
  { sizeLabel: '1 kg', preparation: 'with-egg', price: '999' },
  { sizeLabel: '500 g', preparation: 'eggless', price: '599' },
  { sizeLabel: '1 kg', preparation: 'eggless', price: '1199' },
] });

test('draft migration preserves existing catalogue records and foreign keys', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec('PRAGMA foreign_keys = ON');
    db.exec(readFileSync(new URL('../drizzle/0000_massive_bucky.sql', import.meta.url), 'utf8'));
    db.exec("INSERT INTO products (id, slug, name, category, created_at, updated_at) VALUES ('existing', 'existing', 'Existing', 'Cake', 1, 1)");
    db.exec("INSERT INTO product_variants (id, product_id, size_label, preparation, price_paise) VALUES ('existing-option', 'existing', '500 g', 'eggless', 59900)");
    db.exec(readFileSync(new URL('../drizzle/0001_tearful_jack_flag.sql', import.meta.url), 'utf8'));
    db.exec(readFileSync(new URL('../drizzle/0002_spotty_wiccan.sql', import.meta.url), 'utf8'));
    assert.equal(db.prepare("SELECT status FROM products WHERE id = 'existing'").get()?.status, 'draft');
    assert.equal(db.prepare('SELECT price_paise FROM product_variants').get()?.price_paise, 59900);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.throws(() => db.exec("DELETE FROM products WHERE id = 'existing'"));
  } finally { db.close(); }
});

test('tags persist atomically, stay private on drafts, and list publication changes only status/revision', async () => {
  const { db, sqlite } = storage();
  try {
    const input = { ...example(), tags: [' Seasonal ', 'seasonal', 'Gift box'] };
    const { id } = await saveDraft(db, input);
    const draft = await getDraft(db, id);
    assert.deepEqual(draft.tags, ['Seasonal', 'Gift box']);
    assert.deepEqual(await getPublishedMenu(db), []);
    await setPublication(db, id, draft.revision, 'published');
    const published = await getDraft(db, id, true);
    assert.deepEqual((await getPublishedMenu(db))[0].tags, ['Seasonal', 'Gift box']);
    assert.deepEqual(published.options, draft.options);
    assert.equal(published.name, draft.name);
    assert.deepEqual(published.tags, draft.tags);
    await assert.rejects(setPublication(db, id, draft.revision, 'draft'), /another window/);
    await assert.rejects(saveDraft(db, { ...input, tags: ['Stale'], revision: draft.revision }, id), /another window/);
    assert.deepEqual((await getDraft(db, id, true)).tags, draft.tags);
    assert.throws(() => sqlite.prepare('INSERT INTO product_tags (product_id, label, key) VALUES (?, ?, ?)').run(id, 'Duplicate', 'seasonal'));
    assert.throws(() => sqlite.prepare('INSERT INTO product_tags (product_id, label, key) VALUES (?, ?, ?)').run('missing', 'Tag', 'tag'));
    sqlite.exec("CREATE TRIGGER reject_tag BEFORE INSERT ON product_tags BEGIN SELECT RAISE(ABORT, 'tag failure'); END");
    await assert.rejects(saveDraft(db, { ...input, name: 'Changed', tags: ['New tag'], revision: published.revision }, id), /tag failure/);
    assert.deepEqual(await getDraft(db, id, true), published);
    await setPublication(db, id, published.revision, 'draft');
    assert.deepEqual(await getPublishedMenu(db), []);
    assert.deepEqual((await getDraft(db, id)).tags, draft.tags);
  } finally { sqlite.close(); }
});

test('save, reopen, edit and remove options preserves exact prices and private draft state', async () => {
  const { db, sqlite } = storage();
  try {
    const { id } = await saveDraft(db, example());
    assert.deepEqual(await listDrafts(db), [{ id, name: 'Classic Chocolate', category: 'Cake' }]);
    const first = await getDraft(db, id);
    assert.equal(first.status, 'draft');
    assert.deepEqual(first.options.map((option) => option.pricePaise), [49900, 99900, 59900, 119900]);
    const edited = example();
    edited.options = [{ sizeLabel: 'Box of 6', preparation: 'eggless', price: '650.25' }];
    await saveDraft(db, { ...edited, revision: first.revision }, id);
    const saved = await getDraft(db, id);
    assert.equal(saved.options.length, 1);
    assert.equal(saved.options[0].pricePaise, 65025);
    await assert.rejects(saveDraft(db, { ...example(), revision: first.revision }, id), /another window/);
    assert.deepEqual(await getDraft(db, id), saved, 'stale writes must not replace options');
    assert.throws(() => sqlite.exec("UPDATE products SET status = 'invalid'"));
    await saveDraft(db, { ...edited, revision: saved.revision }, id, 'published');
    assert.deepEqual(await listDrafts(db), []);
    await assert.rejects(getDraft(db, id), /not found/);
    await assert.rejects(saveDraft(db, { ...example(), revision: saved.revision }, id), /another window/);
  } finally { sqlite.close(); }
});

test('publish, public reads/images, published edits, and unpublish follow current saved state', async () => {
  const { db, sqlite } = storage();
  const imagePath = `/api/admin/menu-images/${crypto.randomUUID()}`;
  const input = { ...example(), imagePath };
  const bucket = { async get() { return { body: new Uint8Array([255,216,255]), httpMetadata: { contentType: 'image/jpeg' } }; } } as unknown as R2Bucket;
  try {
    const { id } = await saveDraft(db, input);
    const draft = await getDraft(db, id);
    assert.deepEqual(await getPublishedMenu(db), []);
    assert.equal((await publicMenuImage(db, bucket, id)).status, 404);
    await saveDraft(db, { ...input, revision: draft.revision }, id, 'published');
    const published = await getDraft(db, id, true);
    assert.equal(published.status, 'published');
    assert.equal((await listDrafts(db, true))[0].status, 'published');
    const menu = await getPublishedMenu(db);
    assert.equal(menu.length, 1);
    assert.equal(menu[0].imageUrl, `/api/menu/images/${id}`);
    assert.equal(menu[0].options[0].pricePaise, 49900);
    assert.equal(JSON.stringify(menu).includes('revision'), false);
    assert.equal(JSON.stringify(menu).includes('/api/admin'), false);
    assert.equal((await publicMenuImage(db, bucket, id)).status, 200);
    await assert.rejects(saveDraft(db, { ...input, revision: draft.revision }, id, 'draft'), /another window/);
    await saveDraft(db, { ...input, name: 'Updated cake', revision: published.revision }, id);
    assert.equal((await getPublishedMenu(db))[0].name, 'Updated cake');
    const latest = await getDraft(db, id, true);
    await saveDraft(db, { ...input, revision: latest.revision }, id, 'draft');
    assert.deepEqual(await getPublishedMenu(db), []);
    assert.equal((await publicMenuImage(db, bucket, id)).status, 404);
    assert.equal((await publicMenuImage(db, bucket, '../private')).status, 404);
    assert.equal((await publicMenuImage(undefined, bucket, id)).status, 503);
    const fresh = await getDraft(db, id);
    sqlite.exec("CREATE TRIGGER reject_publish BEFORE INSERT ON product_variants BEGIN SELECT RAISE(ABORT, 'publish failure'); END");
    await assert.rejects(saveDraft(db, { ...input, revision: fresh.revision }, id, 'published'), /publish failure/);
    assert.equal((await getDraft(db, id)).status, 'draft');
    assert.deepEqual(await getPublishedMenu(db), []);
  } finally { sqlite.close(); }
});

test('invalid drafts, duplicate options and unsafe prices are rejected before saving', () => {
  for (const input of [null, {}, { ...example(), name: ' ' }, { ...example(), options: [] },
    { ...example(), options: [example().options[0], { ...example().options[0], sizeLabel: '500 G' }] },
    ...['-1', '0.001', 'NaN', '9007199254740991', ''].map((price) => ({ ...example(), options: [{ ...example().options[0], price }] })),
    { ...example(), options: [{ sizeLabel: '500 g', preparation: 'unknown', price: '5' }] },
  ]) assert.throws(() => validateDraft(input));
});

test('failed variant writes roll back both product and previous options', async () => {
  const { db, sqlite } = storage();
  try {
    const { id } = await saveDraft(db, example());
    const before = await getDraft(db, id);
    sqlite.exec("CREATE TRIGGER reject_variant BEFORE INSERT ON product_variants BEGIN SELECT RAISE(ABORT, 'simulated failure'); END");
    await assert.rejects(saveDraft(db, { ...example(), name: 'Changed', revision: before.revision }, id), /simulated failure/);
    assert.deepEqual(await getDraft(db, id), before);
    await assert.rejects(saveDraft(db, example()), /simulated failure/);
    assert.equal((await listDrafts(db)).length, 1);
  } finally { sqlite.close(); }
});

test('API creates and reloads drafts, rejects bad requests and requires admin identity', async () => {
  const { db, sqlite } = storage();
  function context(body?: string, id?: string, admin = true, contentType = 'application/json') {
    return { params: { id }, locals: { admin: admin ? { subject: 'test', email: 'test@example.test', localPreview: true } : undefined },
      request: new Request('http://localhost/api/admin/menu', { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': contentType }, body }),
    } as unknown as APIContext;
  }
  try {
    assert.equal((await menuApi(context(undefined, undefined, false), db, 'list')).status, 401);
    assert.equal((await menuApi(context(), undefined, 'list')).status, 503);
    assert.equal((await menuApi(context('{'), db, 'create')).status, 400);
    assert.equal((await menuApi(context('{}', undefined, true, 'text/plain'), db, 'create')).status, 415);
    assert.equal((await menuApi(context('x'.repeat(32769)), db, 'create')).status, 413);
    const response = await menuApi(context(JSON.stringify(example())), db, 'create');
    assert.equal(response.status, 201);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    const { id } = await response.json() as { id: string };
    const reopened = await menuApi(context(undefined, id), db, 'get');
    assert.equal(reopened.status, 200);
    const { product } = await reopened.json() as { product: { revision: string } };
    assert.equal((await menuApi(context(JSON.stringify({ ...example(), revision: product.revision }), id), db, 'update')).status, 200);
    assert.equal((await menuApi(context(JSON.stringify({ ...example(), revision: product.revision }), id), db, 'update')).status, 409);
    assert.equal((await menuApi(context(undefined, 'missing'), db, 'get')).status, 404);
    const imagePath = `/api/admin/menu-images/${crypto.randomUUID()}`;
    const input = { ...example(), imagePath };
    assert.equal((await menuApi(context(JSON.stringify(input)), db, 'create')).status, 503);
    const missingBucket = { async head() { return null; } } as unknown as R2Bucket;
    assert.equal((await menuApi(context(JSON.stringify(input)), db, 'create', missingBucket)).status, 400);
    const bucket = { async head() { return {}; } } as unknown as R2Bucket;
    const withPhoto = await menuApi(context(JSON.stringify(input)), db, 'create', bucket);
    assert.equal(withPhoto.status, 201);
    const photoId = (await withPhoto.json() as { id: string }).id;
    const photoDraft = await getDraft(db, photoId);
    assert.equal(photoDraft.imagePath, imagePath);
    const replacement = `/api/admin/menu-images/${crypto.randomUUID()}`;
    await saveDraft(db, { ...input, imagePath: replacement, revision: photoDraft.revision }, photoId);
    const replaced = await getDraft(db, photoId);
    assert.equal(replaced.imagePath, replacement);
    await assert.rejects(saveDraft(db, { ...input, revision: photoDraft.revision }, photoId), /another window/);
    assert.equal((await getDraft(db, photoId)).imagePath, replacement);
    await saveDraft(db, { ...input, imagePath: null, revision: replaced.revision }, photoId);
    assert.equal((await getDraft(db, photoId)).imagePath, null);
    assert.equal((await menuApi(context(JSON.stringify({ ...input, imagePath: 'https://example.test/file' })), db, 'create', bucket)).status, 400);
    assert.equal((await menuApi(context(JSON.stringify({ ...example(), intent: 'unexpected' })), db, 'create')).status, 400);
    const publishedResponse = await menuApi(context(JSON.stringify({ ...example(), intent: 'publish' })), db, 'create');
    assert.equal(publishedResponse.status, 201);
    const publishedId = (await publishedResponse.json() as { id: string }).id;
    const publishedProduct = await getDraft(db, publishedId, true);
    assert.equal(publishedProduct.status, 'published');
    const unpublishedResponse = await menuApi(context(JSON.stringify({ ...example(), revision: publishedProduct.revision, intent: 'unpublish' }), publishedId), db, 'update');
    assert.equal(unpublishedResponse.status, 200);
    assert.equal((await getDraft(db, publishedId)).status, 'draft');
    const row = (await listDrafts(db, true)).find((item) => item.id === publishedId)!;
    assert.equal((await menuApi(context(JSON.stringify({ intent: 'publish', revision: row.revision }), publishedId, false), db, 'publication')).status, 401);
    assert.equal((await menuApi(context(JSON.stringify({ intent: 'unknown', revision: row.revision }), publishedId), db, 'publication')).status, 400);
    assert.equal((await menuApi(context(JSON.stringify({ intent: 'publish' }), publishedId), db, 'publication')).status, 400);
    assert.equal((await menuApi(context(JSON.stringify({ intent: 'publish', revision: row.revision, name: 'Ignored' }), publishedId), db, 'publication')).status, 200);
    assert.equal((await getDraft(db, publishedId, true)).name, 'Classic Chocolate');
    assert.equal((await menuApi(context(JSON.stringify({ intent: 'unpublish', revision: row.revision }), publishedId), db, 'publication')).status, 409);
  } finally { sqlite.close(); }
});
