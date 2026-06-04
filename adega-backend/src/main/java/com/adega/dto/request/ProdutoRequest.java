package com.adega.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record ProdutoRequest(
        @NotBlank String nome,
        @NotNull UUID categoriaId,
        String descricao,
        boolean ativo,
        @Valid List<VariacaoProdutoRequest> variacoes
) {}
