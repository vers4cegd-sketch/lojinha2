/*
  # Sistema completo de upload de imagens

  1. Storage Setup
    - Criar bucket product-images se não existir
    - Configurar como público
    - Definir políticas permissivas para desenvolvimento

  2. Políticas RLS
    - Upload público (desenvolvimento)
    - Leitura pública
    - Gerenciamento completo

  3. Configurações
    - Tipos de arquivo permitidos
    - Limite de tamanho
    - URLs públicas
*/

-- Inserir bucket se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Remover políticas existentes
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access" ON storage.objects;
DROP POLICY IF EXISTS "Public update access" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access" ON storage.objects;

-- Política de leitura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Política de upload público (desenvolvimento)
CREATE POLICY "Public upload access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = 'product-images'
);

-- Política de atualização pública
CREATE POLICY "Public update access"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Política de exclusão pública
CREATE POLICY "Public delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');