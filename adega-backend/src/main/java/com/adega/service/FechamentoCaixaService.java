package com.adega.service;

import com.adega.dto.request.FechamentoCaixaRequest;
import com.adega.dto.response.FechamentoCaixaResponse;
import com.adega.exception.BusinessException;
import com.adega.exception.ResourceNotFoundException;
import com.adega.model.Adega;
import com.adega.model.FechamentoCaixa;
import com.adega.model.Pagamento;
import com.adega.model.Usuario;
import com.adega.model.Venda;
import com.adega.model.enums.FormaPagamento;
import com.adega.model.enums.StatusVenda;
import com.adega.repository.AdegaRepository;
import com.adega.repository.FechamentoCaixaRepository;
import com.adega.repository.UsuarioRepository;
import com.adega.repository.VendaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FechamentoCaixaService {

    private static final ZoneId BRAZIL_ZONE = ZoneId.of("America/Sao_Paulo");

    private final FechamentoCaixaRepository fechamentoCaixaRepository;
    private final VendaRepository vendaRepository;
    private final AdegaRepository adegaRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public FechamentoCaixaResponse fechar(FechamentoCaixaRequest request, UUID usuarioId) {
        LocalDate hoje = LocalDate.now(BRAZIL_ZONE);

        java.util.Optional<FechamentoCaixa> existente =
                fechamentoCaixaRepository.findByAdegaIdAndData(request.adegaId(), hoje);

        if (existente.isPresent() && !existente.get().isReaberto()) {
            throw new BusinessException("Caixa já foi fechado hoje para esta adega");
        }

        Adega adega = adegaRepository.findById(request.adegaId())
                .orElseThrow(() -> new ResourceNotFoundException("Adega não encontrada: " + request.adegaId()));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + usuarioId));

        Aggregates agg = aggregate(request.adegaId(), hoje);
        BigDecimal dinheiroSistema = agg.totalDinheiro;
        BigDecimal diferenca = request.dinheiroContado().subtract(dinheiroSistema);

        if (existente.isPresent()) {
            // Caixa was reopened — update in place and seal again
            FechamentoCaixa f = existente.get();
            f.setUsuario(usuario);
            f.setTotalVendas(agg.totalVendas);
            f.setTotalFaturamento(agg.totalFaturamento);
            f.setTotalDinheiro(agg.totalDinheiro);
            f.setTotalPix(agg.totalPix);
            f.setTotalCartao(agg.totalCartao);
            f.setTotalBeneficio(agg.totalBeneficio);
            f.setTotalDescontos(agg.totalDescontos);
            f.setDinheiroSistema(dinheiroSistema);
            f.setDinheiroContado(request.dinheiroContado());
            f.setDiferenca(diferenca);
            f.setObservacao(request.observacao());
            f.setReaberto(false);
            f.setReabertoFor(null);
            f.setReabertoEm(null);
            return toResponse(fechamentoCaixaRepository.save(f));
        }

        FechamentoCaixa fechamento = FechamentoCaixa.builder()
                .adega(adega)
                .usuario(usuario)
                .data(hoje)
                .totalVendas(agg.totalVendas)
                .totalFaturamento(agg.totalFaturamento)
                .totalDinheiro(agg.totalDinheiro)
                .totalPix(agg.totalPix)
                .totalCartao(agg.totalCartao)
                .totalBeneficio(agg.totalBeneficio)
                .totalDescontos(agg.totalDescontos)
                .dinheiroSistema(dinheiroSistema)
                .dinheiroContado(request.dinheiroContado())
                .diferenca(diferenca)
                .observacao(request.observacao())
                .build();

        return toResponse(fechamentoCaixaRepository.save(fechamento));
    }

    @Transactional
    public FechamentoCaixaResponse reabrir(UUID adegaId, UUID usuarioId) {
        FechamentoCaixa fechamento = fechamentoCaixaRepository
                .findByAdegaIdAndData(adegaId, LocalDate.now(BRAZIL_ZONE))
                .orElseThrow(() -> new BusinessException("Nenhum fechamento encontrado para hoje"));

        if (fechamento.isReaberto()) {
            throw new BusinessException("Caixa já está aberto");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + usuarioId));

        fechamento.setReaberto(true);
        fechamento.setReabertoFor(usuario);
        fechamento.setReabertoEm(LocalDateTime.now());

        return toResponse(fechamentoCaixaRepository.save(fechamento));
    }

    @Transactional(readOnly = true)
    public FechamentoCaixaResponse getCaixaAberto(UUID adegaId) {
        LocalDate hoje = LocalDate.now(BRAZIL_ZONE);

        java.util.Optional<FechamentoCaixa> opt =
                fechamentoCaixaRepository.findByAdegaIdAndData(adegaId, hoje);

        // Closed and not reopened → return the stored record (id set signals "closed")
        if (opt.isPresent() && !opt.get().isReaberto()) {
            return toResponse(opt.get());
        }

        // Not found or reopened → return live aggregates (id=null signals "open")
        Adega adega = adegaRepository.findById(adegaId)
                .orElseThrow(() -> new ResourceNotFoundException("Adega não encontrada: " + adegaId));
        Aggregates agg = aggregate(adegaId, hoje);
        return new FechamentoCaixaResponse(
                null,
                hoje,
                adega.getNome(),
                null,
                agg.totalVendas,
                agg.totalFaturamento,
                agg.totalDinheiro,
                agg.totalPix,
                agg.totalCartao,
                agg.totalBeneficio,
                agg.totalDescontos,
                agg.totalDinheiro,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                null,
                false,
                null,
                null
        );
    }

    @Transactional(readOnly = true)
    public List<FechamentoCaixaResponse> getHistorico(UUID adegaId) {
        return fechamentoCaixaRepository.findByAdegaIdOrderByDataDesc(adegaId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private Aggregates aggregate(UUID adegaId, LocalDate data) {
        LocalDateTime start = data.atStartOfDay(BRAZIL_ZONE)
                .withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();
        LocalDateTime end = ZonedDateTime.of(data, LocalTime.of(23, 59, 59), BRAZIL_ZONE)
                .withZoneSameInstant(ZoneId.of("UTC")).toLocalDateTime();

        List<Venda> vendas = vendaRepository
                .findByAdegaIdAndDataHoraBetween(adegaId, start, end)
                .stream()
                .filter(v -> v.getStatus() == StatusVenda.CONCLUIDA)
                .toList();

        BigDecimal totalFaturamento = BigDecimal.ZERO;
        BigDecimal totalDinheiro = BigDecimal.ZERO;
        BigDecimal totalPix = BigDecimal.ZERO;
        BigDecimal totalCartao = BigDecimal.ZERO;
        BigDecimal totalBeneficio = BigDecimal.ZERO;
        BigDecimal totalDescontos = BigDecimal.ZERO;

        for (Venda v : vendas) {
            totalFaturamento = totalFaturamento.add(v.getTotalLiquido());
            totalDescontos = totalDescontos.add(v.getTotalDesconto());
            for (Pagamento p : v.getPagamentos()) {
                switch (p.getForma()) {
                    case DINHEIRO -> totalDinheiro = totalDinheiro.add(p.getValor());
                    case PIX -> totalPix = totalPix.add(p.getValor());
                    case DEBITO, CREDITO -> totalCartao = totalCartao.add(p.getValor());
                    case VALE -> totalBeneficio = totalBeneficio.add(p.getValor());
                }
            }
        }

        return new Aggregates(vendas.size(), totalFaturamento,
                totalDinheiro, totalPix, totalCartao, totalBeneficio, totalDescontos);
    }

    private record Aggregates(
            int totalVendas,
            BigDecimal totalFaturamento,
            BigDecimal totalDinheiro,
            BigDecimal totalPix,
            BigDecimal totalCartao,
            BigDecimal totalBeneficio,
            BigDecimal totalDescontos
    ) {}

    private FechamentoCaixaResponse toResponse(FechamentoCaixa f) {
        return new FechamentoCaixaResponse(
                f.getId(),
                f.getData(),
                f.getAdega().getNome(),
                f.getUsuario().getNome(),
                f.getTotalVendas(),
                f.getTotalFaturamento(),
                f.getTotalDinheiro(),
                f.getTotalPix(),
                f.getTotalCartao(),
                f.getTotalBeneficio(),
                f.getTotalDescontos(),
                f.getDinheiroSistema(),
                f.getDinheiroContado(),
                f.getDiferenca(),
                f.getObservacao(),
                f.isReaberto(),
                f.getReabertoFor() != null ? f.getReabertoFor().getNome() : null,
                f.getReabertoEm()
        );
    }
}
