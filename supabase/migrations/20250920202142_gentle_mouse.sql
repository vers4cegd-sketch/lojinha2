/*
  # Corrigir políticas RLS para upload de banners

  1. Storage Policies
    - Permitir upload de imagens no bucket product-images
    - Permitir leitura pública das imagens
    - Permitir atualização e exclusão para authenticated users

  2. Banner Library Policies  
    - Permitir inserção de banners para authenticated users
    - Permitir leitura pública de banners ativos
    - Permitir gerenciamento completo para authenticated users

  3. Bucket Configuration
    - Garantir que o bucket product-images existe
    - Configurar como público para leitura
*/

-- Garantir que o bucket product-images existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[];

-- Remover políticas existentes do storage para recriar
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload product images" ON storage.objects;

-- Políticas para storage.objects (imagens)
CREATE POLICY "Public can read product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

CREATE POLICY "Anon can upload product images"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- Remover políticas existentes do storage.buckets para recriar
DROP POLICY IF EXISTS "Anyone can view buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Authenticated users can create buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Public can read buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Anon can create buckets" ON storage.buckets;

-- Políticas para storage.buckets
CREATE POLICY "Public can read buckets"
  ON storage.buckets
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anon can create buckets"
  ON storage.buckets
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can create buckets"
  ON storage.buckets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Garantir que a tabela banner_library existe
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

-- Habilitar RLS na tabela banner_library
ALTER TABLE banner_library ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes da banner_library para recriar
DROP POLICY IF EXISTS "Anyone can read active banners" ON banner_library;
DROP POLICY IF EXISTS "Authenticated users can manage banners" ON banner_library;
DROP POLICY IF EXISTS "Anon can manage banners" ON banner_library;
DROP POLICY IF EXISTS "Public can read active banners" ON banner_library;

-- Políticas para banner_library
CREATE POLICY "Public can read active banners"
  ON banner_library
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Anon can manage banners"
  ON banner_library
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage banners"
  ON banner_library
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Inserir banners de exemplo se não existirem
INSERT INTO banner_library (name, description, image_url, category, tags) 
SELECT * FROM (VALUES
  ('Banner Valorant Premium', 'Banner para produtos Valorant premium', 'https://images.pexels.com/photos/9072323/pexels-photo-9072323.jpeg?auto=compress&cs=tinysrgb&w=800', 'valorant', '["valorant", "premium", "gaming"]'::jsonb),
  ('Banner CS2 Exclusivo', 'Banner para contas CS2 exclusivas', 'https://images.pexels.com/photos/1293269/pexels-photo-1293269.jpeg?auto=compress&cs=tinysrgb&w=800', 'cs2', '["cs2", "counter-strike", "exclusive"]'::jsonb),
  ('Banner EA FC Geral', 'Banner genérico para EA Sports FC', 'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=800', 'ea-fc', '["fifa", "ea-fc", "sports"]'::jsonb)
) AS new_banners(name, description, image_url, category, tags)
WHERE NOT EXISTS (
  SELECT 1 FROM banner_library WHERE banner_library.name = new_banners.name
);