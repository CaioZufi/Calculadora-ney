-- Adicionar coluna user_name à tabela calculations
ALTER TABLE calculations ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Atualizar a coluna user_name para registros existentes
UPDATE calculations c
SET user_name = CONCAT(a.first_name, ' ', a.last_name)
FROM app_users a
WHERE c.app_user_id = a.id AND c.user_name IS NULL;