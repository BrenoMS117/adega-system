package com.adega.repository;

import com.adega.model.MovimentoEstoque;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MovimentoEstoqueRepository extends JpaRepository<MovimentoEstoque, UUID> {

    @Query("SELECT m FROM MovimentoEstoque m WHERE m.variacaoProduto.id = :variacaoId ORDER BY m.dataHora DESC")
    List<MovimentoEstoque> findByVariacaoIdOrderByDataHoraDesc(@Param("variacaoId") UUID variacaoId);
}
