package com.adega.controller;

import com.adega.dto.request.SolicitacaoReaberturaRequest;
import com.adega.dto.response.NotificacaoResponse;
import com.adega.service.NotificacaoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notificacoes")
@RequiredArgsConstructor
public class NotificacaoController {

    private final NotificacaoService notificacaoService;

    @GetMapping
    public List<NotificacaoResponse> listarMinhas(HttpServletRequest request) {
        UUID usuarioId = (UUID) request.getAttribute("usuarioId");
        return notificacaoService.listarMinhas(usuarioId);
    }

    @GetMapping("/nao-lidas/count")
    public Map<String, Long> contarNaoLidas(HttpServletRequest request) {
        UUID usuarioId = (UUID) request.getAttribute("usuarioId");
        return Map.of("count", notificacaoService.contarNaoLidas(usuarioId));
    }

    @PatchMapping("/{id}/lida")
    public NotificacaoResponse marcarComoLida(
            @PathVariable UUID id,
            HttpServletRequest request) {
        UUID usuarioId = (UUID) request.getAttribute("usuarioId");
        return notificacaoService.marcarComoLida(id, usuarioId);
    }

    @PatchMapping("/marcar-todas-lidas")
    public ResponseEntity<Void> marcarTodasComoLidas(HttpServletRequest request) {
        UUID usuarioId = (UUID) request.getAttribute("usuarioId");
        notificacaoService.marcarTodasComoLidas(usuarioId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/solicitar-reabertura")
    public ResponseEntity<Map<String, String>> solicitarReabertura(
            @RequestBody @Valid SolicitacaoReaberturaRequest body,
            HttpServletRequest request) {
        UUID usuarioId = (UUID) request.getAttribute("usuarioId");
        notificacaoService.solicitarReaberturaCaixa(usuarioId, body.adegaId(), body.motivo());
        return ResponseEntity.ok(Map.of("message", "Solicitação enviada com sucesso."));
    }
}
