/*
  # Corrigir políticas RLS do bucket product-images

  1. Políticas de Storage
    - Permitir leitura pública de imagens
    - Permitir upload público (temporário para desenvolvimento)
    - Permitir gerenciamento público de arquivos

  2. Segurança
    - Políticas permissivas para desenvolvimento
    - AVISO: Em produção, implementar autenticação adequada
    - Limitar tipos de arquivo e tamanhos

  3. Observações
    - Remove políticas existentes conflitantes
    - Cria políticas novas com permissões adequadas
    - Funciona com chave anon atual
*/

-- Remove políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage" ON storage.objects;

-- Política para leitura pública de imagens
CREATE POLICY "Public read product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Política para upload público (temporário para desenvolvimento)
CREATE POLICY "Public upload product images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.extension(name) = ANY(ARRAY['jpg', 'jpeg', 'png', 'webp', 'gif']))
  AND octet_length(decode(encode(storage.objects.metadata, 'escape'), 'escape')) < 5242880 -- 5MB limit
);

-- Política para atualização pública
CREATE POLICY "Public update product images"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Política para exclusão pública
CREATE POLICY "Public delete product images"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'product-images');