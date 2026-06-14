package com.adega.service;

import com.adega.dto.request.VendaRequest;
import com.adega.dto.response.ItemVendaResponse;
import com.adega.dto.response.PagamentoResponse;
import com.adega.dto.response.VendaResponse;
import com.adega.exception.BusinessException;
import com.adega.exception.ResourceNotFoundException;
import com.adega.model.*;
import com.adega.model.enums.CanalVenda;
import com.adega.model.enums.StatusVenda;
import com.adega.model.enums.TipoMovimento;
import com.adega.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VendaService {

    private final VendaRepository vendaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AdegaRepository adegaRepository;
    private final VariacaoProdutoRepository variacaoProdutoRepository;
    private final MovimentoEstoqueRepository movimentoEstoqueRepository;
    private final com.adega.repository.FechamentoCaixaRepository fechamentoCaixaRepository;

    @Transactional
    public VendaResponse create(VendaRequest request, UUID usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + usuarioId));

        Adega adega = adegaRepository.findById(request.adegaId())
                .orElseThrow(() -> new ResourceNotFoundException("Adega não encontrada: " + request.adegaId()));

        fechamentoCaixaRepository.findByAdegaIdAndData(adega.getId(), LocalDate.now(ZoneId.of("America/Sao_Paulo")))
                .ifPresent(f -> {
                    if (!f.isReaberto()) {
                        throw new BusinessException(
                                "Caixa fechado. Solicite ao responsável para reabrir o caixa antes de realizar novas vendas.");
                    }
                });

        BigDecimal totalBruto = BigDecimal.ZERO;
        BigDecimal totalDesconto = BigDecimal.ZERO;
        List<VariacaoProduto> variacoes = new ArrayList<>();
        List<ItemVenda> itens = new ArrayList<>();

        for (var itemReq : request.itens()) {
            VariacaoProduto variacao = variacaoProdutoRepository
                    .findByIdWithPessimisticLock(itemReq.variacaoId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Variação não encontrada: " + itemReq.variacaoId()));

            if (variacao.getEstoqueAtual() < itemReq.quantidade()) {
                throw new BusinessException("Estoque insuficiente: "
                        + variacao.getProduto().getNome() + " - " + variacao.getDescricao()
                        + " (disponível: " + variacao.getEstoqueAtual() + ")");
            }

            BigDecimal desconto = itemReq.descontoValor() != null
                    ? itemReq.descontoValor() : BigDecimal.ZERO;
            BigDecimal brutoItem = variacao.getPrecoVenda()
                    .multiply(BigDecimal.valueOf(itemReq.quantidade()));

            totalBruto = totalBruto.add(brutoItem);
            totalDesconto = totalDesconto.add(desconto);

            itens.add(ItemVenda.builder()
                    .variacaoProduto(variacao)
                    .quantidade(itemReq.quantidade())
                    .precoUnitario(variacao.getPrecoVenda())
                    .custoUnitario(variacao.getCustoAquisicao())
                    .descontoValor(desconto)
                    .subtotal(brutoItem.subtract(desconto))
                    .build());

            variacoes.add(variacao);
        }

        BigDecimal totalLiquido = totalBruto.subtract(totalDesconto);

        BigDecimal totalPago = request.pagamentos().stream()
                .map(p -> p.valor())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalPago.subtract(totalLiquido).abs().compareTo(new BigDecimal("0.01")) > 0) {
            throw new BusinessException(
                    "Soma dos pagamentos (" + totalPago + ") difere do total líquido (" + totalLiquido + ")");
        }

        Venda venda = Venda.builder()
                .adega(adega)
                .usuario(usuario)
                .dataHora(LocalDateTime.now())
                .status(StatusVenda.CONCLUIDA)
                .canal(request.canal())
                .totalBruto(totalBruto)
                .totalDesconto(totalDesconto)
                .totalLiquido(totalLiquido)
                .build();

        itens.forEach(item -> {
            item.setVenda(venda);
            venda.getItens().add(item);
        });

        request.pagamentos().forEach(pagReq -> {
            Pagamento pagamento = Pagamento.builder()
                    .venda(venda)
                    .forma(pagReq.forma())
                    .valor(pagReq.valor())
                    .build();
            venda.getPagamentos().add(pagamento);
        });

        Venda saved = vendaRepository.save(venda);

        for (int i = 0; i < variacoes.size(); i++) {
            VariacaoProduto variacao = variacoes.get(i);
            int quantidade = itens.get(i).getQuantidade();

            variacao.setEstoqueAtual(variacao.getEstoqueAtual() - quantidade);
            variacaoProdutoRepository.save(variacao);

            movimentoEstoqueRepository.save(MovimentoEstoque.builder()
                    .variacaoProduto(variacao)
                    .usuario(usuario)
                    .venda(saved)
                    .tipo(TipoMovimento.VENDA)
                    .quantidade(quantidade)
                    .dataHora(LocalDateTime.now())
                    .build());
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<VendaResponse> findAll(
            UUID adegaId,
            LocalDateTime dataInicio,
            LocalDateTime dataFim,
            StatusVenda status,
            CanalVenda canal,
            UUID usuarioId) {

        return vendaRepository
                .findWithFilters(adegaId, dataInicio, dataFim, status, canal, usuarioId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public VendaResponse findById(UUID id) {
        return toResponse(load(id));
    }

    @Transactional
    public VendaResponse cancel(UUID id, UUID usuarioId) {
        Venda venda = load(id);

        if (venda.getStatus() == StatusVenda.CANCELADA) {
            throw new BusinessException("Venda já está cancelada");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + usuarioId));

        venda.setStatus(StatusVenda.CANCELADA);

        for (ItemVenda item : venda.getItens()) {
            VariacaoProduto variacao = item.getVariacaoProduto();
            variacao.setEstoqueAtual(variacao.getEstoqueAtual() + item.getQuantidade());
            variacaoProdutoRepository.save(variacao);

            movimentoEstoqueRepository.save(MovimentoEstoque.builder()
                    .variacaoProduto(variacao)
                    .usuario(usuario)
                    .venda(venda)
                    .tipo(TipoMovimento.AJUSTE)
                    .quantidade(item.getQuantidade())
                    .dataHora(LocalDateTime.now())
                    .observacao("Cancelamento venda #" + id)
                    .build());
        }

        return toResponse(vendaRepository.save(venda));
    }

    private Venda load(UUID id) {
        return vendaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venda não encontrada: " + id));
    }

    VendaResponse toResponse(Venda v) {
        List<ItemVendaResponse> itens = v.getItens().stream()
                .map(i -> new ItemVendaResponse(
                        i.getId(),
                        i.getVariacaoProduto().getProduto().getNome(),
                        i.getVariacaoProduto().getDescricao(),
                        i.getQuantidade(),
                        i.getPrecoUnitario(),
                        i.getDescontoValor(),
                        i.getSubtotal(),
                        i.getCustoUnitario()
                ))
                .toList();

        List<PagamentoResponse> pagamentos = v.getPagamentos().stream()
                .map(p -> new PagamentoResponse(p.getId(), p.getForma().name(), p.getValor()))
                .toList();

        return new VendaResponse(
                v.getId(),
                v.getUsuario().getNome(),
                v.getAdega().getNome(),
                v.getDataHora(),
                v.getStatus().name(),
                v.getCanal().name(),
                v.getTotalBruto(),
                v.getTotalDesconto(),
                v.getTotalLiquido(),
                itens,
                pagamentos
        );
    }
}
