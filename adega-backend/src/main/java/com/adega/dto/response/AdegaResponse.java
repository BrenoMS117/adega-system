package com.adega.dto.response;

import java.util.UUID;

public record AdegaResponse(
        UUID id,
        String nome,
        String endereco,
        String cnpj,
        Integer totalUsuarios
) {}
