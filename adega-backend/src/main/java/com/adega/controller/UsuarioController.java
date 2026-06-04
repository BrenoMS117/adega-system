package com.adega.controller;

import com.adega.dto.request.UsuarioRequest;
import com.adega.dto.response.UsuarioResponse;
import com.adega.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DONO')")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public List<UsuarioResponse> findAll(@RequestParam(required = false) UUID adegaId) {
        return usuarioService.findAll(adegaId);
    }

    @PostMapping
    public ResponseEntity<UsuarioResponse> create(@RequestBody @Valid UsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.create(request));
    }

    @PutMapping("/{id}")
    public UsuarioResponse update(@PathVariable UUID id, @RequestBody @Valid UsuarioRequest request) {
        return usuarioService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public UsuarioResponse toggleStatus(@PathVariable UUID id) {
        return usuarioService.toggleStatus(id);
    }
}
