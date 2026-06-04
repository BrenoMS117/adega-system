package com.adega.repository;

import com.adega.model.VariacaoProduto;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VariacaoProdutoRepository extends JpaRepository<VariacaoProduto, UUID> {

    List<VariacaoProduto> findByProdutoId(UUID produtoId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM VariacaoProduto v WHERE v.id = :id")
    Optional<VariacaoProduto> findByIdWithPessimisticLock(@Param("id") UUID id);
}
