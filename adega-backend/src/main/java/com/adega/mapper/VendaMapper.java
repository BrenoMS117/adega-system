package com.adega.mapper;

import com.adega.dto.response.ItemVendaResponse;
import com.adega.dto.response.PagamentoResponse;
import com.adega.dto.response.VendaResponse;
import com.adega.model.ItemVenda;
import com.adega.model.Pagamento;
import com.adega.model.Venda;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface VendaMapper {

    @Mapping(target = "usuarioNome", source = "usuario.nome")
    @Mapping(target = "adegaNome", source = "adega.nome")
    @Mapping(target = "status", expression = "java(venda.getStatus().name())")
    @Mapping(target = "canal", expression = "java(venda.getCanal().name())")
    VendaResponse toResponse(Venda venda);

    @Mapping(target = "produtoNome", source = "variacaoProduto.produto.nome")
    @Mapping(target = "variacaoDescricao", source = "variacaoProduto.descricao")
    ItemVendaResponse toResponse(ItemVenda item);

    @Mapping(target = "forma", expression = "java(pagamento.getForma().name())")
    PagamentoResponse toResponse(Pagamento pagamento);
}
