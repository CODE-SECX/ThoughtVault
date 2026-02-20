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
            <div className="h-12 bg-slate-200 rounded w-1/2"></div>
            <div className="h-32 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="p-8">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
          <p className="text-slate-700 font-medium text-lg">{error || 'Quote not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <div key={category.id} className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                  <QuoteIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">
                    {category.name}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
              <Languages className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-700">
                {quote.language === 'en' ? 'English' : quote.language}
              </span>
            </div>
          </div>

          {/* Quote */}
          <blockquote className="text-2xl sm:text-3xl text-slate-900 leading-relaxed border-l-8 border-blue-400 pl-8 italic font-medium mb-8 py-4">
            "<RichTextDisplay content={quote.text} className="inline not-italic" />"
          </blockquote>

          {/* Metadata Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-8 border-t border-slate-200">
            <div className="flex items-center text-sm text-slate-600 font-medium">
              <Calendar className="w-4 h-4 mr-2 text-slate-500" />
              Created: {new Date(quote.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            {quote.updated_at !== quote.created_at && (
              <div className="flex items-center text-sm text-slate-600 font-medium">
                <Clock className="w-4 h-4 mr-2 text-slate-500" />
                Updated: {new Date(quote.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicQuote;
