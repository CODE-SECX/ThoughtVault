-- Migration to update quotes and understanding tables to support multiple categories

-- First, add new columns for category arrays
ALTER TABLE quotes ADD COLUMN category_ids text[] DEFAULT '{}';
ALTER TABLE understanding ADD COLUMN category_ids text[] DEFAULT '{}';

-- Migrate existing data from single category_id to category_ids array
UPDATE quotes SET category_ids = ARRAY[category_id] WHERE category_id IS NOT NULL;
UPDATE understanding SET category_ids = ARRAY[category_id] WHERE category_id IS NOT NULL;

-- Drop the old single category columns
ALTER TABLE quotes DROP COLUMN category_id;
ALTER TABLE understanding DROP COLUMN category_id;

-- Add constraints to ensure at least one category is selected
ALTER TABLE quotes ADD CONSTRAINT quotes_category_ids_not_empty CHECK (array_length(category_ids, 1) > 0);
ALTER TABLE understanding ADD CONSTRAINT understanding_category_ids_not_empty CHECK (array_length(category_ids, 1) > 0);

-- Create indexes for better performance when filtering by categories
CREATE INDEX idx_quotes_category_ids ON quotes USING GIN (category_ids);
CREATE INDEX idx_understanding_category_ids ON understanding USING GIN (category_ids);

