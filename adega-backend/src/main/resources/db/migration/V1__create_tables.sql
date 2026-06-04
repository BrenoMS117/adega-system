-- ============================================================
-- V1 - Schema inicial do sistema de adega
-- ============================================================

CREATE TABLE IF NOT EXISTS adegas (
    id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    nome        VARCHAR(255) NOT NULL,
    endereco    VARCHAR(500) NOT NULL,
    cnpj        VARCHAR(18)  NOT NULL,
    CONSTRAINT uq_adega_cnpj UNIQUE (cnpj)
);

CREATE TABLE IF NOT EXISTS categorias (
    id   UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    CONSTRAINT uq_categoria_nome UNIQUE (nome)
);

CREATE TABLE IF NOT EXISTS usuarios (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    adega_id    UUID,
    nome        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    senha_hash  VARCHAR(255) NOT NULL,
    perfil      VARCHAR(20)  NOT NULL,
    ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_usuario_email  UNIQUE (email),
    CONSTRAINT fk_usuario_adega  FOREIGN KEY (adega_id) REFERENCES adegas (id)
);

CREATE TABLE IF NOT EXISTS produtos (
    id           UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    categoria_id UUID         NOT NULL,
    nome         VARCHAR(255) NOT NULL,
    descricao    TEXT,
    ativo        BOOLEAN      NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_produto_categoria FOREIGN KEY (categoria_id) REFERENCES categorias (id)
);

CREATE TABLE IF NOT EXISTS variacoes_produto (
    id               UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
    produto_id       UUID           NOT NULL,
    descricao        VARCHAR(255)   NOT NULL,
    preco_venda      NUMERIC(10, 2) NOT NULL,
    custo_aquisicao  NUMERIC(10, 2) NOT NULL,
    estoque_atual    INTEGER        NOT NULL DEFAULT 0,
    estoque_minimo   INTEGER        NOT NULL DEFAULT 0,
    CONSTRAINT fk_variacao_produto FOREIGN KEY (produto_id) REFERENCES produtos (id)
);

CREATE TABLE IF NOT EXISTS vendas (
    id              UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
    adega_id        UUID           NOT NULL,
    usuario_id      UUID           NOT NULL,
    data_hora       TIMESTAMPTZ    NOT NULL,
    status          VARCHAR(20)    NOT NULL,
    canal           VARCHAR(20)    NOT NULL,
    total_bruto     NUMERIC(10, 2) NOT NULL,
    total_desconto  NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_liquido   NUMERIC(10, 2) NOT NULL,
    nfe_chave       VARCHAR(44),
    CONSTRAINT fk_venda_adega   FOREIGN KEY (adega_id)   REFERENCES adegas   (id),
    CONSTRAINT fk_venda_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios  (id)
);

CREATE TABLE IF NOT EXISTS itens_venda (
    id                  UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
    venda_id            UUID           NOT NULL,
    variacao_produto_id UUID           NOT NULL,
    quantidade          INTEGER        NOT NULL,
    preco_unitario      NUMERIC(10, 2) NOT NULL,
    desconto_valor      NUMERIC(10, 2) NOT NULL DEFAULT 0,
    subtotal            NUMERIC(10, 2) NOT NULL,
    CONSTRAINT fk_item_venda    FOREIGN KEY (venda_id)            REFERENCES vendas            (id),
    CONSTRAINT fk_item_variacao FOREIGN KEY (variacao_produto_id) REFERENCES variacoes_produto (id)
);

CREATE TABLE IF NOT EXISTS pagamentos (
    id       UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
    venda_id UUID           NOT NULL,
    forma    VARCHAR(20)    NOT NULL,
    valor    NUMERIC(10, 2) NOT NULL,
    CONSTRAINT fk_pagamento_venda FOREIGN KEY (venda_id) REFERENCES vendas (id)
);

CREATE TABLE IF NOT EXISTS movimentos_estoque (
    id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    variacao_produto_id UUID        NOT NULL,
    usuario_id          UUID        NOT NULL,
    venda_id            UUID,
    tipo                VARCHAR(20) NOT NULL,
    quantidade          INTEGER     NOT NULL,
    data_hora           TIMESTAMPTZ NOT NULL,
    observacao          TEXT,
    CONSTRAINT fk_movimento_variacao FOREIGN KEY (variacao_produto_id) REFERENCES variacoes_produto (id),
    CONSTRAINT fk_movimento_usuario  FOREIGN KEY (usuario_id)          REFERENCES usuarios          (id),
    CONSTRAINT fk_movimento_venda    FOREIGN KEY (venda_id)            REFERENCES vendas             (id)
);

CREATE TABLE IF NOT EXISTS fechamentos_caixa (
    id                 UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
    adega_id           UUID           NOT NULL,
    usuario_id         UUID           NOT NULL,
    data               DATE           NOT NULL,
    total_vendas       INTEGER        NOT NULL,
    total_faturamento  NUMERIC(10, 2) NOT NULL,
    total_dinheiro     NUMERIC(10, 2) NOT NULL,
    total_pix          NUMERIC(10, 2) NOT NULL,
    total_cartao       NUMERIC(10, 2) NOT NULL,
    total_beneficio    NUMERIC(10, 2) NOT NULL,
    total_descontos    NUMERIC(10, 2) NOT NULL,
    dinheiro_sistema   NUMERIC(10, 2) NOT NULL,
    dinheiro_contado   NUMERIC(10, 2) NOT NULL,
    diferenca          NUMERIC(10, 2) NOT NULL,
    observacao         TEXT,
    CONSTRAINT fk_fechamento_adega   FOREIGN KEY (adega_id)   REFERENCES adegas   (id),
    CONSTRAINT fk_fechamento_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios  (id),
    CONSTRAINT uq_fechamento_adega_data UNIQUE (adega_id, data)
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_usuario_adega_id         ON usuarios           (adega_id);
CREATE INDEX idx_produto_categoria_id     ON produtos           (categoria_id);
CREATE INDEX idx_variacao_produto_id      ON variacoes_produto  (produto_id);
CREATE INDEX idx_venda_adega_id           ON vendas             (adega_id);
CREATE INDEX idx_venda_usuario_id         ON vendas             (usuario_id);
CREATE INDEX idx_venda_data_hora          ON vendas             (data_hora);
CREATE INDEX idx_item_venda_id            ON itens_venda        (venda_id);
CREATE INDEX idx_item_variacao_id         ON itens_venda        (variacao_produto_id);
CREATE INDEX idx_pagamento_venda_id       ON pagamentos         (venda_id);
CREATE INDEX idx_movimento_variacao_id    ON movimentos_estoque (variacao_produto_id);
CREATE INDEX idx_movimento_usuario_id     ON movimentos_estoque (usuario_id);
CREATE INDEX idx_movimento_data_hora      ON movimentos_estoque (data_hora);
CREATE INDEX idx_fechamento_adega_id      ON fechamentos_caixa  (adega_id);
CREATE INDEX idx_fechamento_data          ON fechamentos_caixa  (data);
