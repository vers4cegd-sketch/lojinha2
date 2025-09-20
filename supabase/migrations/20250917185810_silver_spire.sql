/*
  # Create admin tables for game store

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `slug` (text, unique)
      - `description` (text)
      - `image_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key)
      - `name` (text)
      - `price` (decimal)
      - `rating` (decimal)
      - `image_url` (text)
      - `tag` (text)
      - `tag_type` (text)
      - `features` (jsonb)
      - `skins_count` (integer)
      - `skins` (jsonb)
      - `is_special_offer` (boolean)
      - `time_left` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `admin_users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `email` (text, unique)
      - `password_hash` (text)
      - `role` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
*/

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  rating decimal(2,1) DEFAULT 4.5,
  image_url text,
  tag text DEFAULT '',
  tag_type text DEFAULT 'popular',
  features jsonb DEFAULT '[]'::jsonb,
  skins_count integer DEFAULT 0,
  skins jsonb DEFAULT '[]'::jsonb,
  is_special_offer boolean DEFAULT false,
  time_left jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true);

-- Products policies
CREATE POLICY "Anyone can read products"
  ON products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (true);

-- Admin users policies
CREATE POLICY "Authenticated users can read admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (true);

-- Insert default categories
INSERT INTO categories (name, slug, description, image_url) VALUES
('Valorant', 'valorant', 'Contas premium com as melhores skins e ranks elevados. Qualidade garantida e entrega imediata.', 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=400'),
('Counter-Strike 2', 'cs2', 'Contas Prime com skins valiosas e ranks elevados. Domine os mapas clássicos com estilo.', 'https://images.pexels.com/photos/1293269/pexels-photo-1293269.jpeg?auto=compress&cs=tinysrgb&w=400'),
('EA Sports FC 26', 'ea-fc26', 'Contas com jogadores exclusivos e times completos. Domine os campos com os melhores elencos.', 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=400')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
DO $$
DECLARE
  valorant_id uuid;
  cs2_id uuid;
  eafc_id uuid;
BEGIN
  -- Get category IDs
  SELECT id INTO valorant_id FROM categories WHERE slug = 'valorant';
  SELECT id INTO cs2_id FROM categories WHERE slug = 'cs2';
  SELECT id INTO eafc_id FROM categories WHERE slug = 'ea-fc26';

  -- Insert Valorant products
  INSERT INTO products (category_id, name, price, rating, image_url, tag, tag_type, features, skins_count, skins, is_special_offer) VALUES
  (valorant_id, 'Oferta Relâmpago 1 | Full Acesso', 80.00, 4.9, 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=400', 'OFERTA LIMITADA', 'limited', '["Conta Full Acesso", "Possui todos os dados de recuperação", "Conta Br", "Entrega automática via E-mail"]'::jsonb, 24, '[{"name": "Elderflame Vandal", "type": "Exc"}, {"name": "Prime Phantom", "type": "Pro"}]'::jsonb, true),
  (valorant_id, 'Conta Premium VIP | Radiante', 449.99, 4.8, 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=400', 'EXCLUSIVO', 'exclusive', '["Conta Full Acesso", "Rank Radiante", "Pacote Premium completo", "Entrega automática via E-mail"]'::jsonb, 18, '[{"name": "Dragon Vandal", "type": "Exc"}, {"name": "Phantom Oni", "type": "Pro"}]'::jsonb, false);

  -- Insert CS2 product
  INSERT INTO products (category_id, name, price, rating, image_url, tag, tag_type, features, skins_count) VALUES
  (cs2_id, 'Conta de Cs 2 Com Prime Ativo | Full Acesso | +800 horas de jogo', 49.90, 4.9, 'https://images.pexels.com/photos/1293269/pexels-photo-1293269.jpeg?auto=compress&cs=tinysrgb&w=400', 'EXCLUSIVO', 'exclusive', '["Conta verificada", "Prime ativo"]'::jsonb, 0);

  -- Insert EA FC product
  INSERT INTO products (category_id, name, price, rating, image_url, tag, tag_type, features, skins_count) VALUES
  (eafc_id, 'EA Sports FC 26 | PRÉ VENDA', 180.00, 4.9, 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=400', 'EXCLUSIVO', 'exclusive', '["Conta Full Acesso", "Conta Só Sua", "Vai com os Dados de Recuperação", "Entrega Automática", "Conta Steam"]'::jsonb, 0);
END $$;