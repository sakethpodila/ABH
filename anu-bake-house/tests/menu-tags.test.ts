import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMenuTags, menuFilterChoices, filterMenuProducts } from '../src/business/menu-tags.ts';
import type { PublicMenuProduct } from '../src/business/menu';

test('manual tags normalize spacing/case duplicates without adding claims or changing prices', () => {
  assert.deepEqual(normalizeMenuTags([' Seasonal ', 'seasonal', 'Best   seller', '', 'Discounted']), ['Seasonal', 'Best seller', 'Discounted']);
  assert.deepEqual(normalizeMenuTags(undefined), []);
  for (const value of ['Seasonal', null, [1], ['x'.repeat(33)], Array(13).fill('tag'), ['a,b']]) assert.throws(() => normalizeMenuTags(value));
});

test('filter choices follow supplied products and categories/tags filter together case-insensitively', () => {
  const product = (id: string, category: string, tags: string[]): PublicMenuProduct => ({ id, category, tags, name: id, description: '', imageUrl: null, options: [] });
  const products = [product('one', 'Cake', ['Seasonal']), product('two', 'cake', ['seasonal', 'Best seller']), product('three', 'Cookie', ['Gift box'])];
  const choices = menuFilterChoices(products);
  assert.deepEqual(choices.categories, ['Cake', 'Cookie']);
  assert.deepEqual(choices.tags, ['Best seller', 'Gift box', 'Seasonal']);
  assert.equal(filterMenuProducts(products, null, null).length, 3);
  assert.deepEqual(filterMenuProducts(products, 'CAKE', 'best seller').map((item) => item.id), ['two']);
  assert.deepEqual(filterMenuProducts(products, 'Cookie', 'Seasonal'), []);
  assert.deepEqual(filterMenuProducts(products, null, 'unknown'), []);
  assert.deepEqual(menuFilterChoices([]), { categories: [], tags: [] });
});
