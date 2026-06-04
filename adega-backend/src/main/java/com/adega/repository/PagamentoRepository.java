package com.adega.repository;

import com.adega.model.Pagamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PagamentoRepository extends JpaRepository<Pagamento, UUID> {

    List<Pagamento> findByVendaId(UUID vendaId);
}
