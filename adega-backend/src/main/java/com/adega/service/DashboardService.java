package com.adega.service;

import com.adega.dto.response.DashboardResponse;
import com.adega.dto.response.EstoqueResponse;
import com.adega.model.ItemVenda;
import com.adega.model.Venda;
import com.adega.model.enums.StatusVenda;
import com.adega.repository.VendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final ZoneId BRAZIL_ZONE = ZoneId.of("America/Sao_Paulo");

    private final VendaRepository vendaRepository;
    private final EstoqueService estoqueService;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(UUID adegaId, LocalDate data) {
        LocalDateTime startUTC = data.atStartOfDay(BRAZIL_ZONE)
                .withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();
        LocalDateTime endUTC = ZonedDateTime.of(data, LocalTime.of(23, 59, 59), BRAZIL_ZONE)
                .withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();

        List<Venda> vendas = vendaRepository
                .findByAdegaIdAndDataHoraBetween(adegaId, startUTC, endUTC)
                .stream()
                .filter(v -> v.getStatus() == StatusVenda.CONCLUIDA)
                .toList();

        BigDecimal totalFaturamento = vendas.stream()
                .map(Venda::getTotalLiquido)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalVendas = vendas.size();

        BigDecimal ticketMedio = totalVendas == 0
                ? BigDecimal.ZERO
                : totalFaturamento.divide(BigDecimal.valueOf(totalVendas), 2, RoundingMode.HALF_UP);

        BigDecimal totalDescontos = vendas.stream()
                .map(Venda::getTotalDesconto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<DashboardResponse.TopProdutoItem> topProdutos = buildTopProdutos(vendas);

        Map<String, BigDecimal> pagamentosPorForma = vendas.stream()
                .flatMap(v -> v.getPagamentos().stream())
                .collect(Collectors.groupingBy(
                        p -> p.getForma().name(),
                        Collectors.reducing(BigDecimal.ZERO, p -> p.getValor(), BigDecimal::add)
                ));

        List<DashboardResponse.DescontoFuncionarioItem> descontosPorFuncionario = vendas.stream()
                .collect(Collectors.groupingBy(v -> v.getUsuario().getId()))
                .entrySet().stream()
                .map(e -> {
                    List<Venda> uVendas = e.getValue();
                    BigDecimal desconto = uVendas.stream()
                            .map(Venda::getTotalDesconto)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new DashboardResponse.DescontoFuncionarioItem(
                            uVendas.get(0).getUsuario().getNome(), desconto, uVendas.size());
                })
                .sorted(Comparator.comparing(DashboardResponse.DescontoFuncionarioItem::totalDesconto).reversed())
                .toList();

        List<EstoqueResponse> estoqueCritico = estoqueService.findAll(adegaId, null, null)
                .stream()
                .filter(e -> !e.situacao().equals("OK"))
                .toList();

        Map<Integer, BigDecimal> vendasPorHora = vendas.stream()
                .collect(Collectors.groupingBy(
                        v -> v.getDataHora().getHour(),
                        Collectors.reducing(BigDecimal.ZERO, Venda::getTotalLiquido, BigDecimal::add)
                ));

        return new DashboardResponse(
                totalFaturamento,
                totalVendas,
                ticketMedio,
                totalDescontos,
                topProdutos,
                pagamentosPorForma,
                descontosPorFuncionario,
                estoqueCritico,
                vendasPorHora
        );
    }

    private List<DashboardResponse.TopProdutoItem> buildTopProdutos(List<Venda> vendas) {
        record ItemAgg(String produtoNome, String variacaoDesc, int quantidade, BigDecimal totalValor) {}

        return vendas.stream()
                .flatMap(v -> v.getItens().stream())
                .collect(Collectors.groupingBy(i -> i.getVariacaoProduto().getId()))
                .entrySet().stream()
                .map(e -> {
                    List<ItemVenda> items = e.getValue();
                    var variacao = items.get(0).getVariacaoProduto();
                    int qty = items.stream().mapToInt(ItemVenda::getQuantidade).sum();
                    BigDecimal valor = items.stream()
                            .map(ItemVenda::getSubtotal)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new DashboardResponse.TopProdutoItem(
                            variacao.getProduto().getNome(), variacao.getDescricao(), qty, valor);
                })
                .sorted(Comparator.comparingInt(DashboardResponse.TopProdutoItem::quantidade).reversed())
                .limit(5)
                .toList();
    }
}
