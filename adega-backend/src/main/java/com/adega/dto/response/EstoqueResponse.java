package com.adega.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record EstoqueResponse(
        UUID variacaoId,
        String produtoNome,
        String variacaoDescricao,
        Integer estoqueAtual,
        Integer estoqueMinimo,
        String situacao,
        BigDecimal custoAquisicao,
        String categoriaNome
) {}
