package com.adega.controller;

import com.adega.dto.request.VendaRequest;
import com.adega.dto.response.VendaResponse;
import com.adega.model.enums.CanalVenda;
import com.adega.model.enums.StatusVenda;
import com.adega.service.VendaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/vendas")
@RequiredArgsConstructor
public class VendaController {

    private final VendaService vendaService;

    @PostMapping
    public ResponseEntity<VendaResponse> create(
            @RequestBody @Valid VendaRequest request,
            HttpServletRequest httpRequest) {
        UUID usuarioId = (UUID) httpRequest.getAttribute("usuarioId");
        return ResponseEntity.status(HttpStatus.CREATED).body(vendaService.create(request, usuarioId));
    }

    @GetMapping
    public List<VendaResponse> findAll(
            @RequestParam(required = false) UUID adegaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim,
            @RequestParam(required = false) StatusVenda status,
            @RequestParam(required = false) CanalVenda canal,
            @RequestParam(required = false) UUID usuarioId,
            HttpServletRequest httpRequest) {

        // FUNCIONARIO is bound to one adega (from JWT) and cannot query other adegas;
        // DONO has no adega in the JWT and may filter by the adegaId request param.
        UUID jwtAdegaId = (UUID) httpRequest.getAttribute("adegaId");
        UUID effectiveAdegaId = jwtAdegaId != null ? jwtAdegaId : adegaId;

        LocalDate inicio = dataInicio != null ? dataInicio : LocalDate.now();
        LocalDate fim = dataFim != null ? dataFim : LocalDate.now();

        LocalDateTime dataInicioDt = inicio.atStartOfDay();
        LocalDateTime dataFimDt = fim.atTime(23, 59, 59);

        return vendaService.findAll(effectiveAdegaId, dataInicioDt, dataFimDt, status, canal, usuarioId);
    }

    @GetMapping("/{id}")
    public VendaResponse findById(@PathVariable UUID id) {
        return vendaService.findById(id);
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('DONO')")
    public VendaResponse cancel(@PathVariable UUID id, HttpServletRequest httpRequest) {
        UUID usuarioId = (UUID) httpRequest.getAttribute("usuarioId");
        return vendaService.cancel(id, usuarioId);
    }
}
