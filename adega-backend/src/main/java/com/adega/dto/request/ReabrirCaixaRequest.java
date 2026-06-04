package com.adega.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ReabrirCaixaRequest(
        @NotNull UUID adegaId
) {}
