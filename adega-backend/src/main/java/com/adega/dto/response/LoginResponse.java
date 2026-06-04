package com.adega.dto.response;

import java.util.UUID;

public record LoginResponse(
        String token,
        String nome,
        String perfil,
        UUID adegaId,
        UUID usuarioId
) {}
