/*
  # Adicionar campo checkout_url aos produtos

  1. Alterações
    - Adiciona coluna `checkout_url` na tabela `products`
    - Campo opcional para links de checkout personalizados
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'checkout_url'
  ) THEN
    ALTER TABLE products ADD COLUMN checkout_url text;
  END IF;
END $$;