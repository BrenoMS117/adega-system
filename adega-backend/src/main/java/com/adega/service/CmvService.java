package com.adega.service;

import com.adega.dto.response.CmvItemResponse;
import com.adega.dto.response.CmvResponse;
import com.adega.model.Adega;
import com.adega.model.ItemVenda;
import com.adega.model.VariacaoProduto;
import com.adega.model.Venda;
import com.adega.model.enums.StatusVenda;
import com.adega.repository.AdegaRepository;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CmvService {

    private static final ZoneId BRAZIL_ZONE = ZoneId.of("America/Sao_Paulo");

    private final VendaRepository vendaRepository;
    private final AdegaRepository adegaRepository;

    @Transactional(readOnly = true)
    public CmvResponse getCmv(UUID adegaId, LocalDate dataInicio, LocalDate dataFim) {
        LocalDateTime startUTC = dataInicio.atStartOfDay(BRAZIL_ZONE)
                .withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();
        LocalDateTime endUTC = ZonedDateTime.of(dataFim, LocalTime.of(23, 59, 59), BRAZIL_ZONE)
                .withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();

        List<Venda> vendas = vendaRepository.findWithFilters(
                adegaId,
                startUTC,
                endUTC,
                StatusVenda.CONCLUIDA,
                null,
                null);

        // Group sold items by variation, preserving insertion order before the sort.
        Map<UUID, List<ItemVenda>> grouped = new LinkedHashMap<>();
        for (Venda venda : vendas) {
            for (ItemVenda item : venda.getItens()) {
                grouped.computeIfAbsent(item.getVariacaoProduto().getId(), k -> new ArrayList<>())
                        .add(item);
            }
        }

        List<CmvItemResponse> itens = new ArrayList<>();
        for (List<ItemVenda> group : grouped.values()) {
            VariacaoProduto variacao = group.get(0).getVariacaoProduto();

            int quantidadeVendida = group.stream()
                    .mapToInt(ItemVenda::getQuantidade)
                    .sum();
            BigDecimal faturamentoTotal = group.stream()
                    .map(ItemVenda::getSubtotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Weighted average of the cost captured at sale time; fall back to the
            // variation's current cost for legacy sales that have no captured cost.
            List<ItemVenda> comCusto = group.stream()
                    .filter(i -> i.getCustoUnitario() != null)
                    .toList();
            BigDecimal custoUnitario;
            if (!comCusto.isEmpty()) {
                BigDecimal custoPonderado = comCusto.stream()
                        .map(i -> i.getCustoUnitario().multiply(BigDecimal.valueOf(i.getQuantidade())))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                int qtdComCusto = comCusto.stream()
                        .mapToInt(ItemVenda::getQuantidade)
                        .sum();
                custoUnitario = qtdComCusto == 0
                        ? BigDecimal.ZERO
                        : custoPonderado.divide(BigDecimal.valueOf(qtdComCusto), 2, RoundingMode.HALF_UP);
            } else {
                custoUnitario = variacao.getCustoAquisicao() != null
                        ? variacao.getCustoAquisicao()
                        : BigDecimal.ZERO;
            }
            BigDecimal custoTotal = custoUnitario.multiply(BigDecimal.valueOf(quantidadeVendida));
            BigDecimal margemBruta = faturamentoTotal.subtract(custoTotal);

            itens.add(new CmvItemResponse(
                    variacao.getProduto().getNome(),
                    variacao.getDescricao(),
                    variacao.getProduto().getCategoria().getNome(),
                    quantidadeVendida,
                    custoUnitario,
                    custoTotal,
                    faturamentoTotal,
                    margemBruta,
                    percentual(custoTotal, faturamentoTotal),
                    percentual(margemBruta, faturamentoTotal)));
        }

        itens.sort(Comparator.comparing(CmvItemResponse::custoTotal).reversed());

        BigDecimal totalFaturamento = itens.stream()
                .map(CmvItemResponse::faturamentoTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCusto = itens.stream()
                .map(CmvItemResponse::custoTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalMargemBruta = totalFaturamento.subtract(totalCusto);

        String adegaNome = null;
        if (adegaId != null) {
            adegaNome = adegaRepository.findById(adegaId)
                    .map(Adega::getNome)
                    .orElse(null);
        }

        return new CmvResponse(
                dataInicio,
                dataFim,
                adegaNome,
                itens,
                totalFaturamento,
                totalCusto,
                totalMargemBruta,
                percentual(totalCusto, totalFaturamento),
                percentual(totalMargemBruta, totalFaturamento));
    }

    /** part / whole * 100, scale 2 HALF_UP; ZERO when whole is null or zero. */
    private BigDecimal percentual(BigDecimal part, BigDecimal whole) {
        if (whole == null || whole.signum() == 0) {
            return BigDecimal.ZERO;
        }
        return part.multiply(BigDecimal.valueOf(100))
                .divide(whole, 2, RoundingMode.HALF_UP);
    }
}
