import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import QuotesList from './components/QuotesList';
import UnderstandingList from './components/UnderstandingList';
import Categories from './components/Categories';
import Search from './components/Search';
import ContentIndex from './components/ContentIndex';
import PublicQuote from './components/PublicQuote';
import PublicUnderstanding from './components/PublicUnderstanding';

const LayoutRoute: React.FC = () => (
  <Layout>
    <Outlet />
  </Layout>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Routes>
          <Route element={<LayoutRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quotes" element={<QuotesList />} />
            <Route path="/understanding" element={<UnderstandingList />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/search" element={<Search />} />
            <Route path="/index" element={<ContentIndex />} />
          </Route>
          {/* Public shareable routes (no Layout wrapper) */}
          <Route path="/p/quote/:id" element={<PublicQuote />} />
          <Route path="/p/understanding/:id" element={<PublicUnderstanding />} />
        </Routes>
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1f2937',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e5e7eb',
            },
            success: {
              iconTheme: {
                primary: '#059669',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#dc2626',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;