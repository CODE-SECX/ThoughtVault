import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, Calendar, Languages, FileText, Edit3, Trash2, X, Share2, Filter, ChevronDown, Check, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import toast from 'react-hot-toast';
import RichTextEditor from './RichTextEditor';
import RichTextDisplay from './RichTextDisplay';
import { htmlToPlainText } from '../utils/htmlUtils';

const strip = (h: string) => htmlToPlainText(h);

const LANG: Record<string, string> = {
  en: 'English', hi: 'हिन्दी', gu: 'ગુજરાતી', sa: 'Sanskrit',
  es: 'Español', fr: 'Français', de: 'Deutsch', it: 'Italiano',
  pt: 'Português', ru: 'Русский', zh: '中文', ja: '日本語', ko: '한국어',
};

type URow = Database['public']['Tables']['understanding']['Row'];
type CRow = Database['public']['Tables']['categories']['Row'];
type UWC  = URow & { categories: CRow[] };

interface FormData {
  title: string; description: string; category_ids: string[];
  language: string; date: string; word_count: number;
  real_life_connection: string; reference: string; page_slok_number: string; is_draft: boolean;
}
const EMPTY: FormData = { title: '', description: '', category_ids: [], language: 'en', date: '', word_count: 0, real_life_connection: '', reference: '', page_slok_number: '', is_draft: false };

/* ── Entry Card ──────────────────────────────────────────── */
const EntryCard: React.FC<{ entry: UWC; onEdit: (e: UWC) => void; onDelete: (id: string) => void; index: number }> = ({ entry, onEdit, onDelete, index }) => {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const isGu = entry.language === 'gu';

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.05 });
    obs.observe(el); return () => obs.disconnect();
  }, []);

  const handleCopy = async () => {
    const t = strip(entry.description);
    try { await navigator.clipboard.writeText(t); } catch { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); document.body.removeChild(a); }
    setCopied(true); toast.success('Copied'); setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/p/understanding/${entry.id}`;
    if (navigator.share) { await navigator.share({ title: entry.title, url }); }
    else { try { await navigator.clipboard.writeText(url); toast.success('Link copied'); } catch { toast.error('Could not copy link'); } }
  };

  return (
    <div ref={ref} className="quote-card" style={{ paddingLeft: '1.5rem', cursor: 'default', opacity: visible ? undefined : 0, animation: visible ? `fadeUp 480ms ease ${index * 55}ms forwards` : 'none' }}>
      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
        {entry.categories.map(c => <span key={c.id} className="tag-pill">{c.name}</span>)}
        <span className="tag-pill"><Languages size={10} aria-hidden />{LANG[entry.language] || entry.language}</span>
        {entry.is_draft && <span className="tag-pill active">Draft</span>}
      </div>

      {/* Title — click → full page */}
      <h2
        onClick={() => navigate(`/understanding/${entry.id}`)}
        lang={isGu ? 'gu' : 'en'}
        style={{ fontFamily: isGu ? 'var(--font-gujarati)' : 'var(--font-display)', fontSize: isGu ? '1.15rem' : '1.15rem', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: isGu ? 2 : 1.35, marginBottom: '0.625rem', cursor: 'pointer', letterSpacing: '-0.01em' }}
        title="Open full page"
      >
        {entry.title}
      </h2>

      {/* Preview */}
      <div lang={isGu ? 'gu' : 'en'} style={{ fontFamily: isGu ? 'var(--font-gujarati)' : 'var(--font-body)', fontSize: 'var(--text-sm)', lineHeight: isGu ? 2 : 1.75, color: 'var(--color-text-secondary)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        <RichTextDisplay content={entry.description} />
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', paddingTop: '0.875rem', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', gap: '0.875rem', flex: 1, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            <Calendar size={11} aria-hidden />
            {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {entry.word_count > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
              <FileText size={11} aria-hidden />
              {entry.word_count} words
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button onClick={() => navigate(`/understanding/${entry.id}`)} className="btn-icon" aria-label="Open full page" title="Open" style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-accent)', width: 'auto', padding: '0 0.5rem', gap: '0.3rem' }}>
            <BookOpen size={13} aria-hidden /> Open
          </button>
          <button onClick={handleCopy} className="btn-icon" aria-label="Copy" style={{ color: copied ? 'var(--color-accent)' : undefined }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button onClick={handleShare} className="btn-icon" aria-label="Share"><Share2 size={14} /></button>
          <button onClick={() => onEdit(entry)} className="btn-icon" aria-label="Edit"><Edit3 size={14} /></button>
          <button onClick={() => onDelete(entry.id)} className="btn-icon" aria-label="Delete" style={{ color: 'var(--color-error)' }}><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  );
};

/* ── Form Modal ──────────────────────────────────────────── */
const FormModal: React.FC<{ isEdit?: boolean; init: FormData; cats: CRow[]; onClose: () => void; onSubmit: (d: FormData) => Promise<void>; busy: boolean }> = ({ isEdit, init, cats, onClose, onSubmit, busy }) => {
  const [d, setD] = useState<FormData>(init);
  const set = (p: Partial<FormData>) => setD(prev => ({ ...prev, ...p }));
  const toggleCat = (id: string) => set({ category_ids: d.category_ids.includes(id) ? d.category_ids.filter(c => c !== id) : [...d.category_ids, id] });

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const lbl = (t: string) => <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.4rem' }}>{t}</label>;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      role="dialog" aria-modal="true">
      <div style={{ background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--color-bg-card)', zIndex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{isEdit ? 'Edit Entry' : 'New Entry'}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <form onSubmit={async e => { e.preventDefault(); await onSubmit(d); }} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>{lbl('Title *')}<input type="text" className="input-field" value={d.title} onChange={e => set({ title: e.target.value })} placeholder="Entry title…" required /></div>
          <div>{lbl('Description *')}<RichTextEditor value={d.description} onChange={v => set({ description: v, word_count: v.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length })} placeholder="Describe your understanding…" /></div>
          <div>
            {lbl('Categories *')}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.625rem', maxHeight: 130, overflowY: 'auto', background: 'var(--color-bg-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {cats.map(c => {
                const sel = d.category_ids.includes(c.id);
                return <button key={c.id} type="button" onClick={() => toggleCat(c.id)} className={`tag-pill${sel ? ' active' : ''}`} style={{ cursor: 'pointer' }}>{sel && <Check size={10} />}{c.name}</button>;
              })}
            </div>
          </div>
          <div>{lbl('Real-life Connection')}<RichTextEditor value={d.real_life_connection} onChange={v => set({ real_life_connection: v })} placeholder="How does this apply in real life?" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem' }}>
            <div>{lbl('Reference')}<input type="text" className="input-field" value={d.reference} onChange={e => set({ reference: e.target.value })} placeholder="Book, article…" /></div>
            <div>{lbl('Page / Slok')}<input type="text" className="input-field" value={d.page_slok_number} onChange={e => set({ page_slok_number: e.target.value })} placeholder="p.42 / 3.14" /></div>
            <div>{lbl('Language')}
              <select className="input-field" value={d.language} onChange={e => set({ language: e.target.value })} style={{ background: 'var(--color-bg-muted)' }}>
                {Object.entries(LANG).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>{lbl('Date')}<input type="date" className="input-field" value={d.date} onChange={e => set({ date: e.target.value })} /></div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" checked={d.is_draft} onChange={e => set({ is_draft: e.target.checked })} style={{ width: 15, height: 15, accentColor: 'var(--color-accent)' }} />
            Save as draft
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add entry'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main ────────────────────────────────────────────────── */
const UnderstandingList: React.FC = () => {
  const [entries, setEntries] = useState<UWC[]>([]);
  const [cats, setCats]       = useState<CRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [selCats, setSelCats] = useState<string[]>([]);
  const [lang, setLang]       = useState('');
  const [drafts, setDrafts]   = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<UWC | null>(null);
  const [busy, setBusy]       = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: es }, { data: cs }] = await Promise.all([
        supabase.from('understanding').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);
      const withCats: UWC[] = await Promise.all(
        (es || []).map(async e => {
          if (!e.category_ids?.length) return { ...e, categories: [] };
          const { data } = await supabase.from('categories').select('*').in('id', e.category_ids);
          return { ...e, categories: data || [] };
        })
      );
      setEntries(withCats); setCats(cs || []);
    } catch { toast.error('Failed to load entries'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (d: FormData) => {
    if (!d.title.trim() || !d.description.trim() || !d.category_ids.length) { toast.error('Fill in required fields'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from('understanding').insert({ ...d, updated_at: new Date().toISOString() });
      if (error) throw error;
      toast.success('Entry added'); setShowAdd(false); load();
    } catch { toast.error('Failed to add'); }
    finally { setBusy(false); }
  };

  const handleUpdate = async (d: FormData) => {
    if (!editing) return;
    setBusy(true);
    try {
      const { error } = await supabase.from('understanding').update({ ...d, updated_at: new Date().toISOString() }).eq('id', editing.id);
      if (error) throw error;
      toast.success('Entry updated'); setEditing(null); load();
    } catch { toast.error('Failed to update'); }
    finally { setBusy(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    try { await supabase.from('understanding').delete().eq('id', id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const filtered = entries.filter(e => {
    const txt = `${e.title} ${strip(e.description)}`.toLowerCase();
    return (
      txt.includes(search.toLowerCase()) &&
      (!selCats.length || selCats.some(id => e.category_ids.includes(id))) &&
      (!lang || e.language === lang) &&
      (!drafts || e.is_draft)
    );
  });

  const uniqueLangs = [...new Set(entries.map(e => e.language))];

  if (loading) return (
    <div className="page-wrap">
      <div className="skeleton" style={{ height: 40, width: 200, marginBottom: '1.5rem' }} />
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }} />)}
    </div>
  );

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,4vw,2.4rem)', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>Understanding</h1>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} />Add Entry</button>
      </div>

      {/* Search + filters */}
      <div className="wk-card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} aria-hidden />
            <input type="search" className="input-field" style={{ paddingLeft: '2.1rem' }} placeholder="Search entries…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search" />
          </div>
          <select className="input-field" value={lang} onChange={e => setLang(e.target.value)} style={{ width: 'auto', minWidth: 110, background: 'var(--color-bg-muted)' }} aria-label="Filter by language">
            <option value="">All languages</option>
            {uniqueLangs.map(l => <option key={l} value={l}>{LANG[l] || l}</option>)}
          </select>
          <button className="btn-ghost" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}
            style={{ color: selCats.length ? 'var(--color-accent)' : undefined }}>
            <Filter size={14} />Filters
            {selCats.length > 0 && <span style={{ width: 17, height: 17, borderRadius: '50%', background: 'var(--color-accent)', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{selCats.length}</span>}
            <ChevronDown size={12} style={{ transform: filtersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </button>
        </div>
        {filtersOpen && (
          <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
            {cats.map(c => {
              const a = selCats.includes(c.id);
              return <button key={c.id} className={`tag-pill${a ? ' active' : ''}`} onClick={() => setSelCats(a ? selCats.filter(x => x !== c.id) : [...selCats, c.id])} style={{ cursor: 'pointer' }} aria-pressed={a}>{c.name}</button>;
            })}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-text-secondary)', cursor: 'pointer', marginLeft: 'auto' }}>
              <input type="checkbox" checked={drafts} onChange={e => setDrafts(e.target.checked)} style={{ accentColor: 'var(--color-accent)' }} />Drafts only
            </label>
            {selCats.length > 0 && <button className="btn-ghost" style={{ padding: '0.15rem 0.5rem', minHeight: 'auto', fontSize: '11px' }} onClick={() => setSelCats([])}>Clear</button>}
          </div>
        )}
      </div>

      {(search || selCats.length || lang || drafts) && (
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
      )}

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="wk-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ width: 52, height: 52, background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <BookOpen size={22} color="var(--color-text-muted)" />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>{search || selCats.length ? 'No matching entries' : 'No entries yet'}</h3>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>{search ? 'Try a different search term' : 'Record your first learning'}</p>
          {!search && <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} />Add first entry</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((e, i) => <EntryCard key={e.id} entry={e} onEdit={setEditing} onDelete={handleDelete} index={i} />)}
        </div>
      )}

      {showAdd && <FormModal init={EMPTY} cats={cats} onClose={() => setShowAdd(false)} onSubmit={handleAdd} busy={busy} />}
      {editing && <FormModal isEdit init={{ title: editing.title, description: editing.description, category_ids: editing.category_ids, language: editing.language, date: editing.date || '', word_count: editing.word_count, real_life_connection: editing.real_life_connection || '', reference: editing.reference || '', page_slok_number: editing.page_slok_number || '', is_draft: editing.is_draft }} cats={cats} onClose={() => setEditing(null)} onSubmit={handleUpdate} busy={busy} />}
    </div>
  );
};

export default UnderstandingList;
