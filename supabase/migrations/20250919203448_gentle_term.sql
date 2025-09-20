/*
  # Add order_index column to categories table

  1. Changes
    - Add `order_index` column to `categories` table
    - Set default value as 0
    - Update existing categories with sequential order_index values
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add order_index column to categories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE categories ADD COLUMN order_index integer DEFAULT 0;
  END IF;
END $$;

-- Update existing categories with sequential order_index values
UPDATE categories 
SET order_index = subquery.row_number - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
  FROM categories
) AS subquery
WHERE categories.id = subquery.id;