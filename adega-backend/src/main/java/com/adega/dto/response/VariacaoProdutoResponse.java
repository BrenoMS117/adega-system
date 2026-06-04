package com.adega.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record VariacaoProdutoResponse(
        UUID id,
        String descricao,
        BigDecimal precoVenda,
        BigDecimal custoAquisicao,
        Integer estoqueAtual,
        Integer estoqueMinimo,
        String situacao
) {}
