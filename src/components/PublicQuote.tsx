import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, Database } from '../lib/supabase';
import { Quote as QuoteIcon, Languages, Calendar, Copy, Share2, Check } from 'lucide-react';
import RichTextDisplay from './RichTextDisplay';

type QuoteRow = Database['public']['Tables']['quotes']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];

const stripHtml = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
};

const languageNames: { [k: string]: string } = {
  en: 'English', hi: 'Hindi', gu: 'Gujarati', sa: 'Sanskrit',
};

const PublicQuote: React.FC = () => {
  const { id } = useParams();
  const [quote, setQuote] = useState<QuoteRow | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!id) { setError('Missing quote id'); return; }
        const { data, error } = await supabase.from('quotes').select('*').eq('id', id).single();
        if (error) throw error;
        if (!data) { setError('Quote not found'); return; }
        setQuote(data);
        if (data.category_ids?.length) {
          const { data: cats } = await supabase.from('categories').select('*').in('id', data.category_ids);
          setCategories(cats || []);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load quote');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleCopy = async () => {
    if (!quote) return;
    const text = stripHtml(quote.text);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!quote) return;
    const text = `"${stripHtml(quote.text)}"\n\n— WisdomKeeper`;
    if (navigator.share) {
      await navigator.share({ title: 'WisdomKeeper Quote', text, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <div className="skeleton" style={{ height: 48, width: 200, marginBottom: '2rem' }} />
          <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <p style={{ fontFamily: 'var(--font-ui)', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            {error || 'Quote not found'}
          </p>
          <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
            Back to WisdomKeeper
          </Link>
        </div>
      </div>
    );
  }

  const isGujarati = quote.language === 'gu';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(2rem, 6vw, 4rem) 1.5rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: 640 }}>
        {/* Brand */}
        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            textDecoration: 'none', marginBottom: '3rem',
          }}
        >
          <div style={{ width: 28, height: 28, background: 'var(--color-accent)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <QuoteIcon size={14} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            WisdomKeeper
          </span>
        </Link>

        {/* Quote card */}
        <div
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(2rem, 6vw, 3rem)',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
            overflow: 'hidden',
          }}
          className="animate-fade-up"
        >
          {/* Accent bar */}
          <div style={{ position: 'absolute', left: 0, top: '2rem', bottom: '2rem', width: 3, background: 'var(--color-accent)', borderRadius: '0 3px 3px 0' }} />

          {/* Categories */}
          {categories.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1.5rem', paddingLeft: '1rem' }}>
              {categories.map((c) => (
                <span key={c.id} className="tag-pill">{c.name}</span>
              ))}
            </div>
          )}

          {/* Quote text */}
          <blockquote
            lang={isGujarati ? 'gu' : 'en'}
            style={{
              fontFamily: isGujarati ? 'var(--font-gujarati)' : 'var(--font-display)',
              fontSize: isGujarati ? '1.25rem' : 'clamp(1.2rem, 3vw, 1.75rem)',
              lineHeight: isGujarati ? 2.2 : 1.75,
              fontStyle: isGujarati ? 'normal' : 'italic',
              color: 'var(--color-text-primary)',
              paddingLeft: '1.25rem',
              marginBottom: '2rem',
            }}
          >
            <RichTextDisplay content={quote.text} />
          </blockquote>

          {/* Meta */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--color-border)',
              paddingLeft: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Languages size={13} color="var(--color-text-muted)" />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  {languageNames[quote.language] || quote.language}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Calendar size={13} color="var(--color-text-muted)" />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {new Date(quote.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleCopy} className="btn-ghost" aria-label="Copy quote" style={{ padding: '0.5rem 0.875rem' }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              <button onClick={handleShare} className="btn-ghost" aria-label="Share quote" style={{ padding: '0.5rem 0.875rem' }}>
                <Share2 size={14} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <p style={{ textAlign: 'center', marginTop: '2rem', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Shared from{' '}
          <Link to="/" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}>
            WisdomKeeper
          </Link>
        </p>
      </div>
    </div>
  );
};

export default PublicQuote;
