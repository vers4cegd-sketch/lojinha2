/*
  # Criar tabelas para skins do Valorant

  1. Nova Tabela `skins`
    - `id` (uuid, primary key)
    - `arma` (text) - Nome da arma
    - `nome_skin` (text) - Nome da skin
    - `imagem_url` (text) - URL da imagem
    - `raridade` (text) - Tier/raridade da skin
    - `colecao` (text) - Coleção da skin
    - `weapon_uuid` (text) - UUID da arma na API
    - `skin_uuid` (text) - UUID da skin na API
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela `skins`
    - Políticas para leitura pública e gerenciamento por usuários autenticados

  3. Índices
    - Índice único para weapon_uuid + skin_uuid para evitar duplicatas
    - Índice para busca por arma e raridade
*/

-- Criar tabela de skins
CREATE TABLE IF NOT EXISTS skins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arma text NOT NULL,
  nome_skin text NOT NULL,
  imagem_url text,
  raridade text,
  colecao text,
  weapon_uuid text NOT NULL,
  skin_uuid text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(weapon_uuid, skin_uuid)
);

-- Enable RLS
ALTER TABLE skins ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Anyone can read skins"
  ON skins
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage skins"
  ON skins
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_skins_arma ON skins(arma);
CREATE INDEX IF NOT EXISTS idx_skins_raridade ON skins(raridade);
CREATE INDEX IF NOT EXISTS idx_skins_weapon_uuid ON skins(weapon_uuid);

-- Tabela para vincular skins aos produtos
CREATE TABLE IF NOT EXISTS product_skins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  skin_id uuid REFERENCES skins(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, skin_id)
);

-- Enable RLS para product_skins
ALTER TABLE product_skins ENABLE ROW LEVEL SECURITY;

-- Políticas para product_skins
CREATE POLICY "Anyone can read product skins"
  ON product_skins
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage product skins"
  ON product_skins
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);