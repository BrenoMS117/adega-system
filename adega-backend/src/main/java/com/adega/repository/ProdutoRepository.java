package com.adega.repository;

import com.adega.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProdutoRepository extends JpaRepository<Produto, UUID> {

    List<Produto> findByCategoriaIdAndAtivo(UUID categoriaId, boolean ativo);

    List<Produto> findByAtivo(boolean ativo);

    long countByCategoriaId(UUID categoriaId);
}
