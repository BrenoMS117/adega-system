package com.adega.repository;

import com.adega.model.Adega;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AdegaRepository extends JpaRepository<Adega, UUID> {
}
