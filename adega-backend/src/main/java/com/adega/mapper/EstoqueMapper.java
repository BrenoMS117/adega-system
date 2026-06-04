package com.adega.mapper;

import com.adega.dto.response.EstoqueResponse;
import com.adega.model.VariacaoProduto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EstoqueMapper {

    @Mapping(target = "variacaoId", source = "id")
    @Mapping(target = "produtoNome", source = "produto.nome")
    @Mapping(target = "variacaoDescricao", source = "descricao")
    @Mapping(target = "categoriaNome", source = "produto.categoria.nome")
    @Mapping(target = "situacao", expression = "java(computeSituacao(variacao))")
    EstoqueResponse toResponse(VariacaoProduto variacao);

    default String computeSituacao(VariacaoProduto variacao) {
        if (variacao.getEstoqueAtual() == 0) return "CRITICO";
        if (variacao.getEstoqueAtual() <= variacao.getEstoqueMinimo()) return "BAIXO";
        return "OK";
    }
}
