CREATE TABLE notificacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    mensagem TEXT NOT NULL,
    destinatario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    remetente_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    adega_id UUID REFERENCES adegas(id) ON DELETE CASCADE,
    lida BOOLEAN DEFAULT FALSE,
    dados_extras JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notificacoes_destinatario ON notificacoes(destinatario_id, lida, created_at DESC);
CREATE INDEX idx_notificacoes_adega ON notificacoes(adega_id);
