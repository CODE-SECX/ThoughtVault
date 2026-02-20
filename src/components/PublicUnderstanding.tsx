import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, Database } from '../lib/supabase';
import { BookOpen, Languages, Calendar, FileText, Link as LinkIcon } from 'lucide-react';
import RichTextDisplay from './RichTextDisplay';

type UnderstandingRow = Database['public']['Tables']['understanding']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];

const PublicUnderstanding: React.FC = () => {
  const { id } = useParams();
  const [entry, setEntry] = useState<UnderstandingRow | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
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
        setEntry(data);
        if (data.category_ids && data.category_ids.length > 0) {
          const { data: cats } = await supabase
            .from('categories')
            .select('*')
            .in('id', data.category_ids);
          setCategories(cats || []);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load entry');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 rounded w-1/2"></div>
            <div className="h-48 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
          <p className="text-slate-700 font-medium text-lg">{error || 'Entry not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <div key={category.id} className="flex items-center space-x-2 bg-purple-50 px-4 py-2 rounded-full border border-purple-100">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700">
                    {category.name}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
              <Languages className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">
                {entry.language === 'en' ? 'English' : entry.language}
              </span>
            </div>
            {entry.is_draft && (
              <span className="text-xs font-semibold bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full border border-yellow-200">
                Draft
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-8 leading-tight">
            {entry.title}
          </h1>

          {/* Content */}
          <div className="prose prose-lg prose-slate max-w-none mb-8">
            <RichTextDisplay 
              content={entry.description}
              className="text-slate-700 leading-relaxed"
            />
          </div>

          {/* Real-life Connection */}
          {entry.real_life_connection && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-lg border-2 border-blue-200 mb-8">
              <h4 className="font-bold text-lg text-blue-900 mb-4 flex items-center">
                <LinkIcon className="w-5 h-5 mr-3" />
                Real-life Connection
              </h4>
              <div className="text-blue-900 leading-relaxed text-base font-medium">
                <RichTextDisplay 
                  content={entry.real_life_connection}
                  className="text-blue-900"
                />
              </div>
            </div>
          )}

          {/* Metadata Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-8 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center text-sm text-slate-600 font-medium">
                <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                Created: {new Date(entry.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              {entry.updated_at !== entry.created_at && (
                <div className="flex items-center text-sm text-slate-600 font-medium">
                  <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                  Updated: {new Date(entry.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}
              <div className="flex items-center text-sm text-slate-600 font-medium">
                <FileText className="w-4 h-4 mr-2 text-slate-500" />
                {entry.word_count} words
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicUnderstanding;
