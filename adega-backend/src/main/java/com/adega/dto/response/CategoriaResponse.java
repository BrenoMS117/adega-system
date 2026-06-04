package com.adega.dto.response;

import java.util.UUID;

public record CategoriaResponse(
        UUID id,
        String nome,
        Integer totalProdutos
) {}
