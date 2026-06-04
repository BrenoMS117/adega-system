package com.adega.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record DashboardResponse(
        BigDecimal totalFaturamento,
        Integer totalVendas,
        BigDecimal ticketMedio,
        BigDecimal totalDescontos,
        List<TopProdutoItem> topProdutos,
        Map<String, BigDecimal> pagamentosPorForma,
        List<DescontoFuncionarioItem> descontosPorFuncionario,
        List<EstoqueResponse> estoqueCritico,
        Map<Integer, BigDecimal> vendasPorHora
) {
    public record TopProdutoItem(
            String nome,
            String variacao,
            Integer quantidade,
            BigDecimal totalValor
    ) {}

    public record DescontoFuncionarioItem(
            String nome,
            BigDecimal totalDesconto,
            Integer qtdVendas
    ) {}
}
