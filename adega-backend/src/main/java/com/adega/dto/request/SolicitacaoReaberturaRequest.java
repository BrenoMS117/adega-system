package com.adega.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SolicitacaoReaberturaRequest(
        @NotNull UUID adegaId,
        @NotBlank String motivo
) {}
