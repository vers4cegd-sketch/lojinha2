/*
  # Criar tabela de relacionamento conta-skins

  1. Nova Tabela
    - `account_skins`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key para products)
      - `skin_id` (uuid, foreign key para skins)
      - `created_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela `account_skins`
    - Adicionar políticas para usuários autenticados

  3. Índices
    - Índice único para evitar duplicatas (product_id, skin_id)
    - Índices para performance em consultas
*/

-- Criar tabela de relacionamento conta-skins
CREATE TABLE IF NOT EXISTS account_skins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  skin_id uuid NOT NULL REFERENCES skins(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, skin_id)
);

-- Habilitar RLS
ALTER TABLE account_skins ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Anyone can read account skins"
  ON account_skins
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage account skins"
  ON account_skins
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_account_skins_product_id ON account_skins(product_id);
CREATE INDEX IF NOT EXISTS idx_account_skins_skin_id ON account_skins(skin_id);