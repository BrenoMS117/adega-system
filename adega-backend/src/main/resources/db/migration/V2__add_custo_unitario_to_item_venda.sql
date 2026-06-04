-- Store the acquisition cost at the moment of sale so CMV stays historically accurate.
-- Nullable so existing rows (sales before this change) are unaffected.
ALTER TABLE itens_venda ADD COLUMN custo_unitario NUMERIC(10,2);
