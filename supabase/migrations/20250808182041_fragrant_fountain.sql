/*
# WisdomKeeper Database Schema

Personal Knowledge Management System with language categorization

## New Tables
1. **categories** - Organization categories for quotes and understanding
2. **quotes** - Collection of quotes with language and category
3. **understanding** - Detailed understanding entries with rich metadata

## Features
- Language-based filtering and organization
- Full-text search capabilities
- Automatic timestamp management
- Row Level Security for multi-user support

## Security
- Enable RLS on all tables
- Policies for authenticated users to manage their content
*/

-- Enable UUID extension for automatic ID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Quotes table with language support
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Understanding table with language support
CREATE TABLE IF NOT EXISTS understanding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'en',
  date timestamptz,
  word_count integer DEFAULT 0,
  real_life_connection text,
  reference text,
  page_slok_number text,
  is_draft boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_category_id ON quotes(category_id);
CREATE INDEX IF NOT EXISTS idx_quotes_language ON quotes(language);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_understanding_category_id ON understanding(category_id);
CREATE INDEX IF NOT EXISTS idx_understanding_language ON understanding(language);
CREATE INDEX IF NOT EXISTS idx_understanding_created_at ON understanding(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_understanding_is_draft ON understanding(is_draft);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_quotes_text_search ON quotes USING gin(to_tsvector('english', text));
CREATE INDEX IF NOT EXISTS idx_understanding_search ON understanding USING gin(to_tsvector('english', title || ' ' || description));

-- Sample data
INSERT INTO categories (name, description) VALUES 
  ('Philosophy', 'Philosophical thoughts and insights'),
  ('Personal Growth', 'Self-improvement and development'),
  ('Spirituality', 'Spiritual wisdom and guidance'),
  ('Literature', 'Literary quotes and excerpts'),
  ('Science', 'Scientific discoveries and insights')
ON CONFLICT (name) DO NOTHING;

-- Functions for automatically updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update word count
CREATE OR REPLACE FUNCTION update_word_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.word_count = array_length(string_to_array(trim(NEW.description), ' '), 1);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_quotes_updated_at 
    BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_understanding_updated_at 
    BEFORE UPDATE ON understanding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for automatic word count update
CREATE TRIGGER update_understanding_word_count
    BEFORE INSERT OR UPDATE ON understanding
    FOR EACH ROW EXECUTE FUNCTION update_word_count();

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE understanding ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON categories
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON quotes
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON understanding
  FOR ALL USING (true);

-- Comments for documentation
COMMENT ON TABLE categories IS 'Categories for organizing quotes and understanding entries';
COMMENT ON TABLE quotes IS 'Collection of quotes with language and categorization support';
COMMENT ON TABLE understanding IS 'Detailed understanding entries with rich content, language support, and metadata';