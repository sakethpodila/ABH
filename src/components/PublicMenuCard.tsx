import { useState } from 'react';
import type { PublicMenuProduct } from '../business/menu';
import type { Preparation } from '../business/types';
import { formatINR } from '../business/money';

const preparationLabels: Record<Preparation, string> = {
  'with-egg': 'With egg',
  eggless: 'Eggless',
  'not-applicable': 'Standard',
};

export default function PublicMenuCard({ product }: { product: PublicMenuProduct }) {
  const [selected, setSelected] = useState(0);
  const option = product.options[selected];
  const sizes = [...new Set(product.options.map((item) => item.sizeLabel))];
  const preparations = [...new Set(product.options.filter((item) => item.sizeLabel === option?.sizeLabel).map((item) => item.preparation))];

  function chooseSize(size: string) {
    const matching = product.options.findIndex((item) => item.sizeLabel === size && item.preparation === option?.preparation);
    setSelected(matching >= 0 ? matching : product.options.findIndex((item) => item.sizeLabel === size));
  }

  function choosePreparation(preparation: Preparation) {
    const matching = product.options.findIndex((item) => item.sizeLabel === option?.sizeLabel && item.preparation === preparation);
    if (matching >= 0) setSelected(matching);
  }

  return (
    <article className="public-menu-card">
      {product.imageUrl && <img className="public-menu-photo" src={product.imageUrl} alt={`${product.name} photo`} width="640" height="640" loading="lazy" />}
      <div className="public-menu-card-content">
        <h3>{product.name}</h3>
        {product.tags.length > 0 && <div className="menu-product-tags" aria-label={`${product.name} tags`}>{product.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        {product.description && <p className="menu-description">{product.description}</p>}
        {option && <>
          <div className="public-menu-choices">
            <label>{product.category.toLowerCase() === 'cake' ? 'Cake size' : 'Size / pack'}
              <select value={option.sizeLabel} onChange={(event) => chooseSize(event.target.value)}>
                {sizes.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            {preparations.some((preparation) => preparation !== 'not-applicable') &&
              <label>Type
                <select value={option.preparation} onChange={(event) => choosePreparation(event.target.value as Preparation)}>
                  {preparations.map((preparation) => <option key={preparation} value={preparation}>{preparationLabels[preparation]}</option>)}
                </select>
              </label>}
          </div>
          <p className="public-menu-price" aria-live="polite" aria-atomic="true"><span>Price</span><strong>{formatINR(option.pricePaise)}</strong></p>
        </>}
      </div>
    </article>
  );
}
