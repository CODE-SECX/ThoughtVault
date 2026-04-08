import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Quote, BookOpen, FolderOpen, Search, FileText, Sun, Moon, Menu, X, ArrowUp } from 'lucide-react';

interface LayoutProps { children: React.ReactNode; }

/** Read persisted theme. Returns true = dark. */
function readTheme(): boolean {
  try {
    const v = localStorage.getItem('wk-theme');
    if (v === 'dark') return true;
    if (v === 'light') return false;
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);          // sidebar
  const [dark, setDark] = useState<boolean>(readTheme);
  const [progress, setProgress] = useState(0);
  const [top, setTop] = useState(false);
  const [fs, setFs] = useState<0 | 1 | 2>(() => {
    const v = localStorage.getItem('wk-fs');
    return v === '0' ? 0 : v === '2' ? 2 : 1;
  });

  /* ── Apply dark class ─────────────────────────────────── */
  useEffect(() => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    try { localStorage.setItem('wk-theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  /* ── Font size ────────────────────────────────────────── */
  useEffect(() => {
    const sizes = ['15px', '17px', '19px'];
    document.documentElement.style.setProperty('--page-font-size', sizes[fs]);
    try { localStorage.setItem('wk-fs', String(fs)); } catch {}
  }, [fs]);

  /* ── Scroll ───────────────────────────────────────────── */
  const onScroll = useCallback(() => {
    const el = document.documentElement;
    const scrolled = el.scrollTop || document.body.scrollTop;
    const total = el.scrollHeight - el.clientHeight;
    setProgress(total > 0 ? (scrolled / total) * 100 : 0);
    setTop(scrolled > 400);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  const nav = [
    { path: '/',              icon: Home,       label: 'Dashboard' },
    { path: '/quotes',        icon: Quote,      label: 'Quotes' },
    { path: '/understanding', icon: BookOpen,   label: 'Understanding' },
    { path: '/categories',    icon: FolderOpen, label: 'Categories' },
    { path: '/index',         icon: FileText,   label: 'Content Index' },
    { path: '/search',        icon: Search,     label: 'Search' },
  ];

  const mobileNav = [
    { path: '/',              icon: Home,     label: 'Home' },
    { path: '/quotes',        icon: Quote,    label: 'Quotes' },
    { path: '/understanding', icon: BookOpen, label: 'Learn' },
    { path: '/search',        icon: Search,   label: 'Search' },
  ];

  const active = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  // Common sidebar styles
  const sidebarBg: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, bottom: 0,
    width: 'var(--sidebar-width)',
    background: 'var(--color-bg-card)',
    borderRight: '1px solid var(--color-border)',
    zIndex: 50,
    display: 'flex', flexDirection: 'column',
    boxShadow: 'var(--shadow-sm)',
  };

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh' }}>

      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, height: 2, width: `${progress}%`, background: 'var(--color-accent)', zIndex: 999, transition: 'width 80ms linear', pointerEvents: 'none' }} />

      {/* ── SIDEBAR ───────────────────────────────────────── */}
      <aside
        style={sidebarBg}
        className={open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        aria-label="Navigation"
      >
        {/* Logo */}
        <div style={{ padding: '1.25rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" onClick={() => setOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: 'var(--color-accent)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              WisdomKeeper
            </span>
          </Link>
          <button className="btn-icon lg:hidden" onClick={() => setOpen(false)} aria-label="Close nav"><X size={16} /></button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto' }}>
          {nav.map(({ path, icon: Icon, label }) => (
            <Link key={path} to={path}
              className={`nav-link${active(path) ? ' active' : ''}`}
              style={{ marginBottom: '2px' }}
              onClick={() => setOpen(false)}
              aria-current={active(path) ? 'page' : undefined}
            >
              <Icon size={15} aria-hidden />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Controls */}
        <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>

          {/* Font size A- A A+ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', flex: 1 }}>Text</span>
            {([0, 1, 2] as const).map((size) => (
              <button key={size} onClick={() => setFs(size)} aria-pressed={fs === size} aria-label={['Small', 'Normal', 'Large'][size] + ' text'}
                style={{
                  width: 28, height: 28,
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${fs === size ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: fs === size ? 'var(--color-accent-light)' : 'transparent',
                  color: fs === size ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  fontFamily: 'var(--font-display)',
                  fontSize: `${10 + size * 2}px`,
                  fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >A</button>
            ))}
          </div>

          {/* Dark / light */}
          <button
            onClick={() => setDark(prev => !prev)}
            className="btn-ghost"
            style={{ justifyContent: 'center', width: '100%' }}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <><Sun size={14} /><span>Light mode</span></> : <><Moon size={14} /><span>Dark mode</span></>}
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {open && (
        <div className="lg:hidden" onClick={() => setOpen(false)} aria-hidden
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40, backdropFilter: 'blur(3px)' }} />
      )}

      {/* ── MAIN ─────────────────────────────────────────── */}
      <div className="lg:ml-64" style={{ paddingBottom: '4rem' }}>

        {/* Mobile top bar */}
        <header className="lg:hidden" style={{
          height: 'var(--nav-height)', background: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1rem', position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button className="btn-icon" onClick={() => setOpen(true)} aria-label="Open nav"><Menu size={20} /></button>
          <Link to="/" style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'none' }}>WisdomKeeper</Link>
          <button className="btn-icon" onClick={() => setDark(p => !p)} aria-label={dark ? 'Light mode' : 'Dark mode'}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        <main style={{ minHeight: '100vh' }}>{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav lg:hidden" aria-label="Mobile navigation" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {mobileNav.map(({ path, icon: Icon, label }) => (
          <Link key={path} to={path} className={`mobile-nav-item${active(path) ? ' active' : ''}`} aria-label={label} aria-current={active(path) ? 'page' : undefined}>
            <Icon size={20} aria-hidden />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        style={{
          position: 'fixed', right: '1.5rem', bottom: '5rem',
          width: 42, height: 42,
          background: 'var(--color-accent)', color: '#fff',
          border: 'none', borderRadius: '50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-md)',
          opacity: top ? 1 : 0,
          transform: top ? 'translateY(0)' : 'translateY(8px)',
          pointerEvents: top ? 'auto' : 'none',
          zIndex: 100,
        }}
      >
        <ArrowUp size={16} />
      </button>
    </div>
  );
};

export default Layout;
