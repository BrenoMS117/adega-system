package com.adega.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record ItemVendaResponse(
        UUID id,
        String produtoNome,
        String variacaoDescricao,
        Integer quantidade,
        BigDecimal precoUnitario,
        BigDecimal descontoValor,
        BigDecimal subtotal,
        BigDecimal custoUnitario
) {}
