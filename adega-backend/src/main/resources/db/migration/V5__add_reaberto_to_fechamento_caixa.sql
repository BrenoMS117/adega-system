ALTER TABLE fechamentos_caixa ADD COLUMN reaberto BOOLEAN DEFAULT FALSE;
ALTER TABLE fechamentos_caixa ADD COLUMN reaberto_por UUID REFERENCES usuarios(id);
ALTER TABLE fechamentos_caixa ADD COLUMN reaberto_em TIMESTAMPTZ;
