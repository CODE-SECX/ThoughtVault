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
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-64 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-6 text-center">
          <p className="text-slate-700">{error || 'Entry not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded-full">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">
                  {category.name}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full">
            <Languages className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-600">
              {entry.language === 'en' ? 'English' : entry.language}
            </span>
          </div>
          {entry.is_draft && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Draft
            </span>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{entry.title}</h2>
          <div className="prose prose-slate max-w-none">
            <RichTextDisplay 
              content={entry.description}
              className="text-slate-700 leading-relaxed"
            />
          </div>
        </div>

        {entry.real_life_connection && (
          <div className="bg-blue-50 p-4 rounded-lg mt-6">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <LinkIcon className="w-4 h-4 mr-2" />
              Real-life Connection
            </h4>
            <div className="text-blue-800 leading-relaxed">
              <RichTextDisplay 
                content={entry.real_life_connection}
                className="text-blue-800"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t border-slate-200 mt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Created: {new Date(entry.created_at).toLocaleDateString()}
            </div>
            {entry.updated_at !== entry.created_at && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Updated: {new Date(entry.updated_at).toLocaleDateString()}
              </div>
            )}
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              {entry.word_count} words
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicUnderstanding;
