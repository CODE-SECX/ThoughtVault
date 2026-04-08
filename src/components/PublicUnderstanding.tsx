import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Database } from '../lib/supabase';
import { BookOpen, Languages, Calendar, FileText, Link as LinkIcon, Copy, Share2, Check, Clock } from 'lucide-react';
import RichTextDisplay from './RichTextDisplay';
import { htmlToPlainText } from '../utils/htmlUtils';

type URow = Database['public']['Tables']['understanding']['Row'];
type CRow = Database['public']['Tables']['categories']['Row'];

const LANG: Record<string, string> = {
  en: 'English', hi: 'Hindi', gu: 'Gujarati', sa: 'Sanskrit',
  es: 'Español', fr: 'Français', de: 'Deutsch',
};

const PublicUnderstanding: React.FC = () => {
  const { id } = useParams();
  const [entry, setEntry]     = useState<URow | null>(null);
  const [cats, setCats]       = useState<CRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        if (!id) { setError('Missing id'); return; }
        const { data, error: e } = await supabase.from('understanding').select('*').eq('id', id).single();
        if (e) throw e;
        if (!data) { setError('Entry not found'); return; }
        setEntry(data);
        if (data.category_ids?.length) {
          const { data: cd } = await supabase.from('categories').select('*').in('id', data.category_ids);
          setCats(cd || []);
        }
      } catch (e: any) { setError(e?.message || 'Failed to load'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleCopy = async () => {
    if (!entry) return;
    const t = htmlToPlainText(entry.description);
    try { await navigator.clipboard.writeText(t); } catch { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); document.body.removeChild(a); }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) { await navigator.share({ title: entry?.title, url: window.location.href }); }
    else { try { await navigator.clipboard.writeText(window.location.href); } catch {} }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 680 }}>
        <div className="skeleton" style={{ height: 28, width: 150, marginBottom: '2rem' }} />
        <div className="skeleton" style={{ height: 50, marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
      </div>
    </div>
  );

  if (error || !entry) return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>{error || 'Not found'}</p>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>Back to WisdomKeeper</Link>
      </div>
    </div>
  );

  const isGu = entry.language === 'gu';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: 'clamp(2rem,6vw,4rem) 1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>

        {/* Brand */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '2.5rem' }}>
          <div style={{ width: 28, height: 28, background: 'var(--color-accent)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={14} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>WisdomKeeper</span>
        </Link>

        {/* Card */}
        <article style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', overflow: 'hidden', animation: 'fadeUp 500ms ease forwards' }}>

          {/* Accent strip */}
          <div style={{ height: 3, background: 'var(--color-accent)' }} />

          <div style={{ padding: 'clamp(1.75rem,5vw,2.75rem)' }}>
            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1.25rem' }}>
              {cats.map(c => <span key={c.id} className="tag-pill">{c.name}</span>)}
              <span className="tag-pill"><Languages size={10} />{LANG[entry.language] || entry.language}</span>
              {entry.is_draft && <span className="tag-pill active">Draft</span>}
            </div>

            {/* Title */}
            <h1 lang={isGu ? 'gu' : 'en'} style={{ fontFamily: isGu ? 'var(--font-gujarati)' : 'var(--font-display)', fontSize: 'clamp(1.5rem,4vw,2.1rem)', fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: isGu ? 2 : 1.25, letterSpacing: '-0.02em', marginBottom: '1.75rem' }}>
              {entry.title}
            </h1>

            {/* Description */}
            <div lang={isGu ? 'gu' : 'en'} style={{ fontFamily: isGu ? 'var(--font-gujarati)' : 'var(--font-body)', fontSize: isGu ? '1.1rem' : 'var(--text-base)', lineHeight: isGu ? 2.1 : 1.9, color: 'var(--color-text-primary)', marginBottom: entry.real_life_connection ? '2rem' : '1.5rem' }}>
              <RichTextDisplay content={entry.description} />
            </div>

            {/* Real-life connection */}
            {entry.real_life_connection && (
              <div style={{ background: 'var(--color-accent-light)', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 600, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <LinkIcon size={12} />Real-life Connection
                </div>
                <div lang={isGu ? 'gu' : 'en'} style={{ fontFamily: isGu ? 'var(--font-gujarati)' : 'var(--font-body)', fontSize: isGu ? '1.05rem' : 'var(--text-sm)', lineHeight: isGu ? 2 : 1.8, color: 'var(--color-text-primary)' }}>
                  <RichTextDisplay content={entry.real_life_connection} />
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  <Calendar size={12} />{new Date(entry.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
                {entry.word_count > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    <FileText size={12} />{entry.word_count} words
                  </span>
                )}
                {entry.reference && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    <BookOpen size={12} />{entry.reference}{entry.page_slok_number ? ` · ${entry.page_slok_number}` : ''}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-ghost" onClick={handleCopy} style={{ padding: '0.4rem 0.75rem', minHeight: 'auto' }}>
                  {copied ? <><Check size={13} />Copied</> : <><Copy size={13} />Copy</>}
                </button>
                <button className="btn-ghost" onClick={handleShare} style={{ padding: '0.4rem 0.75rem', minHeight: 'auto' }}>
                  <Share2 size={13} />Share
                </button>
              </div>
            </div>
          </div>
        </article>

        <p style={{ textAlign: 'center', marginTop: '1.75rem', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Shared from <Link to="/" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}>WisdomKeeper</Link>
        </p>
      </div>
    </div>
  );
};

export default PublicUnderstanding;
