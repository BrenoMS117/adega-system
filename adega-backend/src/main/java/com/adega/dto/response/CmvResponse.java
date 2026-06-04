package com.adega.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CmvResponse(
        LocalDate dataInicio,
        LocalDate dataFim,
        String adegaNome,
        List<CmvItemResponse> itens,
        BigDecimal totalFaturamento,
        BigDecimal totalCusto,
        BigDecimal totalMargemBruta,
        BigDecimal percentualCmvGeral,
        BigDecimal percentualMargemGeral
) {}
