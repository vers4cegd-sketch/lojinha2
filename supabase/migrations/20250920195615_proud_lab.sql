/*
  # Configurar políticas RLS para Supabase Storage

  1. Políticas para storage.buckets
    - Permite criar buckets com role anon
    - Permite listar buckets existentes
  
  2. Políticas para storage.objects  
    - Permite upload de arquivos no bucket product-images
    - Permite leitura pública de arquivos
    - Permite atualização e exclusão de arquivos

  3. Segurança
    - Políticas específicas para bucket product-images
    - Validação de tipos de arquivo permitidos
    - Limite de tamanho implícito via bucket config
*/

-- Habilitar RLS nas tabelas de storage se não estiver habilitado
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Allow anon to create buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Allow anon to read buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Allow anon to upload to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to update product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to delete product-images" ON storage.objects;

-- Políticas para storage.buckets (permitir criar e listar buckets)
CREATE POLICY "Allow anon to create buckets"
ON storage.buckets
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon to read buckets"
ON storage.buckets
FOR SELECT
TO anon
USING (true);

-- Políticas para storage.objects (operações em arquivos)
CREATE POLICY "Allow anon to upload to product-images"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public read access to product-images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Allow anon to update product-images"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow anon to delete product-images"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'product-images');

-- Criar o bucket product-images se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];