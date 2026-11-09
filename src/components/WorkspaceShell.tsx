import { useEffect, useRef, useState } from 'react';
import MenuManager from './MenuManager';

const modules = [
  {
    id: 'dashboard',
    label: 'Overview',
    title: 'A little order in the kitchen.',
    description: 'Monthly orders, bestsellers, payments, and upcoming work will live here.',
  },
  {
    id: 'quotations',
    label: 'Quotations',
    title: 'Every celebration starts with a conversation.',
    description:
      'The private item builder, agreed prices, and discounts will be developed after the quotation workflow is reviewed.',
  },
  {
    id: 'orders',
    label: 'Orders',
    title: 'From confirmed to freshly prepared.',
    description:
      'Confirmed orders will be saved here, with preparation and payment tracked separately.',
  },
  {
    id: 'invoices',
    label: 'Invoices & payments',
    title: 'Keep the details together.',
    description:
      'Numbered invoices, advance payments, balances, and document downloads are planned for this workspace.',
  },
  {
    id: 'menu',
    label: 'Menu',
    title: 'Your menu, always up to date.',
    description:
      'Create private menu drafts with independently priced sizes and egg options.',
  },
  {
    id: 'reviews',
    label: 'Reviews',
    title: 'Kind words, thoughtfully shared.',
    description: 'Review approval and social-sharing permissions will be managed here.',
  },
];

const candleIcons = [
  '/images/candles/candle-1.png',
  '/images/candles/candle-2-transparent.png',
  '/images/candles/candle-3.png',
  '/images/candles/candle-4.png',
  '/images/candles/candle-5.png',
  '/images/candles/candle-6.png',
];

export default function WorkspaceShell({ localPreview }: { localPreview: boolean }) {
  const [active, setActive] = useState('dashboard');
  const [menuDirty, setMenuDirty] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const navigationToggle = useRef<HTMLButtonElement>(null);
  const closeNavigation = () => drawer.current?.close();
  useEffect(() => {
    const wideScreen = window.matchMedia('(min-width: 851px)');
    const handleResize = () => { if (wideScreen.matches) drawer.current?.close(); };
    wideScreen.addEventListener('change', handleResize);
    return () => wideScreen.removeEventListener('change', handleResize);
  }, []);
  const current = modules.find((item) => item.id === active)!;
  const navigation = (
    <>
        <a className="brand" href="/">
          <img src="/images/logo.jpg" width="48" height="48" alt="" />
          <span>
            Anu’s<small>Business workspace</small>
          </span>
        </a>
        <nav aria-label="Workspace sections">
          {modules.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={active === item.id}
              onClick={() => {
                if (item.id === active) { closeNavigation(); return; }
                if (menuDirty && !window.confirm('Discard your unsaved menu changes?')) return;
                setActive(item.id);
                closeNavigation();
              }}
            >
              <img className="nav-candle-image" src={candleIcons[index]} alt="" />
              {item.label}
            </button>
          ))}
        </nav>
        <a className="workspace-return" href="/">
          View public website ↗
        </a>
    </>
  );
  return (
    <div className="workspace-layout">
      <aside className="workspace-sidebar workspace-desktop-sidebar">{navigation}</aside>
      <dialog
        ref={drawer}
        id="workspace-navigation"
        className="workspace-drawer"
        aria-label="Workspace navigation"
        onClose={() => {
          setNavigationOpen(false);
          if (window.matchMedia('(max-width: 850px)').matches) navigationToggle.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget && event.clientX > event.currentTarget.getBoundingClientRect().right) closeNavigation();
        }}
      >
        <div className="workspace-sidebar">
          <button className="workspace-nav-close" type="button" onClick={closeNavigation} aria-label="Close workspace navigation">×</button>
          {navigation}
        </div>
      </dialog>
      <div className="workspace-content">
        <header className="workspace-topbar">
          <div className="workspace-topbar-start">
            <button
              ref={navigationToggle}
              className="workspace-nav-toggle"
              type="button"
              aria-label="Open workspace navigation"
              aria-controls="workspace-navigation"
              aria-expanded={navigationOpen}
              onClick={() => { drawer.current?.showModal(); setNavigationOpen(true); }}
            >
              <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span>Anu’s kitchen / {current.label}</span>
          </div>
          <span className="status-label">
            {localPreview ? 'Local preview' : 'Private workspace'}
          </span>
        </header>
        <main id="main" className="workspace-main">
          {localPreview && (
            <p className="preview-notice">
              Local development preview only. Production still requires verified administrator
              sign-in.
            </p>
          )}
          <p className="eyebrow">{current.label}</p>
          <h1>{current.title}</h1>
          <p className="lede">{current.description}</p>
          {current.id === 'menu' ? <MenuManager onDirtyChange={setMenuDirty} /> : <div className="foundation-note">
            <span className="flourish" aria-hidden="true">
              ✳
            </span>
            <h2>The foundation is ready.</h2>
            <p>
              This is the application shell. No live orders, sales figures, or customer records are
              displayed. Business workflows are the next milestone.
            </p>
          </div>}
        </main>
      </div>
    </div>
  );
}
