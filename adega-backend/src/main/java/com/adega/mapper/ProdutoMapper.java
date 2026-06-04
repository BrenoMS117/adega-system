package com.adega.mapper;

import com.adega.dto.response.ProdutoResponse;
import com.adega.dto.response.VariacaoProdutoResponse;
import com.adega.model.Produto;
import com.adega.model.VariacaoProduto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProdutoMapper {

    @Mapping(target = "categoriaNome", source = "categoria.nome")
    ProdutoResponse toResponse(Produto produto);

    @Mapping(target = "situacao", expression = "java(computeSituacao(variacao))")
    VariacaoProdutoResponse toResponse(VariacaoProduto variacao);

    default String computeSituacao(VariacaoProduto variacao) {
        if (variacao.getEstoqueAtual() == 0) return "CRITICO";
        if (variacao.getEstoqueAtual() <= variacao.getEstoqueMinimo()) return "BAIXO";
        return "OK";
    }
}
