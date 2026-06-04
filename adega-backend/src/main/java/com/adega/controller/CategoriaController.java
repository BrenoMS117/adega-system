package com.adega.controller;

import com.adega.dto.request.CategoriaRequest;
import com.adega.dto.response.CategoriaResponse;
import com.adega.service.CategoriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaService categoriaService;

    @GetMapping
    public List<CategoriaResponse> findAll() {
        return categoriaService.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('DONO')")
    public ResponseEntity<CategoriaResponse> create(@Valid @RequestBody CategoriaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(categoriaService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DONO')")
    public ResponseEntity<CategoriaResponse> update(@PathVariable UUID id,
                                                    @Valid @RequestBody CategoriaRequest request) {
        return ResponseEntity.ok(categoriaService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DONO')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        categoriaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
