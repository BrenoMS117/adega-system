package com.adega.service;

import com.adega.dto.request.AjusteEstoqueRequest;
import com.adega.dto.request.EntradaEstoqueRequest;
import com.adega.dto.response.EstoqueResponse;
import com.adega.dto.response.MovimentoEstoqueResponse;
import com.adega.exception.ResourceNotFoundException;
import com.adega.model.MovimentoEstoque;
import com.adega.model.Usuario;
import com.adega.model.VariacaoProduto;
import com.adega.model.enums.TipoMovimento;
import com.adega.model.enums.TipoNotificacao;
import com.adega.repository.MovimentoEstoqueRepository;
import com.adega.repository.UsuarioRepository;
import com.adega.repository.VariacaoProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EstoqueService {

    private final VariacaoProdutoRepository variacaoProdutoRepository;
    private final MovimentoEstoqueRepository movimentoEstoqueRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacaoService notificacaoService;

    @Transactional(readOnly = true)
    public List<EstoqueResponse> findAll(UUID adegaId, UUID categoriaId, String situacao) {
        List<VariacaoProduto> variacoes = variacaoProdutoRepository.findAll();

        var stream = variacoes.stream();

        if (categoriaId != null) {
            stream = stream.filter(v -> v.getProduto().getCategoria().getId().equals(categoriaId));
        }

        if (situacao != null && !situacao.isBlank()) {
            stream = stream.filter(v -> ProdutoService.computeSituacao(v).equalsIgnoreCase(situacao));
        }

        return stream.map(this::toEstoqueResponse).toList();
    }

    @Transactional
    public MovimentoEstoqueResponse registrarEntrada(EntradaEstoqueRequest request, UUID usuarioId) {
        VariacaoProduto variacao = loadVariacao(request.variacaoId());
        Usuario usuario = loadUsuario(usuarioId);

        int estoqueAnterior = variacao.getEstoqueAtual();

        variacao.setEstoqueAtual(variacao.getEstoqueAtual() + request.quantidade());
        if (request.custoAquisicao() != null) {
            variacao.setCustoAquisicao(request.custoAquisicao());
        }
        variacaoProdutoRepository.save(variacao);

        if (variacao.getEstoqueAtual() > variacao.getEstoqueMinimo()
                && estoqueAnterior <= variacao.getEstoqueMinimo()) {
            String produtoNome = variacao.getProduto().getNome() + " · " + variacao.getDescricao();
            notificacaoService.criarParaTodosDonos(
                    null,
                    null,
                    TipoNotificacao.SISTEMA,
                    "Estoque reabastecido",
                    "Estoque reabastecido: " + produtoNome + " agora tem "
                            + variacao.getEstoqueAtual() + " unidades.",
                    null
            );
        }

        MovimentoEstoque movimento = movimentoEstoqueRepository.save(MovimentoEstoque.builder()
                .variacaoProduto(variacao)
                .usuario(usuario)
                .tipo(TipoMovimento.COMPRA)
                .quantidade(request.quantidade())
                .dataHora(LocalDateTime.now())
                .observacao(request.observacao())
                .build());

        return toMovimentoResponse(movimento);
    }

    @Transactional
    public MovimentoEstoqueResponse ajusteManual(AjusteEstoqueRequest request, UUID usuarioId) {
        VariacaoProduto variacao = loadVariacao(request.variacaoId());
        Usuario usuario = loadUsuario(usuarioId);

        variacao.setEstoqueAtual(request.novaQuantidade());
        variacaoProdutoRepository.save(variacao);

        MovimentoEstoque movimento = movimentoEstoqueRepository.save(MovimentoEstoque.builder()
                .variacaoProduto(variacao)
                .usuario(usuario)
                .tipo(TipoMovimento.AJUSTE)
                .quantidade(request.novaQuantidade())
                .dataHora(LocalDateTime.now())
                .observacao(request.observacao())
                .build());

        return toMovimentoResponse(movimento);
    }

    @Transactional(readOnly = true)
    public List<MovimentoEstoqueResponse> getHistorico(UUID variacaoId) {
        return movimentoEstoqueRepository.findByVariacaoIdOrderByDataHoraDesc(variacaoId)
                .stream()
                .map(this::toMovimentoResponse)
                .toList();
    }

    private VariacaoProduto loadVariacao(UUID id) {
        return variacaoProdutoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Variação não encontrada: " + id));
    }

    private Usuario loadUsuario(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + id));
    }

    EstoqueResponse toEstoqueResponse(VariacaoProduto v) {
        return new EstoqueResponse(
                v.getId(),
                v.getProduto().getNome(),
                v.getDescricao(),
                v.getEstoqueAtual(),
                v.getEstoqueMinimo(),
                ProdutoService.computeSituacao(v),
                v.getCustoAquisicao(),
                v.getProduto().getCategoria().getNome()
        );
    }

    private MovimentoEstoqueResponse toMovimentoResponse(MovimentoEstoque m) {
        return new MovimentoEstoqueResponse(
                m.getId(),
                m.getTipo().name(),
                m.getQuantidade(),
                m.getDataHora(),
                m.getObservacao(),
                m.getUsuario().getNome(),
                m.getVenda() != null ? m.getVenda().getId() : null
        );
    }
}
