package com.adega.controller;

import com.adega.dto.request.ProdutoRequest;
import com.adega.dto.request.VariacaoProdutoRequest;
import com.adega.dto.response.ProdutoResponse;
import com.adega.dto.response.VariacaoProdutoResponse;
import com.adega.service.ProdutoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/produtos")
@RequiredArgsConstructor
public class ProdutoController {

    private final ProdutoService produtoService;

    @GetMapping
    public List<ProdutoResponse> findAll(
            @RequestParam(required = false) UUID categoriaId,
            @RequestParam(required = false) Boolean ativo) {
        return produtoService.findAll(categoriaId, ativo);
    }

    @PostMapping
    @PreAuthorize("hasRole('DONO')")
    public ResponseEntity<ProdutoResponse> create(@RequestBody @Valid ProdutoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(produtoService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DONO')")
    public ProdutoResponse update(@PathVariable UUID id, @RequestBody @Valid ProdutoRequest request) {
        return produtoService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('DONO')")
    public ProdutoResponse toggleStatus(@PathVariable UUID id) {
        return produtoService.toggleStatus(id);
    }

    @GetMapping("/{id}/variacoes")
    public List<VariacaoProdutoResponse> getVariacoes(@PathVariable UUID id) {
        return produtoService.findById(id).variacoes();
    }

    @PostMapping("/{id}/variacoes")
    @PreAuthorize("hasRole('DONO')")
    public ResponseEntity<ProdutoResponse> addVariacao(
            @PathVariable UUID id,
            @RequestBody @Valid VariacaoProdutoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(produtoService.addVariacao(id, request));
    }

    @PutMapping("/variacoes/{id}")
    @PreAuthorize("hasRole('DONO')")
    public VariacaoProdutoResponse updateVariacao(
            @PathVariable UUID id,
            @RequestBody @Valid VariacaoProdutoRequest request) {
        return produtoService.updateVariacao(id, request);
    }
}
