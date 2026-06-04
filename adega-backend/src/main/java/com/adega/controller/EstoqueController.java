package com.adega.controller;

import com.adega.dto.request.AjusteEstoqueRequest;
import com.adega.dto.request.EntradaEstoqueRequest;
import com.adega.dto.response.EstoqueResponse;
import com.adega.dto.response.MovimentoEstoqueResponse;
import com.adega.service.EstoqueService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/estoque")
@RequiredArgsConstructor
public class EstoqueController {

    private final EstoqueService estoqueService;

    @GetMapping
    public List<EstoqueResponse> findAll(
            @RequestParam(required = false) UUID adegaId,
            @RequestParam(required = false) UUID categoriaId,
            @RequestParam(required = false) String situacao) {

        List<EstoqueResponse> responses = estoqueService.findAll(adegaId, categoriaId, situacao);

        boolean isFuncionario = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FUNCIONARIO"));

        if (isFuncionario) {
            responses = responses.stream()
                    .map(r -> new EstoqueResponse(
                            r.variacaoId(), r.produtoNome(), r.variacaoDescricao(),
                            r.estoqueAtual(), r.estoqueMinimo(), r.situacao(),
                            null, r.categoriaNome()))
                    .toList();
        }

        return responses;
    }

    @PostMapping("/entrada")
    public ResponseEntity<MovimentoEstoqueResponse> registrarEntrada(
            @RequestBody @Valid EntradaEstoqueRequest request,
            HttpServletRequest httpRequest) {
        UUID usuarioId = (UUID) httpRequest.getAttribute("usuarioId");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(estoqueService.registrarEntrada(request, usuarioId));
    }

    @PostMapping("/ajuste")
    @PreAuthorize("hasRole('DONO')")
    public ResponseEntity<MovimentoEstoqueResponse> ajusteManual(
            @RequestBody @Valid AjusteEstoqueRequest request,
            HttpServletRequest httpRequest) {
        UUID usuarioId = (UUID) httpRequest.getAttribute("usuarioId");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(estoqueService.ajusteManual(request, usuarioId));
    }

    @GetMapping("/{variacaoId}/historico")
    public List<MovimentoEstoqueResponse> getHistorico(@PathVariable UUID variacaoId) {
        return estoqueService.getHistorico(variacaoId);
    }
}
