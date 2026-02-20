import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  BookOpen,
  Calendar,
  Languages,
  FileText,
  Edit3,
  Trash2,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  X,
  Share2,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import toast from 'react-hot-toast';
import SmartCopyButton from './SmartCopyButton';
import RichTextEditor from './RichTextEditor';
import RichTextDisplay from './RichTextDisplay';

const languageNames = {
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

type UnderstandingWithCategories = Database['public']['Tables']['understanding']['Row'] & {
  categories: Database['public']['Tables']['categories']['Row'][];
};

const UnderstandingList: React.FC = () => {
  const [understanding, setUnderstanding] = useState<UnderstandingWithCategories[]>([]);
  const [categories, setCategories] = useState<Database['public']['Tables']['categories']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<UnderstandingWithCategories | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<UnderstandingWithCategories | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const [newEntry, setNewEntry] = useState({
    title: '',
    description: '',
    category_ids: [] as string[],
    language: 'en',
    real_life_connection: '',
    reference: '',
    page_slok_number: '',
    is_draft: false
  });

  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  useEffect(() => {
    loadUnderstanding();
    loadCategories();
  }, []);

  const loadUnderstanding = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('understanding')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load categories for each understanding entry
      const understandingWithCategories = await Promise.all(
        (data || []).map(async (entry) => {
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('*')
            .in('id', entry.category_ids);

          if (categoryError) {
            console.error('Error loading categories for understanding:', categoryError);
            return { ...entry, categories: [] };
          }

          return { ...entry, categories: categoryData || [] };
        })
      );

      setUnderstanding(understandingWithCategories);
    } catch (error) {
      console.error('Error loading understanding:', error);
      toast.error('Failed to load understanding entries');
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

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.title.trim() || !newEntry.description.trim() || newEntry.category_ids.length === 0) {
      toast.error('Please fill in all required fields and select at least one category');
      return;
    }

    try {
      const { error } = await supabase
        .from('understanding')
        .insert([newEntry]);

      if (error) throw error;

      toast.success('Understanding entry added successfully');
      setNewEntry({
        title: '',
        description: '',
        category_ids: [],
        language: 'en',
        real_life_connection: '',
        reference: '',
        page_slok_number: '',
        is_draft: false
      });
      setShowAddForm(false);
      loadUnderstanding();
    } catch (error) {
      console.error('Error adding understanding:', error);
      toast.error('Failed to add understanding entry');
    }
  };

  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    try {
      const { error } = await supabase
        .from('understanding')
        .update({
          title: editingEntry.title,
          description: editingEntry.description,
          category_ids: editingEntry.category_ids,
          language: editingEntry.language,
          real_life_connection: editingEntry.real_life_connection,
          reference: editingEntry.reference,
          page_slok_number: editingEntry.page_slok_number,
          is_draft: editingEntry.is_draft
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      toast.success('Understanding entry updated successfully');
      setEditingEntry(null);
      loadUnderstanding();
    } catch (error) {
      console.error('Error updating understanding:', error);
      toast.error('Failed to update understanding entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this understanding entry?')) return;

    try {
      const { error } = await supabase
        .from('understanding')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Understanding entry deleted successfully');
      loadUnderstanding();
    } catch (error) {
      console.error('Error deleting understanding:', error);
      toast.error('Failed to delete understanding entry');
    }
  };

  const handleCategoryToggle = (categoryId: string, isNewEntry: boolean = true) => {
    if (isNewEntry) {
      setNewEntry(prev => ({
        ...prev,
        category_ids: prev.category_ids.includes(categoryId)
          ? prev.category_ids.filter(id => id !== categoryId)
          : [...prev.category_ids, categoryId]
      }));
    } else if (editingEntry) {
      setEditingEntry(prev => prev ? {
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

  const filteredEntries = understanding.filter(entry => {
    const matchesSearch = 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.some(catId => entry.category_ids.includes(catId));
    const matchesLanguage = selectedLanguage === '' || entry.language === selectedLanguage;
    const matchesDraft = showDraftsOnly ? entry.is_draft : true;
    
    return matchesSearch && matchesCategory && matchesLanguage && matchesDraft;
  });

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const toggleCardExpansion = (entryId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedCards(newExpanded);
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const uniqueLanguages = [...new Set(understanding.map(e => e.language))];



  const copyShareLink = async (id: string) => {
    try {
      const url = `${window.location.origin}/p/understanding/${id}`;
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
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-200 rounded-lg"></div>
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
              Understanding
            </h1>
            <p className="text-lg text-slate-600 font-medium">Capture and organize your insights and learnings</p>
          </div>
          <motion.button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-purple-600 via-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all flex items-center space-x-2 shadow-lg w-full sm:w-auto justify-center font-semibold hover:scale-105 active:scale-95"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            <span>Add Entry</span>
          </motion.button>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-6 shadow-sm space-y-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search understanding entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-slate-300/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base font-medium transition-all"
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
                        className="w-full pl-10 pr-4 py-2 border border-slate-300/50 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-4 space-y-2">
                      {filteredCategories.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No categories found</p>
                      ) : (
                        filteredCategories.map(category => (
                          <label key={category.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category.id)}
                              onChange={() => handleFilterCategoryToggle(category.id)}
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded cursor-pointer"
                            />
                            <span className="text-sm font-medium text-slate-700">{category.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                    {selectedCategories.length > 0 && (
                      <div className="border-t border-slate-200 p-4">
                        <button
                          onClick={() => setSelectedCategories([])}
                          className="w-full text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
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
              className="flex-1 px-4 py-3.5 border border-slate-300/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
            >
              
              <option value="">All Languages</option>
              {uniqueLanguages.map(lang => (
                <option key={lang} value={lang}>
                  {languageNames[lang] || lang}
                </option>
              ))}
            </select>

            <label className="flex items-center space-x-3 px-4 py-3.5 bg-slate-50 border border-slate-300/50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={showDraftsOnly}
                onChange={(e) => setShowDraftsOnly(e.target.checked)}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700">Drafts only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Understanding List */}
      <div className="space-y-6">
        <AnimatePresence>
          {filteredEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              className="group bg-white rounded-2xl shadow-sm hover:shadow-lg hover:shadow-purple-200/50 border border-slate-200/50 hover:border-purple-200 transition-all p-6 sm:p-7 cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.03 }}
              layout
              onClick={() => setSelectedEntry(entry)}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {entry.categories.map(category => (
                        <span key={category.id} className="text-xs font-bold bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 px-3 py-1.5 rounded-full border border-purple-200/50">
                          {category.name}
                        </span>
                      ))}
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium ml-auto sm:ml-0 bg-slate-50 px-3 py-1.5 rounded-full">
                        <Languages className="w-3.5 h-3.5" />
                        <span>{languageNames[entry.language] || entry.language}</span>
                      </div>
                      {entry.is_draft && (
                        <span className="text-xs font-bold bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 px-3 py-1.5 rounded-full border border-yellow-200/50">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyShareLink(entry.id);
                      }}
                      className="p-2.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all rounded-lg"
                      title="Copy share link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <div onClick={(e) => e.stopPropagation()}>
                      <SmartCopyButton
                        content={entry.description}
                        type="Understanding"
                        className="text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all rounded-lg p-2.5"
                      />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEntry(entry);
                      }}
                      className="p-2.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all rounded-lg"
                      title="Edit entry"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEntry(entry.id);
                      }}
                      className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-lg"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-slate-900 leading-snug group-hover:text-purple-700 transition-colors">
                  {entry.title}
                </h3>
                
                {/* Content */}
                <div className="prose-sm prose prose-slate max-w-none">
                  {expandedCards.has(entry.id) ? (
                    <RichTextDisplay 
                      content={entry.description} 
                      className="text-slate-700"
                    />
                  ) : (
                    <RichTextDisplay 
                      content={truncateText(entry.description, 220)} 
                      className="text-slate-700"
                    />
                  )}
                </div>

                {entry.description.length > 220 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCardExpansion(entry.id);
                    }}
                    className="text-purple-600 hover:text-purple-700 text-sm font-bold flex items-center space-x-1.5 transition-colors"
                  >
                    <span>{expandedCards.has(entry.id) ? 'Show less' : 'Show more'}</span>
                    {expandedCards.has(entry.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}

                {entry.real_life_connection && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 p-4 rounded-xl border border-blue-200/50 mt-4">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center text-sm">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Real-life Connection
                    </h4>
                    <div className="text-blue-800 text-sm leading-relaxed">
                      {expandedCards.has(entry.id) ? (
                        <RichTextDisplay 
                          content={entry.real_life_connection} 
                          className="text-blue-800"
                        />
                      ) : (
                        <RichTextDisplay 
                          content={truncateText(entry.real_life_connection, 120)} 
                          className="text-blue-800"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(entry.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{entry.word_count} words</span>
                  </div>
                  {entry.reference && (
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold">Ref:</span>
                      <span>{entry.reference}</span>
                      {entry.page_slok_number && <span className="ml-0.5">({entry.page_slok_number})</span>}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEntries.length === 0 && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No entries found</h3>
            <p className="text-slate-600 font-medium mb-6">
              {searchTerm || selectedCategories.length > 0 || selectedLanguage || showDraftsOnly
                ? 'Try adjusting your filters or search terms'
                : 'Start by adding your first understanding entry'
              }
            </p>
            {!(searchTerm || selectedCategories.length > 0 || selectedLanguage || showDraftsOnly) && (
              <motion.button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                whileHover={{ scale: 1.05 }}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create First Entry
              </motion.button>
            )}
          </motion.div>
        )}
      </div>

      {/* Understanding Detail Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-slate-900">Understanding Details</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyShareLink(selectedEntry.id)}
                    className="p-2.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all rounded-lg"
                    title="Copy share link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <SmartCopyButton
                    content={selectedEntry.description}
                    type="Understanding"
                    className="text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all rounded-lg p-2.5"
                  />
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.categories.map(category => (
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
                      {languageNames[selectedEntry.language] || selectedEntry.language}
                    </span>
                  </div>
                  {selectedEntry.is_draft && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Draft
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">{selectedEntry.title}</h2>
                  <div className="prose prose-slate max-w-none">
                    <RichTextDisplay 
                      content={selectedEntry.description}
                      className="text-slate-700 leading-relaxed"
                    />
                  </div>
                </div>

                {selectedEntry.real_life_connection && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Real-life Connection
                    </h4>
                    <div className="text-blue-800 leading-relaxed">
                      <RichTextDisplay 
                        content={selectedEntry.real_life_connection}
                        className="text-blue-800"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t border-slate-200">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Created: {new Date(selectedEntry.created_at).toLocaleDateString()}
                    </div>
                    {selectedEntry.updated_at !== selectedEntry.created_at && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Updated: {new Date(selectedEntry.updated_at).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {selectedEntry.word_count} words
                    </div>
                    {selectedEntry.reference && (
                      <div className="flex items-center">
                        <span>Reference: {selectedEntry.reference}</span>
                        {selectedEntry.page_slok_number && (
                          <span className="ml-1">({selectedEntry.page_slok_number})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Understanding Modal */}
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
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Add New Understanding Entry</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleAddEntry} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <RichTextEditor
                    value={newEntry.description}
                    onChange={(value) => setNewEntry({ ...newEntry, description: value })}
                    placeholder="Enter your understanding..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Categories * (Select at least one)
                  </label>
                  <div className="border border-slate-300 rounded-lg p-4 max-h-48 overflow-y-auto bg-slate-50">
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center space-x-2 py-2 cursor-pointer hover:bg-white px-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={newEntry.category_ids.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id, true)}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded cursor-pointer"
                        />
                        <span className="text-sm font-medium text-slate-700">{category.name}</span>
                      </label>
                    ))}
                  </div>
                  {newEntry.category_ids.length === 0 && (
                    <p className="text-red-500 text-sm mt-1">Please select at least one category</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Real-life Connection
                  </label>
                  <RichTextEditor
                    value={newEntry.real_life_connection}
                    onChange={(value) => setNewEntry({ ...newEntry, real_life_connection: value })}
                    placeholder="How does this relate to real life?"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Reference
                    </label>
                    <input
                      type="text"
                      value={newEntry.reference}
                      onChange={(e) => setNewEntry({ ...newEntry, reference: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Book, article, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Page/Slok Number
                    </label>
                    <input
                      type="text"
                      value={newEntry.page_slok_number}
                      onChange={(e) => setNewEntry({ ...newEntry, page_slok_number: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Page or verse number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Language
                  </label>
                  <select
                    value={newEntry.language}
                    onChange={(e) => setNewEntry({ ...newEntry, language: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_draft"
                    checked={newEntry.is_draft}
                    onChange={(e) => setNewEntry({ ...newEntry, is_draft: e.target.checked })}
                    className="text-purple-600 focus:ring-purple-500 rounded"
                  />
                  <label htmlFor="is_draft" className="text-sm text-slate-700">
                    Save as draft
                  </label>
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
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Understanding Modal */}
      <AnimatePresence>
        {editingEntry && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingEntry(null)}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Edit Understanding Entry</h3>
                <button
                  onClick={() => setEditingEntry(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateEntry} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={editingEntry.title}
                    onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <RichTextEditor
                    value={editingEntry.description}
                    onChange={(value) => setEditingEntry({ ...editingEntry, description: value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Categories * (Select at least one)
                  </label>
                  <div className="border border-slate-300 rounded-lg p-4 max-h-48 overflow-y-auto bg-slate-50">
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center space-x-2 py-2 cursor-pointer hover:bg-white px-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={editingEntry.category_ids.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id, false)}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded cursor-pointer"
                        />
                        <span className="text-sm font-medium text-slate-700">{category.name}</span>
                      </label>
                    ))}
                  </div>
                  {editingEntry.category_ids.length === 0 && (
                    <p className="text-red-500 text-sm mt-1">Please select at least one category</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Real-life Connection
                  </label>
                  <RichTextEditor
                    value={editingEntry.real_life_connection || ''}
                    onChange={(value) => setEditingEntry({ ...editingEntry, real_life_connection: value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Reference
                    </label>
                    <input
                      type="text"
                      value={editingEntry.reference || ''}
                      onChange={(e) => setEditingEntry({ ...editingEntry, reference: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Page/Slok Number
                    </label>
                    <input
                      type="text"
                      value={editingEntry.page_slok_number || ''}
                      onChange={(e) => setEditingEntry({ ...editingEntry, page_slok_number: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Language
                  </label>
                  <select
                    value={editingEntry.language}
                    onChange={(e) => setEditingEntry({ ...editingEntry, language: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit_is_draft"
                    checked={editingEntry.is_draft}
                    onChange={(e) => setEditingEntry({ ...editingEntry, is_draft: e.target.checked })}
                    className="text-purple-600 focus:ring-purple-500 rounded"
                  />
                  <label htmlFor="edit_is_draft" className="text-sm text-slate-700">
                    Save as draft
                  </label>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Update Entry
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

export default UnderstandingList;
