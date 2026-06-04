package com.adega.repository;

import com.adega.model.Venda;
import com.adega.model.enums.CanalVenda;
import com.adega.model.enums.StatusVenda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface VendaRepository extends JpaRepository<Venda, UUID> {

    List<Venda> findByAdegaIdAndDataHoraBetween(UUID adegaId, LocalDateTime start, LocalDateTime end);

    List<Venda> findByUsuarioIdAndDataHoraBetween(UUID usuarioId, LocalDateTime start, LocalDateTime end);

    @Query("""
        SELECT v FROM Venda v
        WHERE (:adegaId IS NULL OR v.adega.id = :adegaId)
        AND v.dataHora >= :dataInicio
        AND v.dataHora <= :dataFim
        AND (:status IS NULL OR v.status = :status)
        AND (:canal IS NULL OR v.canal = :canal)
        AND (:usuarioId IS NULL OR v.usuario.id = :usuarioId)
        ORDER BY v.dataHora DESC
    """)
    List<Venda> findWithFilters(
            @Param("adegaId") UUID adegaId,
            @Param("dataInicio") LocalDateTime dataInicio,
            @Param("dataFim") LocalDateTime dataFim,
            @Param("status") StatusVenda status,
            @Param("canal") CanalVenda canal,
            @Param("usuarioId") UUID usuarioId
    );
}
