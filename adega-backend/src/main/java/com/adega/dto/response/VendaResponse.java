package com.adega.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record VendaResponse(
        UUID id,
        String usuarioNome,
        String adegaNome,
        LocalDateTime dataHora,
        String status,
        String canal,
        BigDecimal totalBruto,
        BigDecimal totalDesconto,
        BigDecimal totalLiquido,
        List<ItemVendaResponse> itens,
        List<PagamentoResponse> pagamentos
) {}
