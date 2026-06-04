package com.adega.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record VariacaoProdutoRequest(
        @NotBlank String descricao,
        @NotNull @Positive BigDecimal precoVenda,
        BigDecimal custoAquisicao,
        Integer estoqueAtual,
        Integer estoqueMinimo
) {}
