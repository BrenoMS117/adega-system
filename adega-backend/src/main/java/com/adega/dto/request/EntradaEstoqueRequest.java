package com.adega.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record EntradaEstoqueRequest(
        @NotNull UUID variacaoId,
        @NotNull @Min(1) Integer quantidade,
        BigDecimal custoAquisicao,
        String observacao
) {}
