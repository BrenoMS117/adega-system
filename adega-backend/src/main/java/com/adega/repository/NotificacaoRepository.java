package com.adega.repository;

import com.adega.model.Notificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface NotificacaoRepository extends JpaRepository<Notificacao, UUID> {

    List<Notificacao> findByDestinatarioIdOrderByCreatedAtDesc(UUID destinatarioId);

    List<Notificacao> findByDestinatarioIdAndLidaFalseOrderByCreatedAtDesc(UUID destinatarioId);

    long countByDestinatarioIdAndLidaFalse(UUID destinatarioId);

    @Modifying
    @Query("UPDATE Notificacao n SET n.lida = true WHERE n.destinatario.id = :destinatarioId")
    void markAllAsRead(@Param("destinatarioId") UUID destinatarioId);
}
