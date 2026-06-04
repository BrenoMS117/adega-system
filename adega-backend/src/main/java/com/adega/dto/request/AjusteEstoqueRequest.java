package com.adega.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AjusteEstoqueRequest(
        @NotNull UUID variacaoId,
        @NotNull @Min(0) Integer novaQuantidade,
        String observacao
) {}
