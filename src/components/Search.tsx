import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Filter, Quote, BookOpen, Languages, Calendar, FileText, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { htmlToPlainText } from '../utils/htmlUtils';

const strip = (h: string) => htmlToPlainText(h);

const LANG: Record<string, string> = {
  en: 'English', hi: 'हिन्दी', gu: 'ગુજરાતી', sa: 'Sanskrit',
  es: 'Español', fr: 'Français', de: 'Deutsch',
};

interface Result {
  id: string;
  type: 'quote' | 'understanding';
  title: string;
  content: string;
  category: string;
  language: string;
  word_count?: number;
  created_at: string;
}

/** Wraps matched text in <mark> spans */
const Highlight: React.FC<{ text: string; term: string }> = ({ text, term }) => {
  if (!term.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return <>{parts.map((p, i) => new RegExp(term, 'i').test(p) ? <mark key={i}>{p}</mark> : p)}</>;
};

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [term, setTerm]       = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType]       = useState<'all' | 'quote' | 'understanding'>('all');
  const [lang, setLang]       = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (term.trim().length >= 2) doSearch(); else setResults([]); }, 300);
    return () => clearTimeout(timer);
  }, [term, type, lang]);

  const doSearch = async () => {
    setLoading(true);
    const out: Result[] = [];
    try {
      if (type === 'all' || type === 'quote') {
        let q = supabase.from('quotes').select('id, text, language, category_ids, created_at').ilike('text', `%${term}%`);
        if (lang !== 'all') q = q.eq('language', lang);
        const { data } = await q.limit(30);
        for (const row of data || []) {
          // get first category name
          let cat = '';
          if (row.category_ids?.length) {
            const { data: cd } = await supabase.from('categories').select('name').eq('id', row.category_ids[0]).single();
            cat = cd?.name || '';
          }
          out.push({ id: row.id, type: 'quote', title: strip(row.text).slice(0, 80) + (strip(row.text).length > 80 ? '…' : ''), content: row.text, category: cat, language: row.language, created_at: row.created_at });
        }
      }

      if (type === 'all' || type === 'understanding') {
        let q = supabase.from('understanding').select('id, title, description, language, category_ids, word_count, created_at')
          .or(`title.ilike.%${term}%,description.ilike.%${term}%`);
        if (lang !== 'all') q = q.eq('language', lang);
        const { data } = await q.limit(30);
        for (const row of data || []) {
          let cat = '';
          if (row.category_ids?.length) {
            const { data: cd } = await supabase.from('categories').select('name').eq('id', row.category_ids[0]).single();
            cat = cd?.name || '';
          }
          out.push({ id: row.id, type: 'understanding', title: row.title, content: row.description, category: cat, language: row.language, word_count: row.word_count, created_at: row.created_at });
        }
      }

      out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setResults(out);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const handleClick = (r: Result) => {
    if (r.type === 'understanding') navigate(`/understanding/${r.id}`);
    else navigate('/quotes');
  };

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem,4vw,2.4rem)', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>Search</h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Find anything in your knowledge library</p>
      </div>

      {/* Search input */}
      <div className="wk-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <SearchIcon size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} aria-hidden />
          <input
            ref={inputRef}
            type="search"
            className="input-field"
            style={{ paddingLeft: '2.75rem', paddingRight: term ? '2.5rem' : '1rem', fontSize: 'var(--text-base)' }}
            placeholder="Search quotes and learnings…"
            value={term}
            onChange={e => setTerm(e.target.value)}
            aria-label="Search"
          />
          {term && (
            <button onClick={() => { setTerm(''); setResults([]); inputRef.current?.focus(); }} className="btn-icon"
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }} aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Filter size={13} color="var(--color-text-muted)" aria-hidden />
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {(['all', 'quote', 'understanding'] as const).map(t => (
              <button key={t} onClick={() => setType(t)} className={`tag-pill${type === t ? ' active' : ''}`} style={{ cursor: 'pointer' }} aria-pressed={type === t}>
                {t === 'all' ? 'All types' : t === 'quote' ? 'Quotes' : 'Understanding'}
              </button>
            ))}
          </div>
          <div style={{ height: 16, width: 1, background: 'var(--color-border)', margin: '0 0.25rem' }} />
          <select value={lang} onChange={e => setLang(e.target.value)} className="tag-pill" style={{ cursor: 'pointer', background: 'var(--color-bg-muted)', border: '1px solid var(--color-border)', appearance: 'auto', minWidth: 90 }} aria-label="Language filter">
            <option value="all">All languages</option>
            {Object.entries(LANG).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      )}

      {!loading && term.trim().length >= 2 && (
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          {results.length > 0 ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${term}"` : `No results for "${term}"`}
        </p>
      )}

      {!loading && results.length === 0 && term.trim().length >= 2 && (
        <div className="wk-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ width: 48, height: 48, background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <SearchIcon size={20} color="var(--color-text-muted)" />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>No results found</h3>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Try different keywords or remove filters</p>
        </div>
      )}

      {!loading && term.trim().length < 2 && !results.length && (
        <div className="wk-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ width: 48, height: 48, background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <SearchIcon size={20} color="var(--color-text-muted)" />
          </div>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Type at least 2 characters to search</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {results.map((r, i) => {
            const isGu = r.language === 'gu';
            const preview = strip(r.content).slice(0, 180);
            return (
              <div
                key={r.id}
                onClick={() => handleClick(r)}
                className="quote-card"
                style={{ paddingLeft: '1.5rem', cursor: 'pointer', opacity: 0, animation: `fadeUp 380ms ease ${i * 40}ms forwards` }}
                role="button" tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick(r); }}
              >
                {/* Type + category row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.625rem' }}>
                  <span className={`tag-pill${r.type === 'quote' ? '' : ' active'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {r.type === 'quote' ? <Quote size={10} aria-hidden /> : <BookOpen size={10} aria-hidden />}
                    {r.type === 'quote' ? 'Quote' : 'Understanding'}
                  </span>
                  {r.category && <span className="tag-pill">{r.category}</span>}
                  <span className="tag-pill"><Languages size={10} />{LANG[r.language] || r.language}</span>
                </div>

                {/* Title */}
                {r.type === 'understanding' && (
                  <h3 lang={isGu ? 'gu' : 'en'} style={{ fontFamily: isGu ? 'var(--font-gujarati)' : 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.01em', lineHeight: isGu ? 2 : 1.3 }}>
                    <Highlight text={r.title} term={term} />
                  </h3>
                )}

                {/* Content preview */}
                <p lang={isGu ? 'gu' : 'en'} style={{ fontFamily: isGu ? 'var(--font-gujarati)' : r.type === 'quote' ? 'var(--font-display)' : 'var(--font-body)', fontSize: r.type === 'quote' ? 'clamp(1rem,2vw,1.15rem)' : 'var(--text-sm)', lineHeight: isGu ? 2 : 1.7, fontStyle: r.type === 'quote' ? 'italic' : 'normal', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                  <Highlight text={preview + (strip(r.content).length > 180 ? '…' : '')} term={term} />
                </p>

                {/* Meta */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <Calendar size={11} />{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {r.word_count && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      <FileText size={11} />{r.word_count} words
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Search;
