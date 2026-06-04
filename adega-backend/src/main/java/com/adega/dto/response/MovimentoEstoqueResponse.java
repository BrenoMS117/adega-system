package com.adega.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record MovimentoEstoqueResponse(
        UUID id,
        String tipo,
        Integer quantidade,
        LocalDateTime dataHora,
        String observacao,
        String usuarioNome,
        UUID vendaId
) {}
