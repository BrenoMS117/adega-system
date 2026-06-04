package com.adega.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record PagamentoResponse(
        UUID id,
        String forma,
        BigDecimal valor
) {}
