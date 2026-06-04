package com.adega.dto.response;

import java.math.BigDecimal;

public record CmvItemResponse(
        String produtoNome,
        String variacaoDescricao,
        String categoriaNome,
        Integer quantidadeVendida,
        BigDecimal custoUnitario,
        BigDecimal custoTotal,
        BigDecimal faturamentoTotal,
        BigDecimal margemBruta,
        BigDecimal percentualCmv,
        BigDecimal percentualMargem
) {}
