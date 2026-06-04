package com.adega.repository;

import com.adega.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmail(String email);

    List<Usuario> findByAdegaId(UUID adegaId);

    List<Usuario> findByAdegaIsNull();

    long countByAdegaId(UUID adegaId);
}
