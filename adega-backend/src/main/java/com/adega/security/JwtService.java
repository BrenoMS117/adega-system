package com.adega.security;

import com.adega.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    private static final String DEFAULT_SECRET = "minha-chave-secreta-super-longa-minimo-32-caracteres";

    @PostConstruct
    public void validateSecret() {
        if (secret == null || secret.length() < 32 || secret.equals(DEFAULT_SECRET)) {
            throw new IllegalStateException(
                    "JWT secret is too weak or is using the default value. Set a strong JWT_SECRET environment variable.");
        }
    }

    public String generateToken(Usuario usuario) {
        return Jwts.builder()
                .subject(usuario.getEmail())
                .claim("role", usuario.getPerfil().name())
                .claim("adegaId", usuario.getAdega() != null ? usuario.getAdega().getId().toString() : null)
                .claim("usuarioId", usuario.getId().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public UUID extractAdegaId(String token) {
        String value = extractClaims(token).get("adegaId", String.class);
        return value != null ? UUID.fromString(value) : null;
    }

    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }

    public UUID extractUsuarioId(String token) {
        return UUID.fromString(extractClaims(token).get("usuarioId", String.class));
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
