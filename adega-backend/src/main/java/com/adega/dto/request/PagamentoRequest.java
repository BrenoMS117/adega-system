package com.adega.dto.request;

import com.adega.model.enums.FormaPagamento;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record PagamentoRequest(
        @NotNull FormaPagamento forma,
        @NotNull @Positive BigDecimal valor
) {}
