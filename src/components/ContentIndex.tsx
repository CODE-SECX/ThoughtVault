import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Grid, Quote, BookOpen, Tag, BarChart3, 
  Search, Eye, Copy, X, ChevronRight, Languages, Trash2,
  Calendar, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import RichTextDisplay from './RichTextDisplay';

type ContentItem = {
  id: string;
  type: 'quote' | 'understanding';
  title: string;
  content: string;
  categories: string[];
  language: string;
  created_at: string;
  updated_at: string;
  word_count?: number;
  is_draft?: boolean;
};

type IndexStats = {
  totalItems: number;
  byType: { quotes: number; understanding: number };
  byLanguage: { [key: string]: number };
  byCategory: { [key: string]: number };
  byCategoryQuotes: { [key: string]: number };
  byCategoryUnderstanding: { [key: string]: number };
  byMonth: { [key: string]: number };
  recentItems: ContentItem[];
  popularTags: { [key: string]: number };
};

type ViewMode = 'overview' | 'quotes' | 'understanding' | 'categories' | 'analytics';

const ContentIndex: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [stats, setStats] = useState<IndexStats>({
    totalItems: 0,
    byType: { quotes: 0, understanding: 0 },
    byLanguage: {},
    byCategory: {},
    byCategoryQuotes: {},
    byCategoryUnderstanding: {},
    byMonth: {},
    recentItems: [],
    popularTags: {}
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  useEffect(() => {
    loadContentIndex();
  }, []);

  const loadContentIndex = async () => {
    try {
      setLoading(true);

      // Load quotes
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      // Load understanding entries
      const { data: understandingData } = await supabase
        .from('understanding')
        .select('*')
        .order('created_at', { ascending: false });

      // Load categories for quotes
      const quotesWithCategories = await Promise.all(
        (quotesData || []).map(async (quote) => {
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('*')
            .in('id', quote.category_ids || []);

          if (categoryError) {
            console.error('Error loading categories for quote:', categoryError);
            return { ...quote, categories: [] };
          }

          return { ...quote, categories: categoryData || [] };
        })
      );

      // Load categories for understanding entries
      const understandingWithCategories = await Promise.all(
        (understandingData || []).map(async (entry) => {
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('*')
            .in('id', entry.category_ids || []);

          if (categoryError) {
            console.error('Error loading categories for understanding:', categoryError);
            return { ...entry, categories: [] };
          }

          return { ...entry, categories: categoryData || [] };
        })
      );

      // Process content items
      const contentItems: ContentItem[] = [
        ...quotesWithCategories.map(quote => ({
          id: quote.id,
          type: 'quote' as const,
          title: `"${quote.text.substring(0, 60)}${quote.text.length > 60 ? '...' : ''}"`,
          content: quote.text,
          categories: quote.categories.map((cat: any) => cat.name),
          language: quote.language,
          created_at: quote.created_at,
          updated_at: quote.updated_at
        })),
        ...understandingWithCategories.map(entry => ({
          id: entry.id,
          type: 'understanding' as const,
          title: entry.title,
          content: entry.description,
          categories: entry.categories.map((cat: any) => cat.name),
          language: entry.language,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          word_count: entry.word_count,
          is_draft: entry.is_draft
        }))
      ];

      setContent(contentItems);

      // Generate statistics
      const stats = generateStats(contentItems);
      setStats(stats);

    } catch (error) {
      console.error('Error loading content index:', error);
      toast.error('Failed to load content index');
    } finally {
      setLoading(false);
    }
  };

  const generateStats = (items: ContentItem[]): IndexStats => {
    const byType = { quotes: 0, understanding: 0 };
    const byLanguage: { [key: string]: number } = {};
    const byCategory: { [key: string]: number } = {};
    const byCategoryQuotes: { [key: string]: number } = {};
    const byCategoryUnderstanding: { [key: string]: number } = {};
    const byMonth: { [key: string]: number } = {};
    const popularTags: { [key: string]: number } = {};

    items.forEach(item => {
      // Type stats
      if (item.type === 'quote') {
        byType.quotes++;
      } else {
        byType.understanding++;
      }

      // Language stats
      byLanguage[item.language] = (byLanguage[item.language] || 0) + 1;

      // Category stats
      item.categories.forEach(category => {
        byCategory[category] = (byCategory[category] || 0) + 1;
        if (item.type === 'quote') {
          byCategoryQuotes[category] = (byCategoryQuotes[category] || 0) + 1;
        } else {
          byCategoryUnderstanding[category] = (byCategoryUnderstanding[category] || 0) + 1;
        }
      });

      // Month stats
      const monthKey = new Date(item.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;

      // Extract tags from content (simple word frequency)
      if (item.content) {
        const words = item.content.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 3 && word.length < 20);
        
        words.forEach(word => {
          popularTags[word] = (popularTags[word] || 0) + 1;
        });
      }
    });

    return {
      totalItems: items.length,
      byType,
      byLanguage,
      byCategory,
      byCategoryQuotes,
      byCategoryUnderstanding,
      byMonth,
      recentItems: items.slice(0, 10),
      popularTags: Object.fromEntries(
        Object.entries(popularTags)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 20)
      )
    };
  };

  const filteredContent = content.filter(item => {
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !item.content.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedCategories.length > 0 && !selectedCategories.some(cat => item.categories.includes(cat))) {
      return false;
    }
    if (selectedLanguage && item.language !== selectedLanguage) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'type':
        return a.type.localeCompare(b.type);
      case 'date':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const deleteCategory = async (categoryName: string) => {
    try {
      // First, get the category ID
      const { data: categoryData, error: fetchError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .single();

      if (fetchError) {
        console.error('Error fetching category:', fetchError);
        toast.error('Failed to find category');
        return;
      }

      // Delete the category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryData.id);

      if (deleteError) {
        console.error('Error deleting category:', deleteError);
        toast.error('Failed to delete category');
        return;
      }

      toast.success(`Category "${categoryName}" deleted successfully`);
      
      // Remove from selected categories if it was selected
      setSelectedCategories(prev => prev.filter(cat => cat !== categoryName));
      
      // Reload the content index to refresh stats
      loadContentIndex();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const CategoryRow: React.FC<{
    selectedCategories: string[];
    onCategoriesChange: (categories: string[]) => void;
    categories: { [key: string]: number };
    colorScheme?: 'purple' | 'blue';
  }> = ({ selectedCategories, onCategoriesChange, categories, colorScheme = 'purple' }) => {
    const colorClasses = {
      purple: {
        selected: 'bg-purple-600 text-white border-purple-600',
        unselected: 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50',
        all: 'bg-slate-600 text-white border-slate-600'
      },
      blue: {
        selected: 'bg-blue-600 text-white border-blue-600',
        unselected: 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50',
        all: 'bg-slate-600 text-white border-slate-600'
      }
    };

    const toggleCategory = (category: string) => {
      if (selectedCategories.includes(category)) {
        onCategoriesChange(selectedCategories.filter(c => c !== category));
      } else {
        onCategoriesChange([...selectedCategories, category]);
      }
    };

    const clearAllCategories = () => {
      onCategoriesChange([]);
    };

    const totalCount = Object.values(categories).reduce((sum, count) => sum + count, 0);

    return (
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium text-slate-700 mr-2">Categories:</span>
        
        {/* All Categories button */}
        <button
          onClick={clearAllCategories}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            selectedCategories.length === 0 
              ? colorClasses[colorScheme].all
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({totalCount})
        </button>

        {/* Individual category buttons */}
        {Object.entries(categories).map(([category, count]) => (
          <button
            key={category}
            onClick={() => toggleCategory(category)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              selectedCategories.includes(category)
                ? colorClasses[colorScheme].selected
                : colorClasses[colorScheme].unselected
            }`}
          >
            {category} ({count})
          </button>
        ))}
      </div>
    );
  };

  const ViewModeButton: React.FC<{
    mode: ViewMode;
    icon: React.ReactNode;
    label: string;
    count?: number;
  }> = ({ mode, icon, label, count }) => (
    <button
      onClick={() => setViewMode(mode)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        viewMode === mode
          ? 'bg-purple-600 text-white'
          : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {count !== undefined && (
        <span className={`text-xs px-2 py-1 rounded-full ${
          viewMode === mode ? 'bg-purple-500' : 'bg-slate-200'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
    onClick?: () => void;
  }> = ({ icon, title, value, subtitle, onClick }) => (
    <motion.div
      className={`bg-white rounded-xl shadow-sm border border-slate-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''
      } transition-all p-6`}
      whileHover={onClick ? { y: -4 } : {}}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
          {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
        </div>
        <div className="flex items-center justify-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          {onClick && <ChevronRight className="w-4 h-4 text-slate-400 -ml-2" />}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center">
          <FileText className="w-10 h-10 mr-4 text-purple-600" />
          Content Index
        </h1>
        <p className="text-lg text-slate-600 font-medium">
          Discover and navigate your knowledge vault efficiently
        </p>
      </div>

      {/* View Mode Selector */}
      <div className="mb-8 flex flex-wrap gap-3">
        <ViewModeButton
          mode="overview"
          icon={<Grid className="w-4 h-4" />}
          label="Overview"
          count={stats.totalItems}
        />
        <ViewModeButton
          mode="quotes"
          icon={<Quote className="w-4 h-4" />}
          label="Quotes"
          count={stats.byType.quotes}
        />
        <ViewModeButton
          mode="understanding"
          icon={<BookOpen className="w-4 h-4" />}
          label="Understanding"
          count={stats.byType.understanding}
        />
        <ViewModeButton
          mode="categories"
          icon={<Tag className="w-4 h-4" />}
          label="Categories"
          count={Object.keys(stats.byCategory).length}
        />
        <ViewModeButton
          mode="analytics"
          icon={<BarChart3 className="w-4 h-4" />}
          label="Analytics"
        />
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={<BookOpen className="w-6 h-6 text-purple-600" />}
                title="Total Items"
                value={stats.totalItems}
                subtitle="All content"
              />
              <StatCard
                icon={<Quote className="w-6 h-6 text-blue-600" />}
                title="Quotes"
                value={stats.byType.quotes}
                onClick={() => setViewMode('quotes')}
              />
              <StatCard
                icon={<BookOpen className="w-6 h-6 text-green-600" />}
                title="Understanding"
                value={stats.byType.understanding}
                onClick={() => setViewMode('understanding')}
              />
              <StatCard
                icon={<Languages className="w-6 h-6 text-orange-600" />}
                title="Languages"
                value={Object.keys(stats.byLanguage).length}
              />
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              {/* Search, Language, and Sort Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base font-medium"
                  />
                </div>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium text-slate-900"
                >
                  <option value="">All Languages</option>
                  {Object.keys(stats.byLanguage).map(lang => (
                    <option key={lang} value={lang}>
                      {lang === 'en' ? 'English' : 
                       lang === 'hi' ? 'हिन्दी (Hindi)' :
                       lang === 'gu' ? 'ગુજરાતી (Gujarati)' :
                       lang === 'sa' ? 'संस्कृत (Sanskrit)' :
                       lang === 'es' ? 'Español (Spanish)' :
                       lang === 'fr' ? 'Français (French)' :
                       lang === 'de' ? 'Deutsch (German)' :
                       lang === 'it' ? 'Italiano (Italian)' :
                       lang === 'pt' ? 'Português (Portuguese)' :
                       lang === 'ru' ? 'Русский (Russian)' :
                       lang === 'zh' ? '中文 (Chinese)' :
                       lang === 'ja' ? '日本語 (Japanese)' :
                       lang === 'ko' ? '한국어 (Korean)' :
                       lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'type')}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium text-slate-900"
                >
                  <option value="date">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                  <option value="type">Sort by Type</option>
                </select>
              </div>
              
              {/* Categories Row */}
              <CategoryRow
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                categories={stats.byCategory}
                colorScheme="purple"
              />
            </div>

            {/* Content List */}
            <div className="space-y-4">
              {filteredContent.map((item, index) => (
                <motion.div
                  key={`${item.type}-${item.id}`}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        item.type === 'quote' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {item.type === 'quote' ? (
                          <Quote className="w-6 h-6 text-blue-600" />
                        ) : (
                          <BookOpen className="w-6 h-6 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-2 text-lg">{item.title}</h3>
                        <div className="text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed font-medium">
                          <RichTextDisplay content={item.content.length > 150 
                            ? `${item.content.substring(0, 150)}...` 
                            : item.content} />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold">
                          {item.categories.map(category => (
                            <span key={category} className="bg-slate-100 px-3 py-1 rounded-full">
                              {category}
                            </span>
                          ))}
                          <span className="text-slate-400">•</span>
                          <span>{item.language === 'en' ? 'English' : item.language}</span>
                          <span className="text-slate-400">•</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          {item.word_count && (
                            <>
                              <span className="text-slate-400">•</span>
                              <span>{item.word_count} words</span>
                            </>
                          )}
                          {item.is_draft && (
                            <>
                              <span className="text-slate-400">•</span>
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                Draft
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors flex-shrink-0"
                      title="View details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredContent.length === 0 && (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">No content found</h3>
                <p className="text-slate-600 font-medium">
                  Try adjusting your search terms or filters
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Quotes View */}
        {viewMode === 'quotes' && (
          <motion.div
            key="quotes"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Quotes Collection</h2>
              <div className="text-sm text-slate-500">
                {content.filter(item => item.type === 'quote').length} quotes
              </div>
            </div>

            {/* Search and Filters for Quotes */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              {/* Search, Language, and Sort Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search quotes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base font-medium"
                  />
                </div>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium text-slate-900"
                >
                  <option value="">All Languages</option>
                  {Object.keys(stats.byLanguage).map(lang => (
                    <option key={lang} value={lang}>
                      {lang === 'en' ? 'English' : 
                       lang === 'hi' ? 'हिन्दी (Hindi)' :
                       lang === 'gu' ? 'ગુજરાતી (Gujarati)' :
                       lang === 'sa' ? 'संस्कृत (Sanskrit)' :
                       lang === 'es' ? 'Español (Spanish)' :
                       lang === 'fr' ? 'Français (French)' :
                       lang === 'de' ? 'Deutsch (German)' :
                       lang === 'it' ? 'Italiano (Italian)' :
                       lang === 'pt' ? 'Português (Portuguese)' :
                       lang === 'ru' ? 'Русский (Russian)' :
                       lang === 'zh' ? '中文 (Chinese)' :
                       lang === 'ja' ? '日本語 (Japanese)' :
                       lang === 'ko' ? '한국어 (Korean)' :
                       lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'type')}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium text-slate-900"
                >
                  <option value="date">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                </select>
              </div>
              
              {/* Categories Row */}
              <CategoryRow
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                categories={stats.byCategoryQuotes}
                colorScheme="blue"
              />
            </div>
            
            <div className="grid gap-4">
              {filteredContent.filter(item => item.type === 'quote').map((item) => (
                <motion.div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Quote className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-slate-700 italic mb-2">
                          <RichTextDisplay content={item.content} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {item.categories.map(category => (
                            <span key={category} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {category}
                            </span>
                          ))}
                          <span>{item.language === 'en' ? 'English' : item.language}</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Understanding View */}
        {viewMode === 'understanding' && (
          <motion.div
            key="understanding"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Understanding Entries</h2>
              <div className="text-sm text-slate-500">
                {content.filter(item => item.type === 'understanding').length} entries
              </div>
            </div>

            {/* Search and Filters for Understanding */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              {/* Search, Language, and Sort Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search understanding..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base font-medium"
                  />
                </div>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium text-slate-900"
                >
                  <option value="">All Languages</option>
                  {Object.keys(stats.byLanguage).map(lang => (
                    <option key={lang} value={lang}>
                      {lang === 'en' ? 'English' : 
                       lang === 'hi' ? 'हिन्दी (Hindi)' :
                       lang === 'gu' ? 'ગુજરાતી (Gujarati)' :
                       lang === 'sa' ? 'संस्कृत (Sanskrit)' :
                       lang === 'es' ? 'Español (Spanish)' :
                       lang === 'fr' ? 'Français (French)' :
                       lang === 'de' ? 'Deutsch (German)' :
                       lang === 'it' ? 'Italiano (Italian)' :
                       lang === 'pt' ? 'Português (Portuguese)' :
                       lang === 'ru' ? 'Русский (Russian)' :
                       lang === 'zh' ? '中文 (Chinese)' :
                       lang === 'ja' ? '日本語 (Japanese)' :
                       lang === 'ko' ? '한국어 (Korean)' :
                       lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'type')}
                  className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium text-slate-900"
                >
                  <option value="date">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                </select>
              </div>
              
              {/* Categories Row */}
              <CategoryRow
                selectedCategories={selectedCategories}
                onCategoriesChange={setSelectedCategories}
                categories={stats.byCategoryUnderstanding}
                colorScheme="purple"
              />
            </div>
            
            <div className="grid gap-4">
              {filteredContent.filter(item => item.type === 'understanding').map((item) => (
                <motion.div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                        <div className="text-sm text-slate-600 mb-2 line-clamp-2">
                          <RichTextDisplay content={item.content.length > 150 
                            ? `${item.content.substring(0, 150)}...` 
                            : item.content} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {item.categories.map(category => (
                            <span key={category} className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              {category}
                            </span>
                          ))}
                          <span>{item.language === 'en' ? 'English' : item.language}</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          {item.word_count && <span>{item.word_count} words</span>}
                          {item.is_draft && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="text-purple-600 hover:text-purple-700 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                      title="View details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Categories View */}
        {viewMode === 'categories' && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center">
                <Tag className="w-6 h-6 mr-2 text-green-600" />
                Categories ({Object.keys(stats.byCategory).length})
              </h2>
              <Link
                to="/categories"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Manage Categories →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <motion.div
                  key={category}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-3 flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedCategories([category]);
                        setViewMode('overview');
                      }}
                    >
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Tag className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{category}</h3>
                        <p className="text-sm text-slate-500">{count} items</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete the category "${category}"? This action cannot be undone.`)) {
                            deleteCategory(category);
                          }
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analytics View */}
        {viewMode === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-indigo-600" />
              Analytics & Insights
            </h2>
            
            {/* Content Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Content Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 flex items-center">
                      <Quote className="w-4 h-4 mr-2 text-blue-600" />
                      Quotes
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${stats.totalItems > 0 ? (stats.byType.quotes / stats.totalItems) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 w-8">{stats.byType.quotes}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2 text-purple-600" />
                      Understanding
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{
                            width: `${stats.totalItems > 0 ? (stats.byType.understanding / stats.totalItems) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 w-8">{stats.byType.understanding}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Language Distribution */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Language Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(stats.byLanguage).map(([language, count]) => (
                    <div key={language} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {language === 'en' ? 'English' : language}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{
                              width: `${(count / Math.max(...Object.values(stats.byLanguage))) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-slate-600 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Monthly Activity */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Activity</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(stats.byMonth).slice(-6).map(([month, count]) => (
                  <div key={month} className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{count}</div>
                    <div className="text-xs text-slate-500">{month}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 text-center">
                <div className="text-2xl font-bold text-green-600">{Object.keys(stats.byCategory).length}</div>
                <div className="text-sm text-slate-600">Categories</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.recentItems.length}</div>
                <div className="text-sm text-slate-600">Recent Items</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {content.filter(item => item.type === 'understanding' && item.is_draft).length}
                </div>
                <div className="text-sm text-slate-600">Drafts</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {content.reduce((sum, item) => sum + (item.word_count || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-slate-600">Total Words</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center">
                  {selectedItem.type === 'quote' ? (
                    <Quote className="w-6 h-6 mr-2 text-blue-600" />
                  ) : (
                    <BookOpen className="w-6 h-6 mr-2 text-purple-600" />
                  )}
                  {selectedItem.type === 'quote' ? 'Quote Details' : 'Understanding Details'}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedItem.content);
                      toast.success('Content copied to clipboard!');
                    }}
                    className="p-2 text-slate-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                    title="Copy content"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Categories and Language */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.categories.map(category => (
                      <div key={category} className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                        selectedItem.type === 'quote' ? 'bg-blue-50' : 'bg-purple-50'
                      }`}>
                        <Tag className={`w-4 h-4 ${
                          selectedItem.type === 'quote' ? 'text-blue-600' : 'text-purple-600'
                        }`} />
                        <span className={`text-sm font-medium ${
                          selectedItem.type === 'quote' ? 'text-blue-600' : 'text-purple-600'
                        }`}>
                          {category}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full">
                    <Languages className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-600">
                      {selectedItem.language === 'en' ? 'English' : selectedItem.language}
                    </span>
                  </div>
                  {selectedItem.is_draft && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Draft
                    </span>
                  )}
                </div>

                {/* Content */}
                <div>
                  {selectedItem.type === 'understanding' && (
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedItem.title}</h2>
                  )}
                  <div className="prose prose-slate max-w-none">
                    {selectedItem.type === 'quote' ? (
                      <blockquote className="text-lg text-slate-700 italic border-l-4 border-blue-500 pl-4 py-2">
                        <RichTextDisplay content={selectedItem.content} />
                      </blockquote>
                    ) : (
                      <RichTextDisplay 
                        content={selectedItem.content}
                        className="text-slate-700 leading-relaxed"
                      />
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t border-slate-200">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Created: {new Date(selectedItem.created_at).toLocaleDateString()}
                    </div>
                    {selectedItem.updated_at !== selectedItem.created_at && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Updated: {new Date(selectedItem.updated_at).toLocaleDateString()}
                      </div>
                    )}
                    {selectedItem.word_count && (
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {selectedItem.word_count} words
                      </div>
                    )}
                  </div>
                  
                  <Link
                    to={selectedItem.type === 'quote' ? '/quotes' : '/understanding'}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedItem.type === 'quote'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                    onClick={() => setSelectedItem(null)}
                  >
                    View in {selectedItem.type === 'quote' ? 'Quotes' : 'Understanding'} Section
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContentIndex;
