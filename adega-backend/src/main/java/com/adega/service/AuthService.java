package com.adega.service;

import com.adega.dto.request.LoginRequest;
import com.adega.dto.response.LoginResponse;
import com.adega.exception.BusinessException;
import com.adega.repository.UsuarioRepository;
import com.adega.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        var usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException("Email ou senha inválidos"));

        if (!usuario.isAtivo()) {
            throw new BusinessException("Usuário inativo");
        }

        if (!passwordEncoder.matches(request.senha(), usuario.getSenhaHash())) {
            throw new BusinessException("Email ou senha inválidos");
        }

        String token = jwtService.generateToken(usuario);

        return new LoginResponse(
                token,
                usuario.getNome(),
                usuario.getPerfil().name(),
                usuario.getAdega() != null ? usuario.getAdega().getId() : null,
                usuario.getId()
        );
    }
}
