import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search as SearchIcon, 
  Quote, 
  BookOpen, 
  Calendar,
  Languages,
  Tag,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type SearchResult = {
  id: string;
  type: 'quote' | 'understanding';
  title: string;
  content: string;
  category: string;
  language: string;
  created_at: string;
  word_count?: number;
};

const Search: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'quotes' | 'understanding'>('all');
  const [selectedLanguage, setSelectedLanguage] = useState('');

  useEffect(() => {
    if (searchTerm.trim()) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchTerm, selectedType, selectedLanguage]);

  const performSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      const results: SearchResult[] = [];

      // Search quotes if needed
      if (selectedType === 'all' || selectedType === 'quotes') {
        const quotesQuery = supabase
          .from('quotes')
          .select(`
            id,
            text,
            language,
            created_at,
            categories (name)
          `)
          .textSearch('text', searchTerm);

        if (selectedLanguage) {
          quotesQuery.eq('language', selectedLanguage);
        }

        const { data: quotesData } = await quotesQuery;

        quotesData?.forEach(quote => {
          results.push({
            id: quote.id,
            type: 'quote',
            title: `"${quote.text.substring(0, 100)}${quote.text.length > 100 ? '...' : ''}"`,
            content: quote.text,
            category: quote.categories?.name || 'Unknown',
            language: quote.language,
            created_at: quote.created_at
          });
        });
      }

      // Search understanding if needed
      if (selectedType === 'all' || selectedType === 'understanding') {
        const understandingQuery = supabase
          .from('understanding')
          .select(`
            id,
            title,
            description,
            language,
            word_count,
            created_at,
            categories (name)
          `)
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

        if (selectedLanguage) {
          understandingQuery.eq('language', selectedLanguage);
        }

        const { data: understandingData } = await understandingQuery;

        understandingData?.forEach(entry => {
          results.push({
            id: entry.id,
            type: 'understanding',
            title: entry.title,
            content: entry.description,
            category: entry.categories?.name || 'Unknown',
            language: entry.language,
            word_count: entry.word_count,
            created_at: entry.created_at
          });
        });
      }

      // Sort by relevance and date
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setResults(results);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Search</h1>
        <p className="text-slate-600">Find your quotes and understanding entries</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
        <div className="relative mb-4">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search your wisdom collection..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 sm:py-4 text-base sm:text-lg border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="text-sm border border-slate-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="quotes">Quotes</option>
              <option value="understanding">Understanding</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Languages className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-sm border border-slate-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Languages</option>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="hi">Hindi</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-slate-600 mt-2">Searching...</p>
          </div>
        )}

        {!loading && searchTerm && results.length === 0 && (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No results found</h3>
            <p className="text-slate-600">
              Try different keywords or adjust your filters
            </p>
          </div>
        )}

        {!loading && !searchTerm && (
          <div className="text-center py-12">
            <SearchIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Start searching</h3>
            <p className="text-slate-600">
              Enter keywords to find your quotes and understanding entries
            </p>
          </div>
        )}

        {!loading && results.map((result) => (
          <motion.div
            key={`${result.type}-${result.id}`}
            className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  result.type === 'quote' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {result.type === 'quote' ? (
                    <Quote className="w-5 h-5 text-blue-600" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                    {highlightText(result.title, searchTerm)}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-slate-500 mt-1">
                    <span className="flex items-center">
                      <Tag className="w-3 h-3 mr-1" />
                      {result.category}
                    </span>
                    <span className="flex items-center">
                      <Languages className="w-3 h-3 mr-1" />
                      {result.language === 'en' ? 'English' : result.language}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(result.created_at).toLocaleDateString()}
                    </span>
                    {result.word_count && (
                      <span>{result.word_count} words</span>
                    )}
                  </div>
                </div>
              </div>
              
              <span className={`text-xs px-2 py-1 rounded-full ${
                result.type === 'quote' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {result.type}
              </span>
            </div>

            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-relaxed">
                {result.type === 'quote' ? (
                  <span className="italic">
                    "{highlightText(result.content, searchTerm)}"
                  </span>
                ) : (
                  highlightText(
                    result.content.length > 200 
                      ? `${result.content.substring(0, 200)}...` 
                      : result.content,
                    searchTerm
                  )
                )}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Results Summary */}
      {!loading && results.length > 0 && (
        <div className="mt-8 text-center text-sm text-slate-600">
          Found {results.length} result{results.length !== 1 ? 's' : ''} for "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default Search;