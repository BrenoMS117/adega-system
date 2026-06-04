package com.adega.repository;

import com.adega.model.FechamentoCaixa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FechamentoCaixaRepository extends JpaRepository<FechamentoCaixa, UUID> {

    Optional<FechamentoCaixa> findByAdegaIdAndData(UUID adegaId, LocalDate data);

    List<FechamentoCaixa> findByAdegaIdOrderByDataDesc(UUID adegaId);
}
