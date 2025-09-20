/*
  # Desabilitar RLS para bucket product-images

  1. Configuração
    - Remove todas as políticas RLS existentes
    - Desabilita RLS completamente para o bucket
    - Permite uploads sem autenticação (desenvolvimento)

  2. Segurança
    - Configuração permissiva para desenvolvimento
    - Para produção, reconfigurar com políticas adequadas
*/

-- Remover todas as políticas existentes do bucket product-images
DELETE FROM storage.policies 
WHERE bucket_id = 'product-images';

-- Desabilitar RLS para o bucket product-images
UPDATE storage.buckets 
SET public = true 
WHERE id = 'product-images';

-- Criar política permissiva para todos os objetos
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition, command, roles)
VALUES (
  'product-images-all-access',
  'product-images',
  'Allow all operations on product images',
  'true',
  'true',
  'ALL',
  '{public}'
) ON CONFLICT (id) DO UPDATE SET
  definition = 'true',
  check_definition = 'true',
  command = 'ALL',
  roles = '{public}';

-- Garantir que o bucket existe e está configurado corretamente
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];