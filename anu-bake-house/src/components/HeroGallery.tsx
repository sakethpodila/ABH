import { useState, useRef } from 'react';

const photos = [
  { src: '/images/rose-cake.jpg', alt: 'Pink celebration cake with delicate piping, pearls, and a bow', label: 'Pink celebration cake' },
  { src: '/images/mango-cake.jpg', alt: 'Yellow cake decorated with mango', label: 'Mango cake' },
  { src: '/images/mango-cheesecake.jpg', alt: 'Layered cake with mango topping', label: 'Mango cheesecake' },
];

export default function HeroGallery() {
  const [active, setActive] = useState(0);
  const swipeStart = useRef<number | null>(null);
  const show = (step: number) => setActive((current) => (current + step + photos.length) % photos.length);

  return (
    <div className="hero-image hero-gallery" aria-label="Cake photo gallery">
      <div className="hero-gallery-stack">
        <img src={photos[active].src} alt={photos[active].alt} width="640" height="640"
          fetchPriority={active === 0 ? 'high' : undefined} draggable={false}
          onPointerDown={(event) => {
            swipeStart.current = event.clientX;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={(event) => {
            if (swipeStart.current === null) return;
            const distance = event.clientX - swipeStart.current;
            if (Math.abs(distance) > 40) show(distance < 0 ? 1 : -1);
            swipeStart.current = null;
          }}
          onPointerCancel={() => { swipeStart.current = null; }}
        />
      </div>
      <span className="baking-note">A little love<br />in every bake <span aria-hidden="true">♡</span></span>
      <div className="hero-gallery-controls" aria-label="Choose a cake photo">
        <button type="button" onClick={() => show(-1)} aria-label="Previous cake photo">←</button>
        <span aria-live="polite" aria-atomic="true">{photos[active].label} · {active + 1} of {photos.length}</span>
        <button type="button" onClick={() => show(1)} aria-label="Next cake photo">→</button>
      </div>
    </div>
  );
}
