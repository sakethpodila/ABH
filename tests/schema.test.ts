import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

function database() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  const files = readdirSync(new URL('../drizzle/', import.meta.url))
    .filter((file) => file.endsWith('.sql'))
    .sort();
  assert.ok(files.length > 0, 'Generate the initial migration before testing the schema.');
  for (const file of files)
    db.exec(readFileSync(new URL(`../drizzle/${file}`, import.meta.url), 'utf8'));
  return db;
}

test('reviews start pending and social sharing requires separate consent', () => {
  const db = database();
  try {
    db.prepare(
      'INSERT INTO reviews (id, display_name, rating, body, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run('r1', 'Customer', 5, 'Lovely cake.', 1);
    const row = db
      .prepare('SELECT status, social_sharing_consent FROM reviews WHERE id = ?')
      .get('r1');
    assert.equal(row?.status, 'pending');
    assert.equal(row?.social_sharing_consent, 0);
    assert.throws(() =>
      db
        .prepare(
          'INSERT INTO reviews (id, display_name, rating, body, created_at) VALUES (?, ?, ?, ?, ?)',
        )
        .run('r2', 'Customer', 6, 'Review', 1),
    );
    assert.throws(() =>
      db.prepare("UPDATE reviews SET status = 'unmoderated-public' WHERE id = 'r1'").run(),
    );
  } finally {
    db.close();
  }
});

test('variant prices, product references and variant uniqueness are enforced by SQLite', () => {
  const db = database();
  try {
    db.prepare(
      'INSERT INTO products (id, slug, name, category, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run('p1', 'test-cake', 'Test cake', 'cakes', 1, 1);
    const insert = db.prepare(
      'INSERT INTO product_variants (id, product_id, size_label, preparation, price_paise) VALUES (?, ?, ?, ?, ?)',
    );
    insert.run('v1', 'p1', '500 g', 'with-egg', 49900);
    insert.run('v2', 'p1', '500 g', 'eggless', 59900);
    assert.throws(() => insert.run('v3', 'p1', '500 g', 'with-egg', 50000));
    assert.throws(() => insert.run('v4', 'missing', '1 kg', 'eggless', 99900));
    assert.throws(() => insert.run('v5', 'p1', '1 kg', 'with-egg', -1));
    assert.throws(() => insert.run('v6', 'p1', '1 kg', 'with-egg', 1.5));
    assert.throws(() => db.prepare("DELETE FROM products WHERE id = 'p1'").run());
  } finally {
    db.close();
  }
});
