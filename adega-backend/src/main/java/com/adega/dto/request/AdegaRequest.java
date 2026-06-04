package com.adega.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AdegaRequest(
        @NotBlank String nome,
        String endereco,
        String cnpj
) {}
