-- V3 - Permite CNPJ e endereco nulos na adega e remove a unicidade do CNPJ
-- (valores em branco/nulos conflitariam com a constraint UNIQUE original).
-- Observacao: a tabela e "adegas" (plural) e uq_adega_cnpj e uma CONSTRAINT,
-- nao um indice independente, portanto usa-se DROP CONSTRAINT.

ALTER TABLE adegas ALTER COLUMN endereco DROP NOT NULL;
ALTER TABLE adegas ALTER COLUMN cnpj DROP NOT NULL;
ALTER TABLE adegas DROP CONSTRAINT IF EXISTS uq_adega_cnpj;
