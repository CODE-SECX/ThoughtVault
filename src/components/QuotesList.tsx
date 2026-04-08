import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Search,
  Quote,
  Calendar,
  Languages,
  Trash2,
  Edit3,
  X,
  Copy,
  Share2,
  Bookmark,
  BookmarkCheck,
  Eye,
  ChevronDown,
  Check,
  Filter,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import toast from 'react-hot-toast';
import RichTextEditor from './RichTextEditor';
import RichTextDisplay from './RichTextDisplay';

/* ── Helpers ─────────────────────────────────────────────── */
const stripHtml = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  const text = div.textContent || div.innerText || '';
  return text.replace(/\s+/g, ' ').trim();
};

const languageNames: { [key: string]: string } = {
  en: 'English', hi: 'हिन्दी (Hindi)', gu: 'ગુજરાતી (Gujarati)',
  sa: 'संस्कृत (Sanskrit)', es: 'Español', fr: 'Français',
  de: 'Deutsch', it: 'Italiano', pt: 'Português', ru: 'Русский',
  zh: '中文', ja: '日本語', ko: '한국어',
};

const BOOKMARKS_KEY = 'wk-bookmarked-quotes';

const getBookmarks = (): Set<string> =>
  new Set(JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]'));

const saveBookmarks = (set: Set<string>) =>
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...set]));

type QuoteRow = Database['public']['Tables']['quotes']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type QuoteWithCategories = QuoteRow & { categories: CategoryRow[] };

/* ── Quote Card ──────────────────────────────────────────── */
interface QuoteCardProps {
  quote: QuoteWithCategories;
  onEdit: (q: QuoteWithCategories) => void;
  onDelete: (id: string) => void;
  bookmarked: boolean;
  onBookmarkToggle: (id: string) => void;
  onFocusMode: (q: QuoteWithCategories) => void;
  index: number;
}

const QuoteCard: React.FC<QuoteCardProps> = ({
  quote, onEdit, onDelete, bookmarked, onBookmarkToggle, onFocusMode, index
}) => {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // IntersectionObserver fade-up
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isGujarati = quote.language === 'gu';
  const plainText = stripHtml(quote.text);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = plainText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareText = `"${plainText}"\n\n— WisdomKeeper`;
    const url = `${window.location.origin}/p/quote/${quote.id}`;
    if (navigator.share) {
      await navigator.share({ title: 'WisdomKeeper Quote', text: shareText, url });
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
        toast.success('Share link copied!');
      } catch {
        toast.error('Unable to share');
      }
    }
  };

  return (
    <div
      ref={cardRef}
      className={`quote-card${visible ? ' animate-fade-up' : ''}`}
      style={{
        opacity: visible ? 1 : 0,
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* Categories */}
      {quote.categories.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
          {quote.categories.map((cat) => (
            <span key={cat.id} className="tag-pill">{cat.name}</span>
          ))}
        </div>
      )}

      {/* Quote text */}
      <blockquote
        lang={isGujarati ? 'gu' : 'en'}
        style={{
          fontFamily: isGujarati ? 'var(--font-gujarati)' : 'var(--font-display)',
          fontSize: isGujarati ? '1.2rem' : 'var(--text-quote)',
          lineHeight: isGujarati ? 2.0 : 1.7,
          fontStyle: isGujarati ? 'normal' : 'italic',
          color: 'var(--color-text-primary)',
          paddingLeft: '1.25rem',
          marginBottom: '1.25rem',
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
          gap: '0.75rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: 1 }}>
          <Languages size={13} color="var(--color-text-muted)" aria-hidden="true" />
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            {languageNames[quote.language] || quote.language}
          </span>
          <span style={{ color: 'var(--color-border-strong)', margin: '0 0.25rem' }}>·</span>
          <Calendar size={13} color="var(--color-text-muted)" aria-hidden="true" />
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
            }}
          >
            {new Date(quote.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Copy */}
          <button
            onClick={handleCopy}
            className="btn-icon"
            aria-label="Copy quote"
            title="Copy as plain text"
            style={{ color: copied ? 'var(--color-success)' : undefined }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="btn-icon"
            aria-label="Share quote"
            title="Share quote"
          >
            <Share2 size={15} />
          </button>

          {/* Bookmark */}
          <button
            onClick={() => onBookmarkToggle(quote.id)}
            className="btn-icon"
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark quote'}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
            style={{ color: bookmarked ? 'var(--color-accent)' : undefined }}
          >
            {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          </button>

          {/* Focus / reading mode */}
          <button
            onClick={() => onFocusMode(quote)}
            className="btn-icon"
            aria-label="Reading mode"
            title="Focus mode"
          >
            <Eye size={15} />
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(quote)}
            className="btn-icon"
            aria-label="Edit quote"
            title="Edit"
          >
            <Edit3 size={15} />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(quote.id)}
            className="btn-icon"
            aria-label="Delete quote"
            title="Delete"
            style={{ color: 'var(--color-error)' }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Reading Mode Overlay ────────────────────────────────── */
const ReadingMode: React.FC<{ quote: QuoteWithCategories; onClose: () => void }> = ({ quote, onClose }) => {
  const isGujarati = quote.language === 'gu';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="reading-mode-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Reading mode"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
        }}
        className="btn-icon"
        aria-label="Close reading mode"
      >
        <X size={20} />
      </button>
      <div
        style={{ maxWidth: 640, width: '100%', padding: '0 1rem', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 40,
            height: 2,
            background: 'var(--color-accent)',
            margin: '0 auto 2rem',
          }}
        />
        <blockquote
          lang={isGujarati ? 'gu' : 'en'}
          style={{
            fontFamily: isGujarati ? 'var(--font-gujarati)' : 'var(--font-display)',
            fontSize: isGujarati ? '1.35rem' : 'clamp(1.25rem, 3vw, 2rem)',
            lineHeight: isGujarati ? 2.2 : 1.75,
            fontStyle: isGujarati ? 'normal' : 'italic',
            color: 'var(--color-text-primary)',
          }}
        >
          <RichTextDisplay content={quote.text} />
        </blockquote>
        {quote.categories.length > 0 && (
          <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {quote.categories.map((c) => (
              <span key={c.id} className="tag-pill">{c.name}</span>
            ))}
          </div>
        )}
        <p
          style={{
            marginTop: '1.5rem',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
          }}
        >
          Press Escape or click outside to close
        </p>
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────── */
const QuotesList: React.FC = () => {
  const [quotes, setQuotes] = useState<QuoteWithCategories[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteWithCategories | null>(null);
  const [focusQuote, setFocusQuote] = useState<QuoteWithCategories | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(getBookmarks);
  const [showFilters, setShowFilters] = useState(false);
  const [newQuote, setNewQuote] = useState({ text: '', category_ids: [] as string[], language: 'en' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [{ data: quotesData }, { data: categoriesData }] = await Promise.all([
        supabase.from('quotes').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);

      const quotesWithCats: QuoteWithCategories[] = await Promise.all(
        (quotesData || []).map(async (q) => {
          if (!q.category_ids?.length) return { ...q, categories: [] };
          const { data: cats } = await supabase.from('categories').select('*').in('id', q.category_ids);
          return { ...q, categories: cats || [] };
        })
      );

      setQuotes(quotesWithCats);
      setCategories(categoriesData || []);
    } catch (e) {
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast('Bookmark removed'); }
      else { next.add(id); toast.success('Bookmarked!'); }
      saveBookmarks(next);
      return next;
    });
  }, []);

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.text.trim() || newQuote.category_ids.length === 0) {
      toast.error('Please fill in the quote and select at least one category');
      return;
    }
    try {
      setSubmitting(true);
      const { data, error } = await supabase
        .from('quotes')
        .insert({ ...newQuote, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      toast.success('Quote added');
      setNewQuote({ text: '', category_ids: [], language: 'en' });
      setShowAddForm(false);
      loadData();
    } catch (e) {
      toast.error('Failed to add quote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('quotes')
        .update({ text: editingQuote.text, category_ids: editingQuote.category_ids, language: editingQuote.language, updated_at: new Date().toISOString() })
        .eq('id', editingQuote.id);
      if (error) throw error;
      toast.success('Quote updated');
      setEditingQuote(null);
      loadData();
    } catch {
      toast.error('Failed to update quote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quote?')) return;
    try {
      await supabase.from('quotes').delete().eq('id', id);
      toast.success('Quote deleted');
      loadData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filteredQuotes = quotes.filter((q) => {
    const matchSearch = stripHtml(q.text).toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategories.length === 0 || selectedCategories.some((id) => q.category_ids.includes(id));
    const matchLang = !selectedLanguage || q.language === selectedLanguage;
    return matchSearch && matchCat && matchLang;
  });

  const uniqueLanguages = [...new Set(quotes.map((q) => q.language))];

  const FormModal: React.FC<{ isEdit?: boolean }> = ({ isEdit }) => {
    const data = isEdit ? editingQuote! : newQuote;
    const setData = isEdit
      ? (d: any) => setEditingQuote(d)
      : (d: any) => setNewQuote(d);

    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(28,28,26,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }}
        role="dialog" aria-modal="true"
        aria-label={isEdit ? 'Edit quote' : 'Add quote'}
      >
        <div
          style={{
            background: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            width: '100%', maxWidth: 560,
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {isEdit ? 'Edit Quote' : 'New Quote'}
            </h2>
            <button
              onClick={() => isEdit ? setEditingQuote(null) : setShowAddForm(false)}
              className="btn-icon" aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={isEdit ? handleUpdateQuote : handleAddQuote} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Quote text */}
            <div>
              <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                Quote *
              </label>
              <RichTextEditor
                value={data.text}
                onChange={(v) => setData({ ...data, text: v })}
                placeholder="Enter the quote…"
              />
            </div>

            {/* Language */}
            <div>
              <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                Language
              </label>
              <select
                value={data.language}
                onChange={(e) => setData({ ...data, language: e.target.value })}
                className="input-field"
                style={{ background: 'var(--color-bg-muted)' }}
              >
                {Object.entries(languageNames).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>

            {/* Categories */}
            <div>
              <label style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                Categories *
              </label>
              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  maxHeight: 160, overflowY: 'auto',
                  background: 'var(--color-bg-muted)',
                  display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
                }}
              >
                {categories.map((cat) => {
                  const selected = data.category_ids.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        const ids = selected
                          ? data.category_ids.filter((id: string) => id !== cat.id)
                          : [...data.category_ids, cat.id];
                        setData({ ...data, category_ids: ids });
                      }}
                      className={`tag-pill${selected ? ' active' : ''}`}
                      style={{ cursor: 'pointer', border: '1px solid', borderColor: selected ? 'var(--color-accent)' : 'var(--color-border)' }}
                    >
                      {selected && <Check size={11} />}
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => isEdit ? setEditingQuote(null) : setShowAddForm(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add quote'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Quotes
          </h1>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {quotes.length} quote{quotes.length !== 1 ? 's' : ''} in your collection
          </p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary" aria-label="Add new quote">
          <Plus size={16} aria-hidden="true" />
          Add Quote
        </button>
      </div>

      {/* Search + filter bar */}
      <div
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search quotes…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '2.25rem' }}
              aria-label="Search quotes"
            />
          </div>

          {/* Language filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="input-field"
            style={{ width: 'auto', minWidth: 120, background: 'var(--color-bg-muted)' }}
            aria-label="Filter by language"
          >
            <option value="">All languages</option>
            {uniqueLanguages.map((lang) => (
              <option key={lang} value={lang}>{languageNames[lang] || lang}</option>
            ))}
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-ghost"
            aria-label="Toggle category filters"
            aria-expanded={showFilters}
            style={{ color: selectedCategories.length > 0 ? 'var(--color-accent)' : undefined }}
          >
            <Filter size={15} />
            Categories
            {selectedCategories.length > 0 && (
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--color-accent)', color: '#fff',
                  fontSize: '10px', fontWeight: 700,
                }}
              >
                {selectedCategories.length}
              </span>
            )}
            <ChevronDown size={13} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </button>
        </div>

        {/* Category pills */}
        {showFilters && (
          <div style={{ paddingTop: '0.875rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid var(--color-border)', marginTop: '0.875rem' }}>
            {categories.map((cat) => {
              const active = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategories(active ? selectedCategories.filter(id => id !== cat.id) : [...selectedCategories, cat.id])}
                  className={`tag-pill${active ? ' active' : ''}`}
                  style={{ cursor: 'pointer' }}
                  aria-pressed={active}
                >
                  {cat.name}
                </button>
              );
            })}
            {selectedCategories.length > 0 && (
              <button onClick={() => setSelectedCategories([])} className="btn-ghost" style={{ padding: '0.2rem 0.6rem', minHeight: 'auto' }}>
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      {(searchTerm || selectedCategories.length > 0 || selectedLanguage) && (
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          {filteredQuotes.length} result{filteredQuotes.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Quote cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div
          style={{
            textAlign: 'center', padding: '4rem 2rem',
            background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ width: 56, height: 56, background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Quote size={24} color="var(--color-text-muted)" />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            {searchTerm || selectedCategories.length > 0 ? 'No matching quotes' : 'No quotes yet'}
          </h3>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            {searchTerm ? 'Try a different search term' : 'Add your first quote to begin your collection'}
          </p>
          {!searchTerm && (
            <button onClick={() => setShowAddForm(true)} className="btn-primary">
              <Plus size={15} /> Add your first quote
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredQuotes.map((q, i) => (
            <QuoteCard
              key={q.id}
              quote={q}
              onEdit={setEditingQuote}
              onDelete={handleDelete}
              bookmarked={bookmarks.has(q.id)}
              onBookmarkToggle={handleBookmarkToggle}
              onFocusMode={setFocusQuote}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddForm && <FormModal />}
      {editingQuote && <FormModal isEdit />}
      {focusQuote && <ReadingMode quote={focusQuote} onClose={() => setFocusQuote(null)} />}
    </div>
  );
};

export default QuotesList;
