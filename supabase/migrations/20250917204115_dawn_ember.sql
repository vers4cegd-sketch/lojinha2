/*
  # Expand products schema for complete card customization

  1. Schema Updates
    - Add banner configuration fields
    - Add detailed skins management
    - Add visual customization options
    - Add card layout settings

  2. New Fields
    - banner_title, banner_subtitle, banner_type
    - banner_gradient_colors for custom gradients
    - detailed skins array with names, types, images
    - card_layout_type for different card styles
    - promotional_text and delivery_info
*/

-- Add new columns for complete card customization
DO $$
BEGIN
  -- Banner configuration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'banner_title'
  ) THEN
    ALTER TABLE products ADD COLUMN banner_title text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'banner_subtitle'
  ) THEN
    ALTER TABLE products ADD COLUMN banner_subtitle text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'banner_type'
  ) THEN
    ALTER TABLE products ADD COLUMN banner_type text DEFAULT 'gradient';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'banner_gradient_colors'
  ) THEN
    ALTER TABLE products ADD COLUMN banner_gradient_colors jsonb DEFAULT '["from-yellow-600", "via-orange-600", "to-yellow-800"]'::jsonb;
  END IF;

  -- Delivery and promotional info
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'delivery_info'
  ) THEN
    ALTER TABLE products ADD COLUMN delivery_info text DEFAULT 'ENTREGA AUTOMÁTICA';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'promotional_text'
  ) THEN
    ALTER TABLE products ADD COLUMN promotional_text text DEFAULT 'FULL ACESSO';
  END IF;

  -- Card layout type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'card_layout_type'
  ) THEN
    ALTER TABLE products ADD COLUMN card_layout_type text DEFAULT 'valorant';
  END IF;

  -- Enhanced skins with detailed information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'detailed_skins'
  ) THEN
    ALTER TABLE products ADD COLUMN detailed_skins jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Banner background image
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'banner_image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN banner_image_url text;
  END IF;

  -- Icon emojis for titles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'title_icons'
  ) THEN
    ALTER TABLE products ADD COLUMN title_icons jsonb DEFAULT '{"start": "⚡", "end": "⚡"}'::jsonb;
  END IF;
END $$;

-- Update existing products with sample data
UPDATE products SET 
  banner_title = 'OFERTA RELÂMPAGO',
  banner_subtitle = 'FULL ACESSO',
  delivery_info = 'ENTREGA AUTOMÁTICA',
  promotional_text = 'FULL ACESSO',
  banner_gradient_colors = '["from-yellow-600", "via-orange-600", "to-yellow-800"]'::jsonb,
  detailed_skins = '[
    {"name": "Elderflame Vandal", "type": "Exc", "rarity": "legendary"},
    {"name": "Prime Phantom", "type": "Pro", "rarity": "epic"},
    {"name": "Reaver Sheriff", "type": "Del", "rarity": "rare"},
    {"name": "Ion Operator", "type": "LIT", "rarity": "legendary"}
  ]'::jsonb,
  title_icons = '{"start": "⚡", "end": "⚡"}'::jsonb
WHERE name LIKE '%Valorant%' OR name LIKE '%Oferta%';

-- Update second product with different gradient
UPDATE products SET 
  banner_title = 'OFERTA DO DIA',
  banner_gradient_colors = '["from-blue-600", "via-indigo-600", "to-purple-600"]'::jsonb,
  title_icons = '{"start": "🍭", "end": "🍭"}'::jsonb
WHERE name LIKE '%Oferta do Dia%';