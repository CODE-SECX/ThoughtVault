import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Quote, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  Languages,
  Target,
  Award,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalQuotes: number;
  totalUnderstanding: number;
  draftCount: number;
  totalWordCount: number;
  languageStats: { [key: string]: number };
  recentActivity: Array<{
    id: string;
    type: 'quote' | 'understanding';
    title: string;
    created_at: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalQuotes: 0,
    totalUnderstanding: 0,
    draftCount: 0,
    totalWordCount: 0,
    languageStats: {},
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Get quotes count and language stats
      const { data: quotesData } = await supabase
        .from('quotes')
        .select('language');

      // Get understanding stats
      const { data: understandingData } = await supabase
        .from('understanding')
        .select('word_count, is_draft, language, title, created_at');

      // Get recent activity
      const { data: recentQuotes } = await supabase
        .from('quotes')
        .select('id, text, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: recentUnderstanding } = await supabase
        .from('understanding')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      // Process language statistics
      const languageStats: { [key: string]: number } = {};
      
      quotesData?.forEach(quote => {
        languageStats[quote.language] = (languageStats[quote.language] || 0) + 1;
      });

      understandingData?.forEach(entry => {
        languageStats[entry.language] = (languageStats[entry.language] || 0) + 1;
      });

      // Combine recent activity
      const recentActivity = [
        ...(recentQuotes?.map(q => ({
          id: q.id,
          type: 'quote' as const,
          title: q.text.substring(0, 50) + '...',
          created_at: q.created_at
        })) || []),
        ...(recentUnderstanding?.map(u => ({
          id: u.id,
          type: 'understanding' as const,
          title: u.title,
          created_at: u.created_at
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setStats({
        totalQuotes: quotesData?.length || 0,
        totalUnderstanding: understandingData?.length || 0,
        draftCount: understandingData?.filter(u => u.is_draft).length || 0,
        totalWordCount: understandingData?.reduce((sum, u) => sum + (u.word_count || 0), 0) || 0,
        languageStats,
        recentActivity: recentActivity.slice(0, 5)
      });

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
  }> = ({ icon, title, value, subtitle, color }) => (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all p-6"
      whileHover={{ y: -4 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
          )}
        </div>
        <div className={`${color} rounded-xl p-3 shadow-lg`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Dashboard</h1>
        <p className="text-lg text-slate-600 font-medium">Your personal knowledge management overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Quote className="w-8 h-8 text-white" />}
          title="Total Quotes"
          value={stats.totalQuotes}
          color="bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"
        />
        <StatCard
          icon={<BookOpen className="w-8 h-8 text-white" />}
          title="Understanding Entries"
          value={stats.totalUnderstanding}
          subtitle={`${stats.draftCount} drafts`}
          color="bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg"
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8 text-white" />}
          title="Total Words"
          value={stats.totalWordCount.toLocaleString()}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg"
        />
        <StatCard
          icon={<Languages className="w-8 h-8 text-white" />}
          title="Languages"
          value={Object.keys(stats.languageStats).length}
          color="bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Language Distribution */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Languages className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Language Distribution</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(stats.languageStats).map(([language, count]) => (
              <div key={language} className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700 capitalize w-24">
                  {language === 'en' ? 'English' : language}
                </span>
                <div className="flex items-center space-x-3 flex-1">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex-1">
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(count / Math.max(...Object.values(stats.languageStats))) * 100}%`
                      }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                className="group flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  activity.type === 'quote' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {activity.type === 'quote' ? (
                    <Quote className="w-5 h-5 text-blue-600" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {new Date(activity.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
            {stats.recentActivity.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8 font-medium">
                No recent activity. Start adding quotes or understanding entries!
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;