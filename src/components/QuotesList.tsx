import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Quote,
  Calendar,
  Languages,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Share2,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import toast from 'react-hot-toast';
import RichTextEditor from './RichTextEditor';
import RichTextDisplay from './RichTextDisplay';

const languageNames: { [key: string]: string } = {
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

type QuoteWithCategories = Database['public']['Tables']['quotes']['Row'] & {
  categories: Database['public']['Tables']['categories']['Row'][];
};

const QuotesList: React.FC = () => {
  const [quotes, setQuotes] = useState<QuoteWithCategories[]>([]);
  const [categories, setCategories] = useState<Database['public']['Tables']['categories']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteWithCategories | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteWithCategories | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const [newQuote, setNewQuote] = useState({
    text: '',
    category_ids: [] as string[],
    language: 'en'
  });

  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  useEffect(() => {
    loadQuotes();
    loadCategories();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load categories for each quote
      const quotesWithCategories = await Promise.all(
        (data || []).map(async (quote) => {
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('*')
            .in('id', quote.category_ids);

          if (categoryError) {
            console.error('Error loading categories for quote:', categoryError);
            return { ...quote, categories: [] };
          }

          return { ...quote, categories: categoryData || [] };
        })
      );

      setQuotes(quotesWithCategories);
    } catch (error) {
      console.error('Error loading quotes:', error);
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.text.trim() || newQuote.category_ids.length === 0) {
      toast.error('Please fill in all required fields and select at least one category');
      return;
    }

    try {
      const { error } = await supabase
        .from('quotes')
        .insert([newQuote]);

      if (error) throw error;

      toast.success('Quote added successfully');
      setNewQuote({ text: '', category_ids: [], language: 'en' });
      setShowAddForm(false);
      loadQuotes();
    } catch (error) {
      console.error('Error adding quote:', error);
      toast.error('Failed to add quote');
    }
  };

  const handleUpdateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;

    try {
      const { error } = await supabase
        .from('quotes')
        .update({
          text: editingQuote.text,
          category_ids: editingQuote.category_ids,
          language: editingQuote.language
        })
        .eq('id', editingQuote.id);

      if (error) throw error;

      toast.success('Quote updated successfully');
      setEditingQuote(null);
      loadQuotes();
    } catch (error) {
      console.error('Error updating quote:', error);
      toast.error('Failed to update quote');
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Quote deleted successfully');
      loadQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.error('Failed to delete quote');
    }
  };

  const handleCategoryToggle = (categoryId: string, isNewQuote: boolean = true) => {
    if (isNewQuote) {
      setNewQuote(prev => ({
        ...prev,
        category_ids: prev.category_ids.includes(categoryId)
          ? prev.category_ids.filter(id => id !== categoryId)
          : [...prev.category_ids, categoryId]
      }));
    } else if (editingQuote) {
      setEditingQuote(prev => prev ? {
        ...prev,
        category_ids: prev.category_ids.includes(categoryId)
          ? prev.category_ids.filter(id => id !== categoryId)
          : [...prev.category_ids, categoryId]
      } : null);
    }
  };

  const handleFilterCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.some(catId => quote.category_ids.includes(catId));
    const matchesLanguage = selectedLanguage === '' || quote.language === selectedLanguage;
    
    return matchesSearch && matchesCategory && matchesLanguage;
  });

  const toggleCardExpansion = (quoteId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(quoteId)) {
      newExpanded.delete(quoteId);
    } else {
      newExpanded.add(quoteId);
    }
    setExpandedCards(newExpanded);
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const uniqueLanguages = [...new Set(quotes.map(q => q.language))];

  const copyToClipboard = async (text: string, type: string = 'content') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyShareLink = async (id: string) => {
    try {
      const url = `${window.location.origin}/p/quote/${id}`;
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied!');
    } catch (error) {
      console.error('Failed to copy share link:', error);
      toast.error('Failed to copy share link');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3">
              Quotes
            </h1>
            <p className="text-lg text-slate-600 font-medium">Collect and organize meaningful quotes</p>
          </div>
          <motion.button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all flex items-center space-x-2 shadow-lg w-full sm:w-auto justify-center font-semibold hover:scale-105 active:scale-95"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            <span>Add Quote</span>
          </motion.button>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 shadow-sm space-y-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-slate-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base font-medium transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Enhanced Category Filter */}
            <div className="flex-1 relative">
              <button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className="w-full flex items-center justify-between px-4 py-3.5 border border-slate-300/50 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryFilter ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showCategoryFilter && (
                  <motion.div
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-10"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="p-4 border-b border-slate-200">
                      <Search className="absolute left-8 top-8 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearchTerm}
                        onChange={(e) => setCategorySearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300/50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-4 space-y-2">
                      {categories
                        .filter(cat => cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()))
                        .map(category => (
                          <label key={category.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category.id)}
                              onChange={() => handleFilterCategoryToggle(category.id)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded cursor-pointer"
                            />
                            <span className="text-sm font-medium text-slate-700">{category.name}</span>
                          </label>
                        ))}
                    </div>
                    {selectedCategories.length > 0 && (
                      <div className="border-t border-slate-200 p-4">
                        <button
                          onClick={() => setSelectedCategories([])}
                          className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                          Clear Selection
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="flex-1 px-4 py-3.5 border border-slate-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <option value="">All Languages</option>
              {uniqueLanguages.map(lang => (
                <option key={lang} value={lang}>
                  {languageNames[lang] || lang}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quotes List */}
      <div className="space-y-6">
        <AnimatePresence>
          {filteredQuotes.map((quote, index) => (
            <motion.div
              key={quote.id}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-lg hover:shadow-blue-200/50 border border-slate-200/50 hover:border-blue-200 transition-all p-6 sm:p-7 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => setSelectedQuote(quote)}
            >
              <div className="space-y-4">
                {/* Header with Categories */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {quote.categories.map(category => (
                        <span key={category.id} className="text-xs font-bold bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200/50">
                          {category.name}
                        </span>
                      ))}
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium ml-auto sm:ml-0 bg-slate-50 px-3 py-1.5 rounded-full">
                        <Languages className="w-3.5 h-3.5" />
                        <span>{languageNames[quote.language] || quote.language}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyShareLink(quote.id);
                      }}
                      className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-lg"
                      title="Copy share link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(quote.text, 'Quote');
                      }}
                      className="p-2.5 text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all rounded-lg"
                      title="Copy quote"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingQuote(quote);
                      }}
                      className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all rounded-lg"
                      title="Edit quote"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteQuote(quote.id);
                      }}
                      className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-lg"
                      title="Delete quote"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Quote Content */}
                <blockquote className="text-lg text-slate-800 leading-relaxed border-l-4 border-blue-300 pl-6 italic py-2 font-medium group-hover:border-blue-500 transition-colors">
                  "{expandedCards.has(quote.id) ? (
                    <RichTextDisplay 
                      content={quote.text} 
                      className="inline not-italic text-slate-800"
                    />
                  ) : (
                    <RichTextDisplay 
                      content={truncateText(quote.text, 180)} 
                      className="inline not-italic text-slate-800"
                    />
                  )}"
                </blockquote>
                  
                {quote.text.length > 180 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCardExpansion(quote.id);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    <span>{expandedCards.has(quote.id) ? 'Show less' : 'Show more'}</span>
                    {expandedCards.has(quote.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center text-xs font-medium text-slate-500">
                  <Calendar className="w-3.5 h-3.5 mr-2" />
                  {new Date(quote.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredQuotes.length === 0 && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <Quote className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No quotes found</h3>
            <p className="text-slate-600 font-medium mb-6">
              {searchTerm || selectedCategories.length > 0 || selectedLanguage
                ? 'Try adjusting your filters or search terms'
                : 'Start by adding your first quote'
              }
            </p>
            {!(searchTerm || selectedCategories.length > 0 || selectedLanguage) && (
              <motion.button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                whileHover={{ scale: 1.05 }}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add First Quote
              </motion.button>
            )}
          </motion.div>
        )}
      </div>

      {/* Quote Detail Modal */}
      <AnimatePresence>
        {selectedQuote && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedQuote(null)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Quote Details</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyShareLink(selectedQuote.id)}
                    className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                    title="Copy share link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(selectedQuote.text, 'Quote')}
                    className="p-2 text-slate-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                    title="Copy quote"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap gap-2">
                    {selectedQuote.categories.map(category => (
                      <div key={category.id} className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                        <Quote className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">
                          {category.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full">
                    <Languages className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-600">
                      {languageNames[selectedQuote.language] || selectedQuote.language}
                    </span>
                  </div>
                </div>

                <blockquote className="text-slate-800 text-lg leading-relaxed border-l-4 border-blue-200 pl-6 italic bg-blue-50 p-6 rounded-r-lg">
                  "<RichTextDisplay 
                    content={selectedQuote.text} 
                    className="inline"
                  />"
                </blockquote>

                <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Created: {new Date(selectedQuote.created_at).toLocaleDateString()}
                    </div>
                    {selectedQuote.updated_at !== selectedQuote.created_at && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Updated: {new Date(selectedQuote.updated_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Quote Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Add New Quote</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleAddQuote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quote Text *
                  </label>
                  <RichTextEditor
                    value={newQuote.text}
                    onChange={(value) => setNewQuote({ ...newQuote, text: value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Categories * (Select at least one)
                  </label>
                  <div className="border border-slate-300 rounded-lg p-4 max-h-48 overflow-y-auto bg-white">
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center space-x-2 py-2">
                        <input
                          type="checkbox"
                          checked={newQuote.category_ids.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id, true)}
                          className="text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <span className="text-sm text-slate-700">{category.name}</span>
                      </label>
                    ))}
                  </div>
                  {newQuote.category_ids.length === 0 && (
                    <p className="text-red-500 text-sm mt-1">Please select at least one category</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Language
                  </label>
                  <select
                    value={newQuote.language}
                    onChange={(e) => setNewQuote({ ...newQuote, language: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="gu">ગુજરાતી (Gujarati)</option>
                    <option value="sa">संस्कृत (Sanskrit)</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="fr">Français (French)</option>
                    <option value="de">Deutsch (German)</option>
                    <option value="it">Italiano (Italian)</option>
                    <option value="pt">Português (Portuguese)</option>
                    <option value="ru">Русский (Russian)</option>
                    <option value="zh">中文 (Chinese)</option>
                    <option value="ja">日本語 (Japanese)</option>
                    <option value="ko">한국어 (Korean)</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Quote
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Quote Modal */}
      <AnimatePresence>
        {editingQuote && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingQuote(null)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Edit Quote</h3>
                <button
                  onClick={() => setEditingQuote(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateQuote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quote Text *
                  </label>
                  <RichTextEditor
                    value={editingQuote.text}
                    onChange={(value) => setEditingQuote({ ...editingQuote, text: value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Categories * (Select at least one)
                  </label>
                  <div className="border border-slate-300 rounded-lg p-4 max-h-48 overflow-y-auto bg-white">
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center space-x-2 py-2">
                        <input
                          type="checkbox"
                          checked={editingQuote.category_ids.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id, false)}
                          className="text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <span className="text-sm text-slate-700">{category.name}</span>
                      </label>
                    ))}
                  </div>
                  {editingQuote.category_ids.length === 0 && (
                    <p className="text-red-500 text-sm mt-1">Please select at least one category</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Language
                  </label>
                  <select
                    value={editingQuote.language}
                    onChange={(e) => setEditingQuote({ ...editingQuote, language: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="gu">ગુજરાતી (Gujarati)</option>
                    <option value="sa">संस्कृत (Sanskrit)</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="fr">Français (French)</option>
                    <option value="de">Deutsch (German)</option>
                    <option value="it">Italiano (Italian)</option>
                    <option value="pt">Português (Portuguese)</option>
                    <option value="ru">Русский (Russian)</option>
                    <option value="zh">中文 (Chinese)</option>
                    <option value="ja">日本語 (Japanese)</option>
                    <option value="ko">한국어 (Korean)</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingQuote(null)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Quote
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuotesList;

