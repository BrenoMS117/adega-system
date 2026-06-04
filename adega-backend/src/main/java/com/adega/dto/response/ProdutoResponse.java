package com.adega.dto.response;

import java.util.List;
import java.util.UUID;

public record ProdutoResponse(
        UUID id,
        String nome,
        String descricao,
        String categoriaNome,
        boolean ativo,
        List<VariacaoProdutoResponse> variacoes
) {}
