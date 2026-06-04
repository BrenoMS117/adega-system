package com.adega.service;

import com.adega.exception.BusinessException;
import com.adega.exception.ResourceNotFoundException;
import com.adega.model.PasswordResetToken;
import com.adega.repository.PasswordResetTokenRepository;
import com.adega.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class PasswordResetService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public void requestReset(String email) {
        usuarioRepository.findByEmail(email).ifPresent(usuario -> {
            tokenRepository.deleteByUsuarioId(usuario.getId());

            String token = UUID.randomUUID().toString().replace("-", "");

            tokenRepository.save(PasswordResetToken.builder()
                    .usuario(usuario)
                    .token(token)
                    .expiresAt(LocalDateTime.now().plusHours(1))
                    .build());

            emailService.sendPasswordResetEmail(usuario.getEmail(), usuario.getNome(), token);
        });
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Token inválido ou expirado"));

        if (resetToken.isUsed()) {
            throw new BusinessException("Token já utilizado");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Token expirado. Solicite um novo link.");
        }

        if (newPassword == null || newPassword.length() < 6) {
            throw new BusinessException("Senha deve ter no mínimo 6 caracteres");
        }

        var usuario = resetToken.getUsuario();
        usuario.setSenhaHash(passwordEncoder.encode(newPassword));
        usuarioRepository.save(usuario);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
    }

    @Scheduled(cron = "0 0 * * * *")
    public void cleanupExpiredTokens() {
        tokenRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
}
