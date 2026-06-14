package com.adega.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificacaoResponse(
        UUID id,
        String tipo,
        String titulo,
        String mensagem,
        String remetenteNome,
        String adegaNome,
        boolean lida,
        String dadosExtras,
        LocalDateTime createdAt
) {}
