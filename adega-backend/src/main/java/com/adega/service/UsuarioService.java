package com.adega.service;

import com.adega.dto.request.UsuarioRequest;
import com.adega.dto.response.UsuarioResponse;
import com.adega.exception.BusinessException;
import com.adega.exception.ResourceNotFoundException;
import com.adega.model.Adega;
import com.adega.model.Usuario;
import com.adega.model.enums.PerfilUsuario;
import com.adega.repository.AdegaRepository;
import com.adega.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final AdegaRepository adegaRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UsuarioResponse> findAll(UUID adegaId) {
        List<Usuario> usuarios = adegaId != null
                ? usuarioRepository.findByAdegaId(adegaId)
                : usuarioRepository.findAll();
        return usuarios.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse findById(UUID id) {
        return toResponse(load(id));
    }

    @Transactional
    public UsuarioResponse create(UsuarioRequest request) {
        if (usuarioRepository.findByEmail(request.email()).isPresent()) {
            throw new BusinessException("Email já em uso: " + request.email());
        }

        Adega adega = resolveAdega(request);

        Usuario usuario = Usuario.builder()
                .nome(request.nome())
                .email(request.email())
                .senhaHash(passwordEncoder.encode(request.senha()))
                .perfil(request.perfil())
                .adega(adega)
                .ativo(true)
                .build();

        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse update(UUID id, UsuarioRequest request) {
        Usuario usuario = load(id);

        usuarioRepository.findByEmail(request.email()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new BusinessException("Email já em uso: " + request.email());
            }
        });

        usuario.setNome(request.nome());
        usuario.setEmail(request.email());
        usuario.setPerfil(request.perfil());
        usuario.setAdega(resolveAdega(request));

        if (request.senha() != null && !request.senha().isBlank()) {
            usuario.setSenhaHash(passwordEncoder.encode(request.senha()));
        }

        return toResponse(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse toggleStatus(UUID id) {
        Usuario usuario = load(id);
        usuario.setAtivo(!usuario.isAtivo());
        return toResponse(usuarioRepository.save(usuario));
    }

    private Usuario load(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + id));
    }

    private Adega resolveAdega(UsuarioRequest request) {
        if (request.perfil() == PerfilUsuario.DONO) {
            return null;
        }
        if (request.adegaId() == null) {
            return null;
        }
        return adegaRepository.findById(request.adegaId())
                .orElseThrow(() -> new ResourceNotFoundException("Adega não encontrada: " + request.adegaId()));
    }

    private UsuarioResponse toResponse(Usuario u) {
        return new UsuarioResponse(
                u.getId(),
                u.getNome(),
                u.getEmail(),
                u.getPerfil().name(),
                u.getAdega() != null ? u.getAdega().getNome() : null,
                u.isAtivo()
        );
    }
}
