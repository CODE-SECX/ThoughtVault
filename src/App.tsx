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
import UnderstandingDetail from './components/UnderstandingDetail';

const LayoutRoute: React.FC = () => (
  <Layout>
    <Outlet />
  </Layout>
);

function App() {
  return (
    <Router>
      {/* Background uses design token, not hardcoded gradient */}
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Routes>
          <Route element={<LayoutRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quotes" element={<QuotesList />} />
            <Route path="/understanding" element={<UnderstandingList />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/search" element={<Search />} />
            <Route path="/index" element={<ContentIndex />} />
          </Route>
          <Route path="/understanding/:id" element={<UnderstandingDetail />} />
          {/* Public shareable routes */}
          <Route path="/p/quote/:id" element={<PublicQuote />} />
          <Route path="/p/understanding/:id" element={<PublicUnderstanding />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)',
              fontFamily: 'var(--font-ui)',
              fontSize: '14px',
              borderRadius: '10px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: 'var(--color-accent)', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: 'var(--color-error)', secondary: '#fff' },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
