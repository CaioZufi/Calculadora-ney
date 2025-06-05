-- Adicionar campos de rastreamento à tabela de cálculos
ALTER TABLE calculations 
ADD COLUMN IF NOT EXISTS vehicles_with_tracking INTEGER,
ADD COLUMN IF NOT EXISTS tracking_cost_per_vehicle REAL;