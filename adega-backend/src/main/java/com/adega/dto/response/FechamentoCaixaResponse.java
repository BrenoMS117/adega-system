package com.adega.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record FechamentoCaixaResponse(
        UUID id,
        LocalDate data,
        String adegaNome,
        String usuarioNome,
        Integer totalVendas,
        BigDecimal totalFaturamento,
        BigDecimal totalDinheiro,
        BigDecimal totalPix,
        BigDecimal totalCartao,
        BigDecimal totalBeneficio,
        BigDecimal totalDescontos,
        BigDecimal dinheiroSistema,
        BigDecimal dinheiroContado,
        BigDecimal diferenca,
        String observacao
) {}
