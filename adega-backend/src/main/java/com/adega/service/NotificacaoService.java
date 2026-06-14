package com.adega.service;

import com.adega.dto.response.NotificacaoResponse;
import com.adega.exception.BusinessException;
import com.adega.exception.ResourceNotFoundException;
import com.adega.model.Adega;
import com.adega.model.Notificacao;
import com.adega.model.Usuario;
import com.adega.model.enums.TipoNotificacao;
import com.adega.repository.AdegaRepository;
import com.adega.repository.NotificacaoRepository;
import com.adega.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AdegaRepository adegaRepository;

    @Transactional
    public NotificacaoResponse criarNotificacao(
            UUID destinatarioId,
            UUID remetenteId,
            UUID adegaId,
            TipoNotificacao tipo,
            String titulo,
            String mensagem,
            String dadosExtras) {

        Usuario destinatario = usuarioRepository.findById(destinatarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + destinatarioId));

        Usuario remetente = remetenteId != null
                ? usuarioRepository.findById(remetenteId).orElse(null)
                : null;

        Adega adega = adegaId != null
                ? adegaRepository.findById(adegaId).orElse(null)
                : null;

        Notificacao notificacao = Notificacao.builder()
                .tipo(tipo.name())
                .titulo(titulo)
                .mensagem(mensagem)
                .destinatario(destinatario)
                .remetente(remetente)
                .adega(adega)
                .dadosExtras(dadosExtras)
                .build();

        return toResponse(notificacaoRepository.save(notificacao));
    }

    @Transactional
    public void criarParaTodosDonos(
            UUID remetenteId,
            UUID adegaId,
            TipoNotificacao tipo,
            String titulo,
            String mensagem,
            String dadosExtras) {

        List<Usuario> donos = usuarioRepository.findByAdegaIsNull();
        for (Usuario dono : donos) {
            criarNotificacao(dono.getId(), remetenteId, adegaId, tipo, titulo, mensagem, dadosExtras);
        }
    }

    @Transactional(readOnly = true)
    public List<NotificacaoResponse> listarMinhas(UUID usuarioId) {
        return notificacaoRepository.findByDestinatarioIdOrderByCreatedAtDesc(usuarioId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long contarNaoLidas(UUID usuarioId) {
        return notificacaoRepository.countByDestinatarioIdAndLidaFalse(usuarioId);
    }

    @Transactional
    public NotificacaoResponse marcarComoLida(UUID notificacaoId, UUID usuarioId) {
        Notificacao notificacao = notificacaoRepository.findById(notificacaoId)
                .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada: " + notificacaoId));

        if (!notificacao.getDestinatario().getId().equals(usuarioId)) {
            throw new BusinessException("Acesso negado: notificação não pertence ao usuário");
        }

        notificacao.setLida(true);
        return toResponse(notificacaoRepository.save(notificacao));
    }

    @Transactional
    public void marcarTodasComoLidas(UUID usuarioId) {
        notificacaoRepository.markAllAsRead(usuarioId);
    }

    @Transactional
    public void solicitarReaberturaCaixa(UUID solicitanteId, UUID adegaId, String motivo) {
        Usuario solicitante = usuarioRepository.findById(solicitanteId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + solicitanteId));

        Adega adega = adegaRepository.findById(adegaId)
                .orElseThrow(() -> new ResourceNotFoundException("Adega não encontrada: " + adegaId));

        String titulo = "Solicitação de reabertura de caixa";
        String mensagem = solicitante.getNome() + " solicitou a reabertura do caixa da "
                + adega.getNome() + ". Motivo: " + motivo;
        String dadosExtras = "{\"adegaId\":\"" + adegaId + "\"}";

        criarParaTodosDonos(solicitanteId, adegaId,
                TipoNotificacao.SOLICITACAO_REABERTURA_CAIXA, titulo, mensagem, dadosExtras);

        criarNotificacao(solicitanteId, solicitanteId, adegaId, TipoNotificacao.SISTEMA,
                "Solicitação enviada",
                "Sua solicitação de reabertura foi enviada ao responsável.",
                null);
    }

    private NotificacaoResponse toResponse(Notificacao n) {
        return new NotificacaoResponse(
                n.getId(),
                n.getTipo(),
                n.getTitulo(),
                n.getMensagem(),
                n.getRemetente() != null ? n.getRemetente().getNome() : null,
                n.getAdega() != null ? n.getAdega().getNome() : null,
                n.isLida(),
                n.getDadosExtras(),
                n.getCreatedAt()
        );
    }
}
