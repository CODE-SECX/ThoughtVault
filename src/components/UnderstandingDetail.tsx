import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, Database } from '../lib/supabase';
import { ArrowLeft, Share2, Trash2, Edit3, Languages, Link as LinkIcon, FileText, Calendar, Clock, Tag, BookOpen, Copy, Check, ExternalLink } from 'lucide-react';
import RichTextDisplay from './RichTextDisplay';
import RichTextEditor from './RichTextEditor';
import toast from 'react-hot-toast';
import { htmlToPlainText } from '../utils/htmlUtils';

type URow = Database['public']['Tables']['understanding']['Row'];
type CRow = Database['public']['Tables']['categories']['Row'];
interface UWC extends URow { categories: CRow[]; }

const LANG: Record<string, string> = {
  en: 'English', hi: 'हिन्दी (Hindi)', gu: 'ગુજરાતી (Gujarati)', sa: 'Sanskrit',
  es: 'Español', fr: 'Français', de: 'Deutsch', it: 'Italiano',
  pt: 'Português', ru: 'Русский', zh: '中文', ja: '日本語', ko: '한국어',
};

const lbl = (t: string) => (
  <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.4rem' }}>{t}</label>
);

const UnderstandingDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry]   = useState<UWC | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  // edit state
  const [editData, setEditData] = useState<Partial<UWC>>({});
  const [allCats, setAllCats]   = useState<CRow[]>([]);
  const [saving, setSaving]     = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      setLoading(true); setError(null);
      if (!id) { setError('Missing id'); return; }
      const { data, error: e } = await supabase.from('understanding').select('*').eq('id', id).single();
      if (e) throw e; if (!data) { setError('Not found'); return; }
      let cats: CRow[] = [];
      if (data.category_ids?.length) {
        const { data: cd } = await supabase.from('categories').select('*').in('id', data.category_ids);
        cats = cd || [];
      }
      const { data: ac } = await supabase.from('categories').select('*').order('name');
      setEntry({ ...data, categories: cats });
      setAllCats(ac || []);
      setEditData({ ...data });
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!entry || !confirm('Delete this entry?')) return;
    try {
      await supabase.from('understanding').delete().eq('id', entry.id);
      toast.success('Deleted'); navigate('/understanding');
    } catch { toast.error('Failed to delete'); }
  };

  const handleShare = async () => {
    if (!entry) return;
    const url = `${window.location.origin}/p/understanding/${entry.id}`;
    if (navigator.share) { await navigator.share({ title: entry.title, url }); }
    else { try { await navigator.clipboard.writeText(url); toast.success('Share link copied'); } catch { toast.error('Could not copy'); } }
  };

  const handleCopy = async () => {
    if (!entry) return;
    const text = htmlToPlainText(entry.description);
    try { await navigator.clipboard.writeText(text); } catch { const a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select(); document.execCommand('copy'); document.body.removeChild(a); }
    setCopied(true); toast.success('Copied'); setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!entry || !editData.title?.trim() || !editData.description?.trim()) { toast.error('Fill in required fields'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('understanding').update({ ...editData, updated_at: new Date().toISOString() }).eq('id', entry.id);
      if (error) throw error;
      toast.success('Saved'); setEditing(false); load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleEditCat = (id: string) => {
    const ids = editData.category_ids || [];
    setEditData({ ...editData, category_ids: ids.includes(id) ? ids.filter(c => c !== id) : [...ids, id] });
  };

  /* ── Loading ─────────────────────────────────────────── */
  if (loading) return (
    <div style={{ padding: 'clamp(1.5rem,4vw,2.5rem)', maxWidth: 780, margin: '0 auto' }}>
      <div className="skeleton" style={{ height: 20, width: 120, marginBottom: '2rem' }} />
      <div className="skeleton" style={{ height: 44, width: '60%', marginBottom: '1.5rem' }} />
      <div className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-lg)' }} />
    </div>
  );

  /* ── Error ───────────────────────────────────────────── */
  if (error || !entry) return (
    <div style={{ padding: 'clamp(1.5rem,4vw,2.5rem)', maxWidth: 780, margin: '0 auto', textAlign: 'center', paddingTop: '4rem' }}>
      <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>{error || 'Entry not found'}</p>
      <button className="btn-primary" onClick={() => navigate('/understanding')}><ArrowLeft size={14} />Back to Understanding</button>
    </div>
  );

  const isGu = entry.language === 'gu';

  /* ── Edit mode ───────────────────────────────────────── */
  if (editing) return (
    <div style={{ padding: 'clamp(1.5rem,4vw,2.5rem)', maxWidth: 780, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <button className="btn-ghost" onClick={() => setEditing(false)} aria-label="Cancel edit"><ArrowLeft size={15} />Cancel</button>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Editing entry</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>{lbl('Title *')}<input type="text" className="input-field" value={editData.title || ''} onChange={e => setEditData({ ...editData, title: e.target.value })} /></div>
        <div>{lbl('Description *')}<RichTextEditor value={editData.description || ''} onChange={v => setEditData({ ...editData, description: v, word_count: v.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length })} /></div>
        <div>
          {lbl('Categories')}
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.625rem', maxHeight: 130, overflowY: 'auto', background: 'var(--color-bg-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {allCats.map(c => { const s = (editData.category_ids || []).includes(c.id); return <button key={c.id} type="button" className={`tag-pill${s ? ' active' : ''}`} onClick={() => toggleEditCat(c.id)} style={{ cursor: 'pointer' }}>{s && <Check size={10} />}{c.name}</button>; })}
          </div>
        </div>
        <div>{lbl('Real-life Connection')}<RichTextEditor value={editData.real_life_connection || ''} onChange={v => setEditData({ ...editData, real_life_connection: v })} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: '0.875rem' }}>
          <div>{lbl('Reference')}<input type="text" className="input-field" value={editData.reference || ''} onChange={e => setEditData({ ...editData, reference: e.target.value })} /></div>
          <div>{lbl('Page / Slok')}<input type="text" className="input-field" value={editData.page_slok_number || ''} onChange={e => setEditData({ ...editData, page_slok_number: e.target.value })} /></div>
          <div>{lbl('Language')}
            <select className="input-field" value={editData.language || 'en'} onChange={e => setEditData({ ...editData, language: e.target.value })} style={{ background: 'var(--color-bg-muted)' }}>
              {Object.entries(LANG).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>{lbl('Date')}<input type="date" className="input-field" value={editData.date || ''} onChange={e => setEditData({ ...editData, date: e.target.value })} /></div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
          <input type="checkbox" checked={editData.is_draft ?? false} onChange={e => setEditData({ ...editData, is_draft: e.target.checked })} style={{ accentColor: 'var(--color-accent)' }} />
          Save as draft
        </label>
        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
          <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  );

  /* ── Read view ───────────────────────────────────────── */
  return (
    <div style={{ padding: 'clamp(1.5rem,4vw,2.5rem)', maxWidth: 780, margin: '0 auto' }}>

      {/* Back + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button className="btn-ghost" onClick={() => navigate('/understanding')} aria-label="Back">
          <ArrowLeft size={15} /> Back
        </button>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to={`/p/understanding/${entry.id}`} target="_blank" rel="noopener" className="btn-ghost" style={{ textDecoration: 'none' }} aria-label="Public page">
            <ExternalLink size={14} /> Public
          </Link>
          <button className="btn-ghost" onClick={handleCopy} aria-label="Copy content">
            {copied ? <><Check size={14} />Copied</> : <><Copy size={14} />Copy</>}
          </button>
          <button className="btn-ghost" onClick={handleShare} aria-label="Share"><Share2 size={14} />Share</button>
          <button className="btn-ghost" onClick={() => setEditing(true)} aria-label="Edit"><Edit3 size={14} />Edit</button>
          <button className="btn-icon" onClick={handleDelete} aria-label="Delete" style={{ color: 'var(--color-error)' }}><Trash2 size={15} /></button>
        </div>
      </div>

      {/* Article */}
      <article>
        {/* Meta tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1.25rem' }}>
          {entry.categories.map(c => <span key={c.id} className="tag-pill"><Tag size={10} />{c.name}</span>)}
          <span className="tag-pill"><Languages size={10} />{LANG[entry.language] || entry.language}</span>
          {entry.is_draft && <span className="tag-pill active">Draft</span>}
        </div>

        {/* Title */}
        <h1 lang={isGu ? 'gu' : 'en'} style={{ fontFamily: isGu ? 'var(--font-gujarati)' : 'var(--font-display)', fontSize: 'clamp(1.6rem,4vw,2.25rem)', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: isGu ? 2.0 : 1.25, letterSpacing: '-0.02em', marginBottom: '1.75rem' }}>
          {entry.title}
        </h1>

        {/* Stat bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', padding: '1rem 1.25rem', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-md)', marginBottom: '2rem', border: '1px solid var(--color-border)' }}>
          {[
            { icon: Calendar, label: 'Created', val: new Date(entry.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) },
            ...(entry.updated_at !== entry.created_at ? [{ icon: Clock, label: 'Updated', val: new Date(entry.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }] : []),
            ...(entry.word_count ? [{ icon: FileText, label: 'Words', val: entry.word_count.toLocaleString() }] : []),
            ...(entry.reference ? [{ icon: BookOpen, label: 'Reference', val: entry.reference + (entry.page_slok_number ? ` (${entry.page_slok_number})` : '') }] : []),
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon size={13} color="var(--color-text-muted)" aria-hidden />
              <div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>{val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div lang={isGu ? 'gu' : 'en'} style={{ fontFamily: isGu ? 'var(--font-gujarati)' : 'var(--font-body)', fontSize: isGu ? '1.15rem' : 'var(--text-base)', lineHeight: isGu ? 2.1 : 1.9, color: 'var(--color-text-primary)', marginBottom: '2rem' }}>
          <RichTextDisplay content={entry.description} />
        </div>

        {/* Real-life connection */}
        {entry.real_life_connection && (
          <div style={{ background: 'var(--color-accent-light)', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <LinkIcon size={14} aria-hidden /> Real-life Connection
            </h3>
            <div lang={isGu ? 'gu' : 'en'} style={{ fontFamily: isGu ? 'var(--font-gujarati)' : 'var(--font-body)', fontSize: isGu ? '1.1rem' : 'var(--text-base)', lineHeight: isGu ? 2.0 : 1.85, color: 'var(--color-text-primary)' }}>
              <RichTextDisplay content={entry.real_life_connection} />
            </div>
          </div>
        )}

        {/* Footer divider */}
        <div style={{ height: 1, background: 'var(--color-border)', margin: '2rem 0' }} />

        {/* Bottom nav */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={() => navigate('/understanding')}><ArrowLeft size={14} />All entries</button>
          <button className="btn-ghost" onClick={() => setEditing(true)}><Edit3 size={14} />Edit this entry</button>
        </div>
      </article>
    </div>
  );
};

export default UnderstandingDetail;
