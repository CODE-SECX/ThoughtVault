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

type UnderstandingWithCategory = Database['public']['Tables']['understanding']['Row'] & {
  categories: Database['public']['Tables']['categories']['Row'];
};

const UnderstandingList: React.FC = () => {
  const [understanding, setUnderstanding] = useState<UnderstandingWithCategory[]>([]);
  const [categories, setCategories] = useState<Database['public']['Tables']['categories']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<UnderstandingWithCategory | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<UnderstandingWithCategory | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const [newEntry, setNewEntry] = useState({
    title: '',
    description: '',
    category_id: '',
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
        .select(`
          *,
          categories (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUnderstanding(data || []);
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
    if (!newEntry.title.trim() || !newEntry.description.trim() || !newEntry.category_id) {
      toast.error('Please fill in all required fields');
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
        category_id: '',
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
          category_id: editingEntry.category_id,
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

  const filteredEntries = understanding.filter(entry => {
    const matchesSearch = 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || entry.category_id === selectedCategory;
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
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

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
                    <span className="text-sm font-medium text-purple-600">
                      {entry.categories?.name}
                    </span>
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
                  
                  <div className="prose prose-slate max-w-none mb-4">
                    <p className="text-slate-700 leading-relaxed">
                    {expandedCards.has(entry.id) ? entry.description : truncateText(entry.description)}
                    </p>
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
                    <p className="text-blue-800 text-sm">
                      {expandedCards.has(entry.id) 
                        ? entry.real_life_connection 
                        : truncateText(entry.real_life_connection, 100)
                      }
                    </p>
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
              {searchTerm || selectedCategory || selectedLanguage || showDraftsOnly
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
          >
            <motion.div
              className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Understanding Details</h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded-full">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">
                      {selectedEntry.categories?.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full">
                    <Languages className="w-4 h-4 text-slate-600" />
                    <span className="text-sm text-slate-600">
                      {selectedEntry.language === 'en' ? 'English' : selectedEntry.language}
                    </span>
                  </div>
                  {selectedEntry.is_draft && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                      Draft
                    </span>
                  )}
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-4">
                    <button
                      onClick={() => copyToClipboard(selectedEntry.title, 'Title')}
                      className="inline-flex items-center hover:text-purple-600 transition-colors group"
                      title="Copy title"
                    >
                      <Copy className="w-5 h-5 ml-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </h1>
                  
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedEntry.description}
                    </p>
                  </div>
                </div>

                {selectedEntry.real_life_connection && (
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <LinkIcon className="w-5 h-5 mr-2" />
                      Real-life Connection
                    </h4>
                    <p className="text-blue-800 leading-relaxed whitespace-pre-wrap">
                      {selectedEntry.real_life_connection}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                  <div className="text-sm">
                    <span className="text-slate-500">Created:</span>
                    <p className="font-medium text-slate-900">
                      {new Date(selectedEntry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">Word Count:</span>
                    <p className="font-medium text-slate-900">{selectedEntry.word_count}</p>
                  </div>
                  {selectedEntry.reference && (
                    <div className="text-sm">
                      <span className="text-slate-500">Reference:</span>
                      <p className="font-medium text-slate-900">{selectedEntry.reference}</p>
                    </div>
                  )}
                  {selectedEntry.page_slok_number && (
                    <div className="text-sm">
                      <span className="text-slate-500">Page/Slok:</span>
                      <p className="font-medium text-slate-900">{selectedEntry.page_slok_number}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Entry Modal */}
      <AnimatePresence>
        {(showAddForm || editingEntry) && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                {editingEntry ? 'Edit Understanding Entry' : 'Add New Understanding Entry'}
              </h3>
              
              <form onSubmit={editingEntry ? handleUpdateEntry : handleAddEntry} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={editingEntry ? editingEntry.title : newEntry.title}
                    onChange={(e) => {
                      if (editingEntry) {
                        setEditingEntry({ ...editingEntry, title: e.target.value });
                      } else {
                        setNewEntry({ ...newEntry, title: e.target.value });
                      }
                    }}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter the title..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={editingEntry ? editingEntry.description : newEntry.description}
                    onChange={(e) => {
                      if (editingEntry) {
                        setEditingEntry({ ...editingEntry, description: e.target.value });
                      } else {
                        setNewEntry({ ...newEntry, description: e.target.value });
                      }
                    }}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={8}
                    placeholder="Write your understanding here..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={editingEntry ? editingEntry.category_id : newEntry.category_id}
                      onChange={(e) => {
                        if (editingEntry) {
                          setEditingEntry({ ...editingEntry, category_id: e.target.value });
                        } else {
                          setNewEntry({ ...newEntry, category_id: e.target.value });
                        }
                      }}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Language
                    </label>
                    <select
                      value={editingEntry ? editingEntry.language : newEntry.language}
                      onChange={(e) => {
                        if (editingEntry) {
                          setEditingEntry({ ...editingEntry, language: e.target.value });
                        } else {
                          setNewEntry({ ...newEntry, language: e.target.value });
                        }
                      }}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Real-life Connection
                  </label>
                  <textarea
                    value={editingEntry ? editingEntry.real_life_connection || '' : newEntry.real_life_connection}
                    onChange={(e) => {
                      if (editingEntry) {
                        setEditingEntry({ ...editingEntry, real_life_connection: e.target.value });
                      } else {
                        setNewEntry({ ...newEntry, real_life_connection: e.target.value });
                      }
                    }}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="How does this apply to your life?"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Reference
                    </label>
                    <input
                      type="text"
                      value={editingEntry ? editingEntry.reference || '' : newEntry.reference}
                      onChange={(e) => {
                        if (editingEntry) {
                          setEditingEntry({ ...editingEntry, reference: e.target.value });
                        } else {
                          setNewEntry({ ...newEntry, reference: e.target.value });
                        }
                      }}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Book, article, source..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Page/Slok Number
                    </label>
                    <input
                      type="text"
                      value={editingEntry ? editingEntry.page_slok_number || '' : newEntry.page_slok_number}
                      onChange={(e) => {
                        if (editingEntry) {
                          setEditingEntry({ ...editingEntry, page_slok_number: e.target.value });
                        } else {
                          setNewEntry({ ...newEntry, page_slok_number: e.target.value });
                        }
                      }}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Page number, verse, etc."
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_draft"
                    checked={editingEntry ? editingEntry.is_draft : newEntry.is_draft}
                    onChange={(e) => {
                      if (editingEntry) {
                        setEditingEntry({ ...editingEntry, is_draft: e.target.checked });
                      } else {
                        setNewEntry({ ...newEntry, is_draft: e.target.checked });
                      }
                    }}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="is_draft" className="text-sm text-slate-700">
                    Save as draft
                  </label>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingEntry(null);
                    }}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editingEntry ? 'Update Entry' : 'Add Entry'}
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