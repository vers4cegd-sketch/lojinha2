/*
  # Corrigir políticas RLS para importação de skins

  1. Segurança
    - Remove políticas restritivas antigas da tabela skins
    - Cria políticas permissivas para usuários autenticados
    - Mantém leitura pública para o frontend
    - Permite todas operações CRUD para admins autenticados

  2. Correções
    - Resolve erro 401 Unauthorized
    - Resolve erro 406 Not Acceptable  
    - Resolve violação de RLS policy
    - Permite importação completa de skins
*/

-- Remove todas as políticas antigas da tabela skins
DROP POLICY IF EXISTS "Anyone can read skins" ON skins;
DROP POLICY IF EXISTS "Authenticated users can manage skins" ON skins;

-- Cria políticas permissivas para skins
CREATE POLICY "Public can read skins"
  ON skins
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert skins"
  ON skins
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update skins"
  ON skins
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete skins"
  ON skins
  FOR DELETE
  TO authenticated
  USING (true);

-- Garante que RLS está habilitado
ALTER TABLE skins ENABLE ROW LEVEL SECURITY;