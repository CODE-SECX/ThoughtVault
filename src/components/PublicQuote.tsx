import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, Database } from '../lib/supabase';
import { Quote as QuoteIcon, Languages, Calendar, Clock } from 'lucide-react';
import RichTextDisplay from './RichTextDisplay';

type QuoteRow = Database['public']['Tables']['quotes']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];

const PublicQuote: React.FC = () => {
  const { id } = useParams();
  const [quote, setQuote] = useState<QuoteRow | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!id) {
          setError('Missing quote id');
          return;
        }
        const { data, error } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        if (!data) {
          setError('Quote not found');
          return;
        }
        setQuote(data);
        if (data.category_ids && data.category_ids.length > 0) {
          const { data: cats } = await supabase
            .from('categories')
            .select('*')
            .in('id', data.category_ids);
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-48 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-6 text-center">
          <p className="text-slate-700">{error || 'Quote not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                <QuoteIcon className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">
                  {category.name}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full">
            <Languages className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-600">
              {quote.language === 'en' ? 'English' : quote.language}
            </span>
          </div>
        </div>

        <blockquote className="text-slate-800 text-lg leading-relaxed border-l-4 border-blue-200 pl-6 italic bg-blue-50 p-6 rounded-r-lg">
          "<RichTextDisplay content={quote.text} className="inline" />"
        </blockquote>

        <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t border-slate-200 mt-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Created: {new Date(quote.created_at).toLocaleDateString()}
            </div>
            {quote.updated_at !== quote.created_at && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Updated: {new Date(quote.updated_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicQuote;
