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
  Clock,
  Link as LinkIcon,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import toast from 'react-hot-toast';
import RichTextEditor from './RichTextEditor';
import RichTextDisplay from './RichTextDisplay';

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

  const copyToClipboard = async (text: string, type: string = 'content') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast.error('Failed to copy to clipboard');
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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Understanding</h1>
            <p className="text-slate-600">Capture and organize your insights and learnings</p>
          </div>
          <motion.button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 shadow-sm w-full sm:w-auto justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            <span>Add Entry</span>
          </motion.button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search understanding entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Category Filter with Checkboxes */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Filter by Categories
              </label>
              <div className="border border-slate-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-white">
                {categories.map(category => (
                  <label key={category.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleFilterCategoryToggle(category.id)}
                      className="text-purple-600 focus:ring-purple-500 rounded"
                    />
                    <span className="text-sm text-slate-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Languages</option>
              {uniqueLanguages.map(lang => (
                <option key={lang} value={lang}>
                  {lang === 'en' ? 'English' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>

            <label className="flex items-center space-x-2 px-4 py-3 bg-white border border-slate-300 rounded-lg sm:w-auto">
              <input
                type="checkbox"
                checked={showDraftsOnly}
                onChange={(e) => setShowDraftsOnly(e.target.checked)}
                className="text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-700">Drafts only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Understanding List */}
      <div className="space-y-4 sm:space-y-6">
        <AnimatePresence>
          {filteredEntries.map((entry) => (
            <motion.div
              key={entry.id}
              className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <div className="flex flex-wrap gap-1">
                        {entry.categories.map(category => (
                          <span key={category.id} className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                            {category.name}
                          </span>
                        ))}
                      </div>
                      <span className="text-slate-300">•</span>
                      <Languages className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">
                        {entry.language === 'en' ? 'English' : entry.language}
                      </span>
                      {entry.is_draft && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            Draft
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(entry.description, 'Understanding')}
                      className="p-2 text-slate-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                      title="Copy content"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedEntry(entry)}
                      className="p-2 text-slate-400 hover:text-purple-600 transition-colors rounded-lg hover:bg-purple-50"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingEntry(entry)}
                      className="p-2 text-slate-400 hover:text-purple-600 transition-colors rounded-lg hover:bg-purple-50"
                      title="Edit entry"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3">
                    {entry.title}
                  </h3>
                  
                  <div className="mb-4">
                    {expandedCards.has(entry.id) ? (
                      <RichTextDisplay 
                        content={entry.description} 
                        className="text-slate-700 leading-relaxed"
                      />
                    ) : (
                      <RichTextDisplay 
                        content={truncateText(entry.description)} 
                        className="text-slate-700 leading-relaxed"
                      />
                    )}
                  </div>

                  {entry.description.length > 200 && (
                    <button
                      onClick={() => toggleCardExpansion(entry.id)}
                      className="mb-4 text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center space-x-1"
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
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Real-life Connection
                      </h4>
                      <div className="text-blue-800 text-sm">
                        {expandedCards.has(entry.id) ? (
                          <RichTextDisplay 
                            content={entry.real_life_connection} 
                            className="text-blue-800 text-sm"
                          />
                        ) : (
                          <RichTextDisplay 
                            content={truncateText(entry.real_life_connection, 100)} 
                            className="text-blue-800 text-sm"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-slate-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {entry.word_count} words
                    </div>
                    {entry.reference && (
                      <div className="flex items-center">
                        <span>Reference: {entry.reference}</span>
                        {entry.page_slok_number && (
                          <span className="ml-1">({entry.page_slok_number})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No understanding entries found</h3>
            <p className="text-slate-600">
              {searchTerm || selectedCategories.length > 0 || selectedLanguage || showDraftsOnly
                ? 'Try adjusting your filters'
                : 'Start by adding your first understanding entry'
              }
            </p>
          </div>
        )}
      </div>

      {/* Understanding Detail Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Understanding Details</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(selectedEntry.description, 'Understanding')}
                    className="p-2 text-slate-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                    title="Copy content"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg"
                  >
                    <X className="w-4 h-4" />
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
                      {selectedEntry.language === 'en' ? 'English' : selectedEntry.language}
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
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
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
                  <div className="border border-slate-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-white">
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center space-x-2 py-2">
                        <input
                          type="checkbox"
                          checked={newEntry.category_ids.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id, true)}
                          className="text-purple-600 focus:ring-purple-500 rounded"
                        />
                        <span className="text-sm text-slate-700">{category.name}</span>
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
                    <option value="hi">Hindi</option>
                    <option value="sa">Sanskrit</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ru">Russian</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
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
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
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
                  <div className="border border-slate-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-white">
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center space-x-2 py-2">
                        <input
                          type="checkbox"
                          checked={editingEntry.category_ids.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id, false)}
                          className="text-purple-600 focus:ring-purple-500 rounded"
                        />
                        <span className="text-sm text-slate-700">{category.name}</span>
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
                    <option value="hi">Hindi</option>
                    <option value="sa">Sanskrit</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ru">Russian</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
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

