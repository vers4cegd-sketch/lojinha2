/*
  # Sistema de Biblioteca de Banners

  1. Nova Tabela
    - `banner_library`
      - `id` (uuid, primary key)
      - `name` (text, nome do banner)
      - `description` (text, descrição opcional)
      - `image_url` (text, URL da imagem)
      - `category` (text, categoria do banner)
      - `tags` (jsonb, tags para busca)
      - `is_active` (boolean, se está ativo)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela `banner_library`
    - Políticas para leitura pública e gerenciamento admin
*/

-- Criar tabela banner_library
CREATE TABLE IF NOT EXISTS banner_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text NOT NULL,
  category text DEFAULT 'geral',
  tags jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE banner_library ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (qualquer um pode ver banners ativos)
CREATE POLICY "Anyone can read active banners"
  ON banner_library
  FOR SELECT
  TO public
  USING (is_active = true);

-- Política para gerenciamento completo (admin/authenticated)
CREATE POLICY "Authenticated users can manage banners"
  ON banner_library
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para anon também gerenciar (desenvolvimento)
CREATE POLICY "Anon can manage banners"
  ON banner_library
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Inserir alguns banners de exemplo
INSERT INTO banner_library (name, description, image_url, category, tags) VALUES
('Banner Valorant Premium', 'Banner para produtos Valorant premium', 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=800', 'valorant', '["valorant", "premium", "gaming"]'),
('Banner CS2 Exclusivo', 'Banner para contas CS2 exclusivas', 'https://images.pexels.com/photos/1293269/pexels-photo-1293269.jpeg?auto=compress&cs=tinysrgb&w=800', 'cs2', '["cs2", "counter-strike", "exclusive"]'),
('Banner EA FC Geral', 'Banner genérico para EA Sports FC', 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=800', 'ea-fc', '["fifa", "ea-fc", "sports"]')
ON CONFLICT DO NOTHING;