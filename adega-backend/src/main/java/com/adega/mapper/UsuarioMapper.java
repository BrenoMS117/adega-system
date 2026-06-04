package com.adega.mapper;

import com.adega.dto.response.UsuarioResponse;
import com.adega.model.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    @Mapping(target = "perfil", expression = "java(usuario.getPerfil().name())")
    @Mapping(target = "adegaNome", source = "adega.nome")
    UsuarioResponse toResponse(Usuario usuario);
}
