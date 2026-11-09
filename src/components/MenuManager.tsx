import { useEffect, useRef, useState } from 'react';
import type { SubmitEvent } from 'react';
import type { MenuDraft, MenuSummary } from '../business/menu';
import type { Preparation } from '../business/types';
import { formatINR, rupeesToPaise } from '../business/money';
import { MAX_PRODUCT_IMAGE_BYTES, PRODUCT_IMAGE_TYPES } from '../business/product-image';
import { MENU_TAG_SUGGESTIONS, menuLabelKey, normalizeMenuTags } from '../business/menu-tags';

type Option = { key: string; sizeLabel: string; preparation: Preparation; price: string };
type Form = { id?: string; revision?: string; status?: 'draft' | 'published'; name: string; category: string; tagsText: string; description: string; imagePath: string | null; options: Option[] };
const preparationLabels = { 'with-egg': 'With egg', eggless: 'Eggless', 'not-applicable': 'Not applicable' };
function option(): Option { return { key: crypto.randomUUID(), sizeLabel: '', preparation: 'with-egg', price: '' }; }
function empty(): Form { return { name: '', category: '', tagsText: '', description: '', imagePath: null, options: [option()] }; }
function priceText(paise: number) { return `${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, '0')}`; }
async function api<T = unknown>(path = '', init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin/menu${path}`, { ...init, cache: 'no-store' });
  let data;
  try { data = await response.json(); }
  catch { throw new Error('Unable to reach the menu service. Please try again.'); }
  if (!response.ok) throw new Error((data as { error?: string }).error ?? 'Unable to access menu.');
  return data as T;
}

export default function MenuManager({ onDirtyChange }: { onDirtyChange: (dirty: boolean) => void }) {
  const [products, setProducts] = useState<MenuSummary[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { onDirtyChange(dirty); return () => onDirtyChange(false); }, [dirty, onDirtyChange]);

  useEffect(() => {
    let active = true;
    api<{ products: MenuSummary[] }>().then((data) => { if (active) setProducts(data.products); })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function update(next: Form) { setForm(next); setDirty(true); setMessage(''); }
  async function uploadImage(file: File, input: HTMLInputElement) {
    if (!form) return;
    setError(''); setMessage('');
    if (!PRODUCT_IMAGE_TYPES.includes(file.type) || file.size === 0 || file.size > MAX_PRODUCT_IMAGE_BYTES) {
      setError('Choose a JPEG, PNG, or WebP image no larger than 5 MB.'); input.value = ''; return;
    }
    setUploading(true); setBusy(true); setDirty(true);
    try {
      const bitmap = await createImageBitmap(file).catch(() => { throw new Error('This image could not be opened. Choose another image.'); });
      bitmap.close();
      const response = await fetch('/api/admin/menu-images', { method: 'POST', headers: { 'Content-Type': file.type }, body: file, cache: 'no-store' });
      const data = await response.json() as { imagePath?: string; error?: string };
      if (!response.ok || !data.imagePath) throw new Error(data.error ?? 'Image upload failed. Please try again.');
      update({ ...form, imagePath: data.imagePath });
      setMessage('Image uploaded. Save the product to keep this photo.');
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); setUploading(false); input.value = ''; }
  }
  function updateOption(key: string, values: Partial<Option>) {
    if (form) update({ ...form, options: form.options.map((item) => item.key === key ? { ...item, ...values } : item) });
  }
  function focusHeading() { requestAnimationFrame(() => heading.current?.focus()); }
  async function refresh() { setProducts((await api<{ products: MenuSummary[] }>()).products); }
  async function changePublication(product: MenuSummary) {
    setBusy(true); setError(''); setMessage('');
    const intent = product.status === 'published' ? 'unpublish' : 'publish';
    try {
      await api(`/${product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intent, revision: product.revision }) });
      setMessage(`${product.name} ${intent === 'publish' ? 'published on the public menu' : 'unpublished and kept as a private draft'}.`);
      await refresh();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  async function open(id: string) {
    setBusy(true); setError(''); setMessage('');
    try {
      const product = (await api<{ product: MenuDraft }>(`/${id}`)).product;
      setForm({ ...product, tagsText: product.tags.join(', '), options: product.options.map((item) => ({ ...item, key: crypto.randomUUID(), price: priceText(item.pricePaise) })) });
      setPreview(false); setDirty(false); focusHeading();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setError(''); setBusy(true);
    const intent = (event.nativeEvent.submitter as HTMLButtonElement | null)?.value || undefined;
    try {
      await api(form.id ? `/${form.id}` : '', {
        method: form.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, intent, tags: normalizeMenuTags(form.tagsText.split(',')) }),
      });
      setDirty(false); setForm(null); setPreview(false);
      setMessage(intent === 'unpublish' ? 'Product unpublished and saved as a private draft.' : intent === 'publish' || form.status === 'published' ? 'Product saved and visible on the public menu.' : 'Draft saved. It is not visible on the public menu.'); focusHeading();
      await refresh();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  function back() {
    if (dirty && !window.confirm('Discard your unsaved changes and return to the menu list?')) return;
    setForm(null); setPreview(false); setDirty(false); setError(''); focusHeading();
  }
  function showPreview() {
    if (!form) return;
    try {
      for (const item of form.options) rupeesToPaise(item.price);
      normalizeMenuTags(form.tagsText.split(','));
      setError(''); setPreview(true); focusHeading();
    } catch (err) { setError((err as Error).message); }
  }

  return <section className="menu-manager" aria-busy={busy}>
    <h2 ref={heading} tabIndex={-1}>{form ? preview ? 'Private menu preview' : form.id ? 'Edit product' : 'Add product' : 'Menu products'}</h2>
    <p className="lede">Drafts stay private. Publish a product to show its details, prices, and photo on the public menu.</p>
    <a href="/menu" target="_blank" rel="noopener noreferrer">View public menu ↗</a>
    {error && <p className="menu-error" role="alert">{error}</p>}
    <p role="status" className="menu-message">{uploading ? 'Uploading image…' : busy ? 'Loading…' : message}</p>
    {!form ? <>
      <div className="menu-actions">
        <button type="button" className="button" disabled={busy} onClick={() => { setForm(empty()); setDirty(false); setError(''); setMessage(''); focusHeading(); }}>Add product</button>
        {error && <button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await refresh(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }}>Retry loading</button>}
      </div>
      {!busy && !error && products.length === 0 && <p>No products yet. Add your first product to get started.</p>}
      <ul className="menu-drafts">{products.map((product) => <li key={product.id}>
        <div><strong>{product.name}</strong><p>{product.category} · {product.status === 'published' ? 'Published' : 'Draft'}</p></div>
        <div className="menu-row-actions">
          <button type="button" disabled={busy} onClick={() => open(product.id)} aria-label={`Edit ${product.name}`}>Edit</button>
          <button type="button" disabled={busy} onClick={() => changePublication(product)} aria-label={`${product.status === 'published' ? 'Unpublish' : 'Publish'} ${product.name}`}>{product.status === 'published' ? 'Unpublish' : 'Publish'}</button>
        </div>
      </li>)}</ul>
    </> : preview ? <>
      <p className="preview-notice">Private preview of your current entries. Unsaved edits are included. This does not publish or save the product.</p>
      <article className="menu-preview">
        <figure className="menu-preview-photo">
          <img src={form.imagePath ?? '/images/rose-cake.jpg'} width="640" height="640" alt={form.imagePath ? `${form.name || 'Product'} photo` : 'Pink decorated cake with pearls and a bow'} />
          <figcaption>{form.imagePath ? 'Product photo' : 'Sample photo — product photo to be confirmed.'}</figcaption>
        </figure>
        <p className="eyebrow">{form.category || 'Category'}</p>
        <h3>{form.name || 'Product name'}</h3>
        <div className="menu-product-tags" aria-label="Product tags">{normalizeMenuTags(form.tagsText.split(',')).map((tag) => <span key={menuLabelKey(tag)}>{tag}</span>)}</div>
        {form.description && <p className="menu-description">{form.description}</p>}
        <ul>{form.options.map((item) => <li key={item.key}><span>{item.sizeLabel || 'Size / pack'} · {preparationLabels[item.preparation]}</span><strong>{formatINR(rupeesToPaise(item.price))}</strong></li>)}</ul>
      </article>
      <div className="menu-actions"><button type="button" onClick={() => { setPreview(false); focusHeading(); }}>Back to editing</button></div>
    </> : <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend className="sr-only">Product details</legend>
        <label htmlFor="product-name">Product name</label>
        <input id="product-name" required maxLength={120} value={form.name} onChange={(e) => update({ ...form, name: e.target.value })} />
        <label htmlFor="product-category">Category</label>
        <input id="product-category" required maxLength={60} list="menu-categories" value={form.category} onChange={(e) => update({ ...form, category: e.target.value })} />
        <datalist id="menu-categories">{['Cake', 'Cupcake', 'Brownie', 'Cookie', 'Chocolate', 'Energy bar', 'Indian hot snacks', 'Pickle', 'Sweet'].map((name) => <option key={name} value={name} />)}</datalist>
        <label htmlFor="product-tags">Tags <span>(optional)</span></label>
        <input id="product-tags" value={form.tagsText} maxLength={420} aria-describedby="product-tags-help" placeholder="Seasonal, Best seller" onChange={(e) => update({ ...form, tagsText: e.target.value })} />
        <p id="product-tags-help">Separate tags with commas. Up to 12 tags, 32 characters each. Tags are manual labels; they do not change prices or calculate discounts.</p>
        <div className="menu-tag-suggestions" aria-label="Suggested tags">{MENU_TAG_SUGGESTIONS.map((tag) => <button key={tag} type="button" onClick={() => {
          const entries = form.tagsText.split(',').map((entry) => entry.trim()).filter(Boolean);
          if (!entries.some((entry) => menuLabelKey(entry) === menuLabelKey(tag))) update({ ...form, tagsText: [...entries, tag].join(', ') });
        }}>Add {tag}</button>)}</div>
        <label htmlFor="product-description">Description <span>(optional)</span></label>
        <textarea id="product-description" rows={3} maxLength={2000} value={form.description} onChange={(e) => update({ ...form, description: e.target.value })} />
        <label htmlFor="product-image">Product image <span>(optional)</span></label>
        <p id="product-image-help">JPEG, PNG, or WebP, up to 5 MB. Choose a photo, then save the product to keep it.</p>
        <input id="product-image" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="product-image-help" onChange={(e) => { const file = e.currentTarget.files?.[0]; if (file) void uploadImage(file, e.currentTarget); }} />
        {form.imagePath && <figure className="menu-preview-photo menu-form-photo">
          <img src={form.imagePath} alt={`${form.name || 'Product'} photo`} />
          <figcaption>Selected product photo</figcaption>
          <button type="button" onClick={() => update({ ...form, imagePath: null })}>Remove image from product</button>
        </figure>}
        <h3 className="menu-options-title">Options and prices</h3>
        <p>Enter a size or pack label, such as 500 g or Box of 6. Prices are in rupees.</p>
        {form.options.map((item, index) => <fieldset key={item.key} className="menu-option">
          <legend>Option {index + 1}</legend>
          <div className="menu-option-grid">
            <div><label htmlFor={`size-${item.key}`}>Size / pack</label><input id={`size-${item.key}`} required maxLength={80} value={item.sizeLabel} onChange={(e) => updateOption(item.key, { sizeLabel: e.target.value })} /></div>
            <div><label htmlFor={`preparation-${item.key}`}>Preparation</label><select id={`preparation-${item.key}`} value={item.preparation} onChange={(e) => updateOption(item.key, { preparation: e.target.value as Preparation })}>{Object.entries(preparationLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div><label htmlFor={`price-${item.key}`}>Price (₹)</label><input id={`price-${item.key}`} required inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" maxLength={20} value={item.price} onChange={(e) => updateOption(item.key, { price: e.target.value })} /></div>
          </div>
          <button type="button" disabled={form.options.length === 1} onClick={() => update({ ...form, options: form.options.filter((row) => row.key !== item.key) })} aria-label={`Remove option ${index + 1}`}>Remove option</button>
        </fieldset>)}
        <button type="button" disabled={form.options.length >= 40} onClick={() => update({ ...form, options: [...form.options, option()] })}>Add option</button>
        <div className="menu-actions">
          <button type="submit" className="button">{form.status === 'published' ? 'Save & update public menu' : 'Save draft'}</button>
          {form.status === 'published'
            ? <button type="submit" name="intent" value="unpublish">Save & unpublish</button>
            : <button type="submit" name="intent" value="publish">Publish</button>}
          <button type="button" onClick={showPreview}>Preview</button>
          <button type="button" onClick={back}>Back to menu list</button>
        </div>
      </fieldset>
    </form>}
  </section>;
}
