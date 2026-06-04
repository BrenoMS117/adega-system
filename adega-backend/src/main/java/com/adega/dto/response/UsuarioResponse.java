package com.adega.dto.response;

import java.util.UUID;

public record UsuarioResponse(
        UUID id,
        String nome,
        String email,
        String perfil,
        String adegaNome,
        boolean ativo
) {}
