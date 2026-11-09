import { useState } from 'react';

const collections = [
  {
    id: 'bakes',
    label: 'From the oven',
    title: 'For your little celebrations',
    description: 'Cakes and bakes, with your own special touch.',
    image: '/images/bow-cake.jpg',
    alt: 'Anu’s white celebration cake decorated with black bows',
  },
  {
    id: 'kitchen',
    label: 'From our kitchen',
    title: 'Familiar flavours. Homemade care.',
    description: 'A place for traditional sweets, hot snacks, and pickles.',
    image: '/images/sweet-box.jpg',
    alt: 'A box of homemade sweets from Anu’s kitchen',
  },
  {
    id: 'gifting',
    label: 'Something to share',
    title: 'A box of thoughtful little things',
    description: 'A place for festive favourites and gifting inspiration.',
    image: '/images/hamper.jpg',
    alt: 'Anu’s mixed box of sweets and chocolate treats',
  },
];

export default function CollectionPreview() {
  const [selected, setSelected] = useState('bakes');
  const collection = collections.find((item) => item.id === selected)!;

  return (
    <section className="collection-section container" aria-labelledby="collection-heading">
      <div className="section-heading">
        <p className="eyebrow">A little taste of Anu’s kitchen</p>
        <h2 id="collection-heading">There’s something for every kind of craving.</h2>
      </div>
      <div className="collection-controls" role="group" aria-label="Explore our collections">
        {collections.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected === item.id}
            onClick={() => setSelected(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="collection-preview">
        <img src={collection.image} alt={collection.alt} width="640" height="640" loading="lazy" />
        <div className="collection-copy" aria-live="polite" aria-atomic="true">
          <span className="flourish" aria-hidden="true">
            ✳
          </span>
          <h3>{collection.title}</h3>
          <p>{collection.description}</p>
          <p className="caption">A glimpse of our work. The full online menu is being prepared.</p>
          <a className="text-link" href="/menu">
            Visit our menu <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
