package com.adega.repository;

import com.adega.model.ItemVenda;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ItemVendaRepository extends JpaRepository<ItemVenda, UUID> {
}
