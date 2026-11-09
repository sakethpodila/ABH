export const MENU_TAG_SUGGESTIONS = ['Seasonal', 'Best seller', 'Discounted'];
export function menuLabelKey(label: string): string { return label.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase(); }
export function normalizeMenuTags(value: unknown): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 12) throw new Error('Use up to 12 tags.');
  const tags = new Map<string, string>();
  for (const item of value) {
    if (typeof item !== 'string') throw new Error('Tags must be text.');
    const label = item.normalize('NFKC').trim().replace(/\s+/g, ' ');
    if (!label) continue;
    if (label.length > 32 || /[\u0000-\u001f\u007f,]/.test(label)) throw new Error('Each tag must be at most 32 characters and contain no commas or control characters.');
    const key = menuLabelKey(label);
    if (!tags.has(key)) tags.set(key, label);
  }
  return [...tags.values()];
}
import type { PublicMenuProduct } from './menu';


export function menuFilterChoices(products: PublicMenuProduct[]) {
  const categories = new Map<string, string>();
  const tags = new Map<string, string>();
  for (const product of products) {
    if (!categories.has(menuLabelKey(product.category))) categories.set(menuLabelKey(product.category), product.category);
    for (const tag of product.tags) if (!tags.has(menuLabelKey(tag))) tags.set(menuLabelKey(tag), tag);
  }
  return { categories: [...categories.values()], tags: [...tags.values()].sort((a, b) => a.localeCompare(b)) };
}

export function filterMenuProducts(products: PublicMenuProduct[], category: string | null, tag: string | null) {
  return products.filter((product) => (!category || menuLabelKey(product.category) === menuLabelKey(category)) && (!tag || product.tags.some((label) => menuLabelKey(label) === menuLabelKey(tag))));
}
