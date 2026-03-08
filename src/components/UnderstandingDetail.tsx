import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Database } from '../lib/supabase';
import { 
  ArrowLeft, 
  Share2, 
  Trash2, 
  Edit3, 
  Languages, 
  Link as LinkIcon,
  FileText,
  Clock,
  Tag,
  BookOpen
} from 'lucide-react';
import RichTextDisplay from './RichTextDisplay';
import SmartCopyButton from './SmartCopyButton';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import krishnaIcon from '../assets/little_krishna.png';

type UnderstandingRow = Database['public']['Tables']['understanding']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];

interface UnderstandingWithCategories extends UnderstandingRow {
  categories: CategoryRow[];
}

const languageNames: Record<string, string> = {
  en: "English",
  hi: "हिन्दी (Hindi)",
  gu: "ગુજરાતી (Gujarati)",
  sa: "संस्कृत (Sanskrit)",
  es: "Español (Spanish)",
  fr: "Français (French)",
  de: "Deutsch (German)",
  it: "Italiano (Italian)",
  pt: "Português (Portuguese)",
  ru: "Русский (Russian)",
  zh: "中文 (Chinese)",
  ja: "日本語 (Japanese)",
  ko: "한국어 (Korean)"
};

const UnderstandingDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<UnderstandingWithCategories | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!id) {
          setError('Missing entry id');
          return;
        }
        const { data, error } = await supabase
          .from('understanding')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        if (!data) {
          setError('Entry not found');
          return;
        }

        let categories: CategoryRow[] = [];
        if (data.category_ids && data.category_ids.length > 0) {
          const { data: cats } = await supabase
            .from('categories')
            .select('*')
            .in('id', data.category_ids);
          categories = cats || [];
        }

        setEntry({ ...data, categories });
      } catch (e: unknown) {
        const err = e as Error;
        setError(err?.message || 'Failed to load entry');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!entry) return;
    if (!confirm('Are you sure you want to delete this understanding entry?')) return;

    try {
      const { error } = await supabase
        .from('understanding')
        .delete()
        .eq('id', entry.id);

      if (error) throw error;

      toast.success('Understanding entry deleted successfully');
      navigate('/understanding');
    } catch (error) {
      console.error('Error deleting understanding:', error);
      toast.error('Failed to delete understanding entry');
    }
  };

  const copyShareLink = async () => {
    if (!entry) return;
    try {
      const url = `${window.location.origin}/p/understanding/${entry.id}`;
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied!');
    } catch (error) {
      console.error('Failed to copy share link:', error);
      toast.error('Failed to copy share link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-700 font-medium text-lg mb-8">{error || 'Entry not found'}</p>
          <button
            onClick={() => navigate('/understanding')}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Understanding</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => navigate('/understanding')}
                className="flex items-center space-x-2 text-slate-600 hover:text-purple-600 font-medium transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-1">
                <motion.button
                  onClick={copyShareLink}
                  className="p-2.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-all rounded-xl"
                  title="Copy share link"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Share2 className="w-5 h-5" />
                </motion.button>
                <SmartCopyButton
                  content={entry.description}
                  type="Understanding"
                  className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all rounded-xl p-2.5"
                />
                <motion.button
                  onClick={() => navigate(`/understanding/${entry.id}/edit`)}
                  className="p-2.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-all rounded-xl"
                  title="Edit entry"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Edit3 className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={handleDelete}
                  className="p-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl"
                  title="Delete entry"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Trash2 className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-8 leading-tight">
              {entry.title}
            </h1>

            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg shadow-purple-100/50 border border-white/50 p-8 sm:p-12 mb-8">
              <div className="prose prose-lg prose-slate max-w-none">
                <RichTextDisplay 
                  content={entry.description}
                  className="text-slate-700 leading-relaxed text-xl"
                />
              </div>
            </div>

            {entry.real_life_connection && (
              <motion.div 
                className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border border-blue-100/50 p-8 sm:p-12 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="font-bold text-blue-900 mb-6 flex items-center text-xl">
                  <LinkIcon className="w-6 h-6 mr-3" />
                  Real-life Connection
                </h3>
                <div className="prose prose-lg prose-blue max-w-none">
                  <RichTextDisplay 
                    content={entry.real_life_connection}
                    className="text-blue-800 leading-relaxed"
                  />
                </div>
              </motion.div>
            )}

            <motion.div 
              className="flex items-center gap-4 py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <img 
                src={krishnaIcon} 
                alt="Krishna" 
                className="h-20 w-auto"
              />
              <span 
                className="text-2xl uppercase"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 50%, #f59e0b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontWeight: 900,
                  letterSpacing: '0.05em'
                }}
              >
                Hare Krishna...
              </span>
            </motion.div>

            <motion.div 
              className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg shadow-purple-100/50 border border-white/50 p-6 sm:p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                    <Tag className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categories</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {entry.categories.map(category => (
                        <span 
                          key={category.id}
                          className="inline-flex items-center bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-purple-100"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-px h-12 bg-slate-200 hidden sm:block" />

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    <Languages className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Language</p>
                    <p className="text-slate-700 font-semibold">
                      {languageNames[entry.language] || entry.language}
                    </p>
                  </div>
                </div>

                <div className="w-px h-12 bg-slate-200 hidden sm:block" />

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</p>
                    <p className="text-slate-700 font-semibold">
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {entry.updated_at !== entry.created_at && (
                  <>
                    <div className="w-px h-12 bg-slate-200 hidden sm:block" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Updated</p>
                        <p className="text-slate-700 font-semibold">
                          {new Date(entry.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <div className="w-px h-12 bg-slate-200 hidden sm:block" />

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Words</p>
                    <p className="text-slate-700 font-semibold">{entry.word_count}</p>
                  </div>
                </div>

                {entry.reference && (
                  <>
                    <div className="w-px h-12 bg-slate-200 hidden sm:block" />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reference</p>
                        <p className="text-slate-700 font-semibold">
                          {entry.reference}
                          {entry.page_slok_number && <span className="text-slate-500"> ({entry.page_slok_number})</span>}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {entry.is_draft && (
                  <>
                    <div className="w-px h-12 bg-slate-200 hidden sm:block" />
                    <span className="inline-flex items-center bg-yellow-100 text-yellow-700 text-sm font-bold px-4 py-2 rounded-xl">
                      Draft
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          </motion.article>
        </div>

        <div className="h-20" />
      </motion.div>
    </div>
  );
};

export default UnderstandingDetail;
