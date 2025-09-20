/*
  # Add show_skins_preview column to products table

  1. Changes
    - Add `show_skins_preview` column to `products` table
    - Set default value to `true` for existing products
    - Allow NULL values initially, then set default for new records

  2. Notes
    - This column controls whether skins preview is shown in product cards
    - Default value is `true` to maintain current behavior
    - Existing products will have skins preview enabled by default
*/

-- Add the show_skins_preview column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS show_skins_preview boolean DEFAULT true;

-- Update existing products to have skins preview enabled by default
UPDATE products 
SET show_skins_preview = true 
WHERE show_skins_preview IS NULL;