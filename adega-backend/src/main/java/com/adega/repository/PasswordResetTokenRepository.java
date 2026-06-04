package com.adega.repository;

import com.adega.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByToken(String token);

    void deleteByUsuarioId(UUID usuarioId);

    void deleteByExpiresAtBefore(LocalDateTime now);
}
