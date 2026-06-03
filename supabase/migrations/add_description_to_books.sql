-- Adicionar coluna de descrição na tabela books
ALTER TABLE IF EXISTS books ADD COLUMN IF NOT EXISTS description TEXT;