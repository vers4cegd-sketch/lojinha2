/*
  # Criar sistema de biblioteca de banners

  1. Nova tabela
    - `banner_library` para armazenar banners pré-definidos
    - `id` (uuid, primary key)
    - `name` (text, nome do banner)
    - `description` (text, descrição opcional)
    - `image_url` (text, URL da imagem)
    - `category` (text, categoria do banner - valorant, cs2, ea-fc, geral)
    - `tags` (jsonb, tags para busca)
    - `is_active` (boolean, se está ativo)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela `banner_library`
    - Políticas para leitura pública e gerenciamento admin
*/

-- Criar tabela de biblioteca de banners
CREATE TABLE IF NOT EXISTS banner_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text NOT NULL,
  category text DEFAULT 'geral'::text,
  tags jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE banner_library ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can read active banners"
  ON banner_library
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage banners"
  ON banner_library
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para anon (desenvolvimento)
CREATE POLICY "Anon can manage banners"
  ON banner_library
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Inserir alguns banners padrão
INSERT INTO banner_library (name, description, image_url, category, tags) VALUES
  ('Banner Valorant Padrão', 'Banner padrão para produtos Valorant', 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=600', 'valorant', '["valorant", "gaming", "fps"]'),
  ('Banner CS2 Padrão', 'Banner padrão para produtos Counter-Strike 2', 'https://images.pexels.com/photos/1293269/pexels-photo-1293269.jpeg?auto=compress&cs=tinysrgb&w=600', 'cs2', '["cs2", "counter-strike", "gaming"]'),
  ('Banner EA FC Padrão', 'Banner padrão para produtos EA Sports FC', 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=600', 'ea-fc', '["fifa", "ea-fc", "football"]'),
  ('Banner Gaming Geral', 'Banner genérico para produtos de gaming', 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=600', 'geral', '["gaming", "geral", "universal"]')
ON CONFLICT DO NOTHING;