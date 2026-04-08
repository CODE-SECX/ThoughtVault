import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FileText, Quote, BookOpen, Tag, BarChart3, Search, Eye, X, Languages, Trash2, Calendar, Clock, Grid } from 'lucide-react';
import RichTextDisplay from './RichTextDisplay';
import toast from 'react-hot-toast';
import { htmlToPlainText } from '../utils/htmlUtils';

const strip = (h: string) => htmlToPlainText(h);
const trunc = (h: string, n: number) => { const t = strip(h); return t.length > n ? t.slice(0, n) + '…' : t; };

type ContentItem = {
  id: string; type: 'quote' | 'understanding'; title: string; content: string;
  categories: string[]; language: string; created_at: string; updated_at: string;
  word_count?: number; is_draft?: boolean;
};
type ViewMode = 'overview' | 'list' | 'categories' | 'stats';

const LANG: Record<string, string> = { en: 'English', hi: 'Hindi', gu: 'Gujarati', sa: 'Sanskrit', es: 'Español', fr: 'Français', de: 'Deutsch' };

const ContentIndex: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems]     = useState<ContentItem[]>([]);
  const [stats, setStats]     = useState({ totalQ: 0, totalU: 0, totalW: 0, byCat: {} as Record<string, number>, byLang: {} as Record<string, number>, recent: [] as ContentItem[] });
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState<ViewMode>('overview');
  const [search, setSearch]   = useState('');
  const [selCats, setSelCats] = useState<string[]>([]);
  const [selected, setSelected] = useState<ContentItem | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: qs }, { data: us }] = await Promise.all([
        supabase.from('quotes').select('*').order('created_at', { ascending: false }),
        supabase.from('understanding').select('*').order('updated_at', { ascending: false }),
      ]);

      const resolve = async (ids: string[]) => {
        if (!ids?.length) return [];
        const { data } = await supabase.from('categories').select('name').in('id', ids);
        return data?.map((c: any) => c.name) || [];
      };

      const qItems: ContentItem[] = await Promise.all((qs || []).map(async q => ({
        id: q.id, type: 'quote' as const, title: `"${trunc(q.text, 55)}"`,
        content: q.text, categories: await resolve(q.category_ids || []),
        language: q.language, created_at: q.created_at, updated_at: q.updated_at,
      })));

      const uItems: ContentItem[] = await Promise.all((us || []).map(async e => ({
        id: e.id, type: 'understanding' as const, title: e.title,
        content: e.description, categories: await resolve(e.category_ids || []),
        language: e.language, created_at: e.created_at, updated_at: e.updated_at,
        word_count: e.word_count, is_draft: e.is_draft,
      })));

      const all = [...qItems, ...uItems];
      setItems(all);

      const byCat: Record<string, number> = {};
      const byLang: Record<string, number> = {};
      all.forEach(i => { i.categories.forEach(c => { byCat[c] = (byCat[c] || 0) + 1; }); byLang[i.language] = (byLang[i.language] || 0) + 1; });

      setStats({
        totalQ: qItems.length, totalU: uItems.length,
        totalW: (us || []).reduce((s, e) => s + (e.word_count || 0), 0),
        byCat, byLang,
        recent: [...all].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 8),
      });
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (item: ContentItem) => {
    if (!confirm(`Delete this ${item.type}?`)) return;
    try {
      await supabase.from(item.type === 'quote' ? 'quotes' : 'understanding').delete().eq('id', item.id);
      toast.success('Deleted'); setSelected(null); load();
    } catch { toast.error('Failed'); }
  };

  const openItem = (item: ContentItem) => {
    if (item.type === 'understanding') navigate(`/understanding/${item.id}`);
    else setSelected(item);
  };

  const filtered = items.filter(i => {
    const t = `${i.title} ${strip(i.content)} ${i.categories.join(' ')}`.toLowerCase();
    return t.includes(search.toLowerCase()) && (!selCats.length || selCats.some(c => i.categories.includes(c)));
  });

  const allCatNames = Object.keys(stats.byCat);

  const Tab: React.FC<{ mode: ViewMode; icon: React.ReactNode; label: string }> = ({ mode, icon, label }) => (
    <button onClick={() => setView(mode)} aria-pressed={view === mode}
      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.45rem 0.875rem', borderRadius: 'var(--radius-md)', border: `1px solid ${view === mode ? 'var(--color-accent)' : 'var(--color-border)'}`, background: view === mode ? 'var(--color-accent-light)' : 'var(--color-bg-card)', color: view === mode ? 'var(--color-accent)' : 'var(--color-text-secondary)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, cursor: 'pointer' }}>
      {icon}{label}
    </button>
  );

  const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; to?: string }> = ({ label, value, icon, to }) => {
    const inner = (
      <div className="wk-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ width: 34, height: 34, background: 'var(--color-accent-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '0.25rem' }}>{label}</div>
        </div>
      </div>
    );
    return to ? <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link> : <div>{inner}</div>;
  };

  const ItemRow: React.FC<{ item: ContentItem; index: number }> = ({ item, index }) => (
    <div className="wk-card" style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem', cursor: 'pointer', opacity: 0, animation: `fadeUp 380ms ease ${index * 35}ms forwards` }}
      onClick={() => openItem(item)}>
      <div style={{ width: 34, height: 34, background: 'var(--color-accent-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {item.type === 'quote' ? <Quote size={14} color="var(--color-accent)" /> : <BookOpen size={14} color="var(--color-accent)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontFamily: item.type === 'quote' ? 'var(--font-display)' : 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', fontStyle: item.type === 'quote' ? 'italic' : 'normal', marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title}
        </h3>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '0.4rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          <RichTextDisplay content={item.content.length > 100 ? item.content.slice(0, 100) + '…' : item.content} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
          {item.categories.slice(0, 3).map(c => <span key={c} className="tag-pill">{c}</span>)}
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', color: 'var(--color-text-muted)' }}>
            · {LANG[item.language] || item.language} · {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          {item.is_draft && <span className="tag-pill active" style={{ fontSize: '10px' }}>Draft</span>}
        </div>
      </div>
      <button className="btn-icon" onClick={e => { e.stopPropagation(); setSelected(item); }} aria-label="Quick view" title="Quick view" style={{ flexShrink: 0 }}>
        <Eye size={14} />
      </button>
    </div>
  );

  const BarChart: React.FC<{ data: Record<string, number>; title: string }> = ({ data, title }) => {
    const max = Math.max(...Object.values(data), 1);
    return (
      <div className="wk-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1.25rem' }}>{title}</h3>
        {Object.entries(data).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
          <div key={k} style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>{LANG[k] || k}</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-text-muted)' }}>{v}</span>
            </div>
            <div style={{ height: 5, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(v / max) * 100}%`, background: 'var(--color-accent)', borderRadius: 3, transition: 'width 600ms ease' }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  /* Detail panel for quote quick-view */
  const QuickView = () => {
    if (!selected) return null;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        onClick={() => setSelected(null)} role="dialog" aria-modal>
        <div style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--color-bg-card)', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {selected.categories.map(c => <span key={c} className="tag-pill">{c}</span>)}
              <span className="tag-pill">{selected.type === 'quote' ? 'Quote' : 'Understanding'}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {selected.type === 'understanding' && (
                <button className="btn-ghost" style={{ fontSize: '12px', padding: '0.3rem 0.6rem', minHeight: 'auto' }} onClick={() => { navigate(`/understanding/${selected.id}`); setSelected(null); }}>Open</button>
              )}
              <button className="btn-icon" onClick={() => handleDelete(selected)} style={{ color: 'var(--color-error)' }} aria-label="Delete"><Trash2 size={14} /></button>
              <button className="btn-icon" onClick={() => setSelected(null)} aria-label="Close"><X size={17} /></button>
            </div>
          </div>
          <div style={{ padding: '1.5rem' }}>
            {selected.type === 'understanding' && (
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>{selected.title}</h2>
            )}
            <div style={{ fontFamily: selected.type === 'quote' ? 'var(--font-display)' : 'var(--font-body)', fontSize: selected.type === 'quote' ? 'var(--text-quote)' : 'var(--text-base)', lineHeight: selected.type === 'quote' ? 1.7 : 1.85, fontStyle: selected.type === 'quote' ? 'italic' : 'normal', color: 'var(--color-text-primary)' }}>
              <RichTextDisplay content={selected.content} />
            </div>
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={11} />{new Date(selected.created_at).toLocaleDateString()}</span>
              {selected.updated_at !== selected.created_at && <span style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={11} />Updated {new Date(selected.updated_at).toLocaleDateString()}</span>}
              {selected.word_count && <span style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FileText size={11} />{selected.word_count}w</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="page-wrap-wide">
      <div className="skeleton" style={{ height: 40, width: 220, marginBottom: '1.5rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
      </div>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 'var(--radius-lg)', marginBottom: '0.75rem' }} />)}
    </div>
  );

  return (
    <div className="page-wrap-wide">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,4vw,2.4rem)', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>Content Index</h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{items.length} items in your knowledge vault</p>
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <Tab mode="overview" icon={<Grid size={13} aria-hidden />} label="Overview" />
        <Tab mode="list" icon={<FileText size={13} aria-hidden />} label="All items" />
        <Tab mode="categories" icon={<Tag size={13} aria-hidden />} label="Categories" />
        <Tab mode="stats" icon={<BarChart3 size={13} aria-hidden />} label="Stats" />
      </div>

      {/* ── Overview ─────────────────────────────────────── */}
      {view === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: '0.875rem' }}>
            <StatCard label="Quotes" value={stats.totalQ} icon={<Quote size={15} color="var(--color-accent)" />} to="/quotes" />
            <StatCard label="Learnings" value={stats.totalU} icon={<BookOpen size={15} color="var(--color-accent)" />} to="/understanding" />
            <StatCard label="Words" value={stats.totalW.toLocaleString()} icon={<FileText size={15} color="var(--color-accent)" />} />
            <StatCard label="Categories" value={allCatNames.length} icon={<Tag size={15} color="var(--color-accent)" />} to="/categories" />
          </div>
          {stats.recent.length > 0 && (
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '1rem' }}>Recently Updated</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {stats.recent.map((item, i) => <ItemRow key={item.id} item={item} index={i} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── All items ────────────────────────────────────── */}
      {view === 'list' && (
        <div>
          <div className="wk-card" style={{ padding: '1rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} aria-hidden />
              <input type="search" className="input-field" style={{ paddingLeft: '2.1rem' }} placeholder="Search all content…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search" />
            </div>
            {allCatNames.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {allCatNames.map(c => { const a = selCats.includes(c); return <button key={c} className={`tag-pill${a ? ' active' : ''}`} onClick={() => setSelCats(a ? selCats.filter(x => x !== c) : [...selCats, c])} style={{ cursor: 'pointer' }}>{c}</button>; })}
                {selCats.length > 0 && <button className="btn-ghost" style={{ padding: '0.15rem 0.5rem', minHeight: 'auto', fontSize: '11px' }} onClick={() => setSelCats([])}>Clear</button>}
              </div>
            )}
          </div>
          {(search || selCats.length) > 0 && <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '0.875rem' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {filtered.map((item, i) => <ItemRow key={item.id} item={item} index={i} />)}
          </div>
          {filtered.length === 0 && <div className="wk-card" style={{ textAlign: 'center', padding: '3rem' }}><p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>No items match</p></div>}
        </div>
      )}

      {/* ── Categories ───────────────────────────────────── */}
      {view === 'categories' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{allCatNames.length} Categor{allCatNames.length !== 1 ? 'ies' : 'y'}</h2>
            <Link to="/categories" style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-accent)', textDecoration: 'none' }}>Manage →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '0.875rem' }}>
            {Object.entries(stats.byCat).sort((a, b) => b[1] - a[1]).map(([cat, count], i) => (
              <div key={cat} className="wk-card" style={{ padding: '1.25rem', cursor: 'pointer', opacity: 0, animation: `fadeUp 380ms ease ${i * 45}ms forwards` }}
                onClick={() => { setSelCats([cat]); setView('list'); }}>
                <div style={{ width: 34, height: 34, background: 'var(--color-accent-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <Tag size={15} color="var(--color-accent)" />
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.2rem' }}>{cat}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-text-muted)' }}>{count} item{count !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats ────────────────────────────────────────── */}
      {view === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.25rem' }}>
          <BarChart data={stats.byLang} title="Languages" />
          <BarChart data={Object.fromEntries(Object.entries(stats.byCat).sort((a, b) => b[1] - a[1]).slice(0, 10))} title="Top Categories" />
        </div>
      )}

      <QuickView />
    </div>
  );
};

export default ContentIndex;
