package com.adega.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record FechamentoCaixaRequest(
        @NotNull UUID adegaId,
        @NotNull BigDecimal dinheiroContado,
        String observacao
) {}
