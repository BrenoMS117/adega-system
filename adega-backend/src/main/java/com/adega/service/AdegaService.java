package com.adega.service;

import com.adega.dto.request.AdegaRequest;
import com.adega.dto.response.AdegaResponse;
import com.adega.exception.ResourceNotFoundException;
import com.adega.model.Adega;
import com.adega.repository.AdegaRepository;
import com.adega.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdegaService {

    private final AdegaRepository adegaRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional(readOnly = true)
    public List<AdegaResponse> findAll() {
        return adegaRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdegaResponse create(AdegaRequest request) {
        Adega adega = Adega.builder()
                .nome(request.nome())
                .endereco(request.endereco())
                .cnpj(request.cnpj())
                .build();
        return toResponse(adegaRepository.save(adega));
    }

    @Transactional
    public AdegaResponse update(UUID id, AdegaRequest request) {
        Adega adega = adegaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Adega não encontrada"));
        adega.setNome(request.nome());
        adega.setEndereco(request.endereco());
        adega.setCnpj(request.cnpj());
        return toResponse(adegaRepository.save(adega));
    }

    private AdegaResponse toResponse(Adega adega) {
        int totalUsuarios = (int) usuarioRepository.countByAdegaId(adega.getId());
        return new AdegaResponse(
                adega.getId(),
                adega.getNome(),
                adega.getEndereco(),
                adega.getCnpj(),
                totalUsuarios
        );
    }
}
