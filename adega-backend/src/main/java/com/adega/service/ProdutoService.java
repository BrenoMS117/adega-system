package com.adega.service;

import com.adega.dto.request.ProdutoRequest;
import com.adega.dto.request.VariacaoProdutoRequest;
import com.adega.dto.response.ProdutoResponse;
import com.adega.dto.response.VariacaoProdutoResponse;
import com.adega.exception.ResourceNotFoundException;
import com.adega.model.Categoria;
import com.adega.model.Produto;
import com.adega.model.VariacaoProduto;
import com.adega.repository.CategoriaRepository;
import com.adega.repository.ProdutoRepository;
import com.adega.repository.VariacaoProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProdutoService {

    private final ProdutoRepository produtoRepository;
    private final CategoriaRepository categoriaRepository;
    private final VariacaoProdutoRepository variacaoProdutoRepository;

    @Transactional(readOnly = true)
    public List<ProdutoResponse> findAll(UUID categoriaId, Boolean ativo) {
        List<Produto> produtos;

        if (categoriaId != null && ativo != null) {
            produtos = produtoRepository.findByCategoriaIdAndAtivo(categoriaId, ativo);
        } else if (ativo != null) {
            produtos = produtoRepository.findByAtivo(ativo);
        } else if (categoriaId != null) {
            produtos = produtoRepository.findByCategoriaIdAndAtivo(categoriaId, true);
        } else {
            produtos = produtoRepository.findAll();
        }

        return produtos.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProdutoResponse findById(UUID id) {
        return toResponse(load(id));
    }

    @Transactional
    public ProdutoResponse create(ProdutoRequest request) {
        Categoria categoria = loadCategoria(request.categoriaId());

        Produto produto = Produto.builder()
                .categoria(categoria)
                .nome(request.nome())
                .descricao(request.descricao())
                .ativo(request.ativo())
                .build();

        if (request.variacoes() != null) {
            request.variacoes().forEach(vReq -> produto.getVariacoes().add(buildVariacao(vReq, produto)));
        }

        return toResponse(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponse update(UUID id, ProdutoRequest request) {
        Produto produto = load(id);
        Categoria categoria = loadCategoria(request.categoriaId());

        produto.setNome(request.nome());
        produto.setDescricao(request.descricao());
        produto.setAtivo(request.ativo());
        produto.setCategoria(categoria);

        if (request.variacoes() != null) {
            request.variacoes().forEach(vReq -> produto.getVariacoes().add(buildVariacao(vReq, produto)));
        }

        return toResponse(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponse toggleStatus(UUID id) {
        Produto produto = load(id);
        produto.setAtivo(!produto.isAtivo());
        return toResponse(produtoRepository.save(produto));
    }

    @Transactional
    public ProdutoResponse addVariacao(UUID produtoId, VariacaoProdutoRequest request) {
        Produto produto = load(produtoId);
        produto.getVariacoes().add(buildVariacao(request, produto));
        return toResponse(produtoRepository.save(produto));
    }

    @Transactional
    public VariacaoProdutoResponse updateVariacao(UUID variacaoId, VariacaoProdutoRequest request) {
        VariacaoProduto variacao = variacaoProdutoRepository.findById(variacaoId)
                .orElseThrow(() -> new ResourceNotFoundException("Variação não encontrada: " + variacaoId));

        variacao.setDescricao(request.descricao());
        variacao.setPrecoVenda(request.precoVenda());
        if (request.custoAquisicao() != null) variacao.setCustoAquisicao(request.custoAquisicao());
        if (request.estoqueAtual() != null) variacao.setEstoqueAtual(request.estoqueAtual());
        if (request.estoqueMinimo() != null) variacao.setEstoqueMinimo(request.estoqueMinimo());

        return toVariacaoResponse(variacaoProdutoRepository.save(variacao));
    }

    private Produto load(UUID id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado: " + id));
    }

    private Categoria loadCategoria(UUID categoriaId) {
        return categoriaRepository.findById(categoriaId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada: " + categoriaId));
    }

    private VariacaoProduto buildVariacao(VariacaoProdutoRequest req, Produto produto) {
        return VariacaoProduto.builder()
                .produto(produto)
                .descricao(req.descricao())
                .precoVenda(req.precoVenda())
                .custoAquisicao(req.custoAquisicao() != null ? req.custoAquisicao() : req.precoVenda())
                .estoqueAtual(req.estoqueAtual() != null ? req.estoqueAtual() : 0)
                .estoqueMinimo(req.estoqueMinimo() != null ? req.estoqueMinimo() : 0)
                .build();
    }

    ProdutoResponse toResponse(Produto p) {
        List<VariacaoProdutoResponse> variacoes = p.getVariacoes().stream()
                .map(this::toVariacaoResponse)
                .toList();
        return new ProdutoResponse(
                p.getId(),
                p.getNome(),
                p.getDescricao(),
                p.getCategoria().getNome(),
                p.isAtivo(),
                variacoes
        );
    }

    VariacaoProdutoResponse toVariacaoResponse(VariacaoProduto v) {
        return new VariacaoProdutoResponse(
                v.getId(),
                v.getDescricao(),
                v.getPrecoVenda(),
                v.getCustoAquisicao(),
                v.getEstoqueAtual(),
                v.getEstoqueMinimo(),
                computeSituacao(v)
        );
    }

    static String computeSituacao(VariacaoProduto v) {
        if (v.getEstoqueAtual() == 0) return "CRITICO";
        if (v.getEstoqueAtual() <= v.getEstoqueMinimo()) return "BAIXO";
        return "OK";
    }
}
