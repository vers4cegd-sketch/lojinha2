/*
  # Add order_index column to products table

  1. Changes
    - Add `order_index` column to `products` table
    - Set default value to 0
    - Update existing products with sequential order_index values

  2. Security
    - No changes to RLS policies needed
*/

-- Add order_index column to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE products ADD COLUMN order_index integer DEFAULT 0;
  END IF;
END $$;

-- Update existing products with sequential order_index values
UPDATE products 
SET order_index = subquery.row_number - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
  FROM products
) AS subquery
WHERE products.id = subquery.id;