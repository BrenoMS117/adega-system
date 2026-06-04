package com.adega.dto.request;

import com.adega.model.enums.PerfilUsuario;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record UsuarioRequest(
        @NotBlank String nome,
        @NotBlank String email,
        String senha,
        @NotNull PerfilUsuario perfil,
        UUID adegaId
) {}
