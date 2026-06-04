package com.adega.dto.request;

import com.adega.model.enums.CanalVenda;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record VendaRequest(
        @NotNull UUID adegaId,
        @NotNull CanalVenda canal,
        @NotEmpty @Valid List<ItemVendaRequest> itens,
        @NotEmpty @Valid List<PagamentoRequest> pagamentos
) {}
