import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Quote, BookOpen, TrendingUp, Languages, ArrowRight, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';

const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

interface DashboardStats {
  totalQuotes: number;
  totalUnderstanding: number;
  draftCount: number;
  totalWordCount: number;
  languageStats: { [key: string]: number };
  recentActivity: Array<{
    id: string;
    type: 'quote' | 'understanding';
    title: string;
    created_at: string;
  }>;
  quoteOfDay?: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalQuotes: 0,
    totalUnderstanding: 0,
    draftCount: 0,
    totalWordCount: 0,
    languageStats: {},
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);

  // Manage daily streak
  useEffect(() => {
    const today = new Date().toDateString();
    const saved = JSON.parse(localStorage.getItem('wk-streak') || '{"days":0,"last":""}');
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (saved.last === today) {
      setStreak(saved.days);
    } else if (saved.last === yesterday) {
      const newStreak = saved.days + 1;
      setStreak(newStreak);
      localStorage.setItem('wk-streak', JSON.stringify({ days: newStreak, last: today }));
    } else {
      setStreak(1);
      localStorage.setItem('wk-streak', JSON.stringify({ days: 1, last: today }));
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      const [{ data: quotesData }, { data: understandingData }, { data: recentQuotes }, { data: recentUnderstanding }] =
        await Promise.all([
          supabase.from('quotes').select('language, text'),
          supabase.from('understanding').select('word_count, is_draft, language, title, created_at'),
          supabase.from('quotes').select('id, text, created_at').order('created_at', { ascending: false }).limit(3),
          supabase.from('understanding').select('id, title, created_at').order('created_at', { ascending: false }).limit(3),
        ]);

      const languageStats: { [key: string]: number } = {};
      quotesData?.forEach((q) => {
        languageStats[q.language] = (languageStats[q.language] || 0) + 1;
      });
      understandingData?.forEach((e) => {
        languageStats[e.language] = (languageStats[e.language] || 0) + 1;
      });

      // Quote of the day — deterministic by date
      let quoteOfDay = '';
      if (quotesData && quotesData.length > 0) {
        const dayIndex = Math.floor(Date.now() / 86400000) % quotesData.length;
        quoteOfDay = stripHtml(quotesData[dayIndex].text);
      }

      const recentActivity = [
        ...(recentQuotes?.map((q) => ({
          id: q.id,
          type: 'quote' as const,
          title: stripHtml(q.text).substring(0, 60) + (q.text.length > 60 ? '…' : ''),
          created_at: q.created_at,
        })) || []),
        ...(recentUnderstanding?.map((e) => ({
          id: e.id,
          type: 'understanding' as const,
          title: e.title,
          created_at: e.created_at,
        })) || []),
      ]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setStats({
        totalQuotes: quotesData?.length || 0,
        totalUnderstanding: understandingData?.length || 0,
        draftCount: understandingData?.filter((e) => e.is_draft).length || 0,
        totalWordCount: understandingData?.reduce((s, e) => s + (e.word_count || 0), 0) || 0,
        languageStats,
        recentActivity,
        quoteOfDay,
      });
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const langLabel: { [k: string]: string } = {
    en: 'English', hi: 'Hindi', gu: 'Gujarati', sa: 'Sanskrit',
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div className="skeleton" style={{ height: 32, width: 200, marginBottom: '2rem' }} />
          <div className="skeleton" style={{ height: 160, marginBottom: '2rem', borderRadius: 'var(--radius-lg)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 'clamp(1.5rem, 4vw, 3rem)',
        maxWidth: 960,
        margin: '0 auto',
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: 'var(--color-text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}
        >
          {today}
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Your Wisdom Library
        </h1>

        {streak > 0 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              marginTop: '0.75rem',
              padding: '0.375rem 0.875rem',
              background: 'var(--color-accent-light)',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--color-accent)',
            }}
          >
            <Flame size={13} aria-hidden="true" />
            Day {streak} reading streak
          </div>
        )}
      </div>

      {/* ── Quote of the Day ────────────────────────────────── */}
      {stats.quoteOfDay && (
        <div
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(1.5rem, 4vw, 2.5rem)',
            marginBottom: '2rem',
            position: 'relative',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.75rem',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--color-accent)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Quote of the Day
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '2rem',
              bottom: '2rem',
              width: '3px',
              background: 'var(--color-accent)',
              borderRadius: '0 3px 3px 0',
            }}
          />
          <blockquote
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
              fontStyle: 'italic',
              lineHeight: 1.7,
              color: 'var(--color-text-primary)',
              paddingLeft: '1rem',
              paddingRight: '3rem',
              marginTop: '0.25rem',
            }}
          >
            "{stats.quoteOfDay}"
          </blockquote>
        </div>
      )}

      {/* ── Stats grid ──────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {[
          { label: 'Quotes', value: stats.totalQuotes, icon: Quote, link: '/quotes' },
          { label: 'Learnings', value: stats.totalUnderstanding, icon: BookOpen, link: '/understanding' },
          { label: 'Words written', value: stats.totalWordCount.toLocaleString(), icon: TrendingUp, link: '/understanding' },
          { label: 'Languages', value: Object.keys(stats.languageStats).length, icon: Languages, link: '/search' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.link}
              style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                textDecoration: 'none',
                display: 'block',
                boxShadow: 'var(--shadow-xs)',
                transition: 'box-shadow var(--transition-base), border-color var(--transition-base)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-strong)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xs)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: 'var(--color-accent-light)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Icon size={16} color="var(--color-accent)" aria-hidden="true" />
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1,
                  marginBottom: '0.375rem',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {stat.label}
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Two-column: recent activity + languages ──────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Recent Activity */}
        <div
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              Recent Activity
            </h2>
          </div>
          <div>
            {stats.recentActivity.length === 0 ? (
              <p
                style={{
                  padding: '2rem 1.5rem',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                }}
              >
                No activity yet. Add your first quote!
              </p>
            ) : (
              stats.recentActivity.map((item, i) => (
                <Link
                  key={item.id}
                  to={item.type === 'quote' ? '/quotes' : `/understanding/${item.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.875rem',
                    padding: '1rem 1.5rem',
                    borderBottom: i < stats.recentActivity.length - 1 ? '1px solid var(--color-border)' : 'none',
                    textDecoration: 'none',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-muted)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-accent-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {item.type === 'quote' ? (
                      <Quote size={13} color="var(--color-accent)" />
                    ) : (
                      <BookOpen size={13} color="var(--color-accent)" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-primary)',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.title}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                        marginTop: '2px',
                      }}
                    >
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Language breakdown */}
        <div
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              Languages
            </h2>
          </div>
          <div style={{ padding: '1.25rem 1.5rem' }}>
            {Object.entries(stats.languageStats).map(([lang, count]) => {
              const total = Object.values(stats.languageStats).reduce((a, b) => a + b, 0);
              const pct = total ? Math.round((count / total) * 100) : 0;
              return (
                <div key={lang} style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.375rem',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      {langLabel[lang] || lang}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {count} · {pct}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: 'var(--color-border)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'var(--color-accent)',
                        borderRadius: 2,
                        transition: 'width 600ms ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(stats.languageStats).length === 0 && (
              <p
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  padding: '1rem 0',
                }}
              >
                No content yet
              </p>
            )}
          </div>

          {/* Quick links */}
          <div
            style={{
              padding: '0 1.5rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <Link
              to="/quotes"
              className="btn-primary"
              style={{ textDecoration: 'none', justifyContent: 'center' }}
            >
              <Quote size={15} aria-hidden="true" />
              Browse Quotes
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link
              to="/understanding"
              className="btn-ghost"
              style={{ textDecoration: 'none', justifyContent: 'center' }}
            >
              <BookOpen size={15} aria-hidden="true" />
              View Learnings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
