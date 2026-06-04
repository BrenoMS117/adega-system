package com.adega.controller;

import com.adega.dto.response.CmvResponse;
import com.adega.service.CmvService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/cmv")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DONO')")
public class CmvController {

    private final CmvService cmvService;

    @GetMapping
    public ResponseEntity<CmvResponse> getCmv(
            @RequestParam(required = false) UUID adegaId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {

        LocalDate inicio = dataInicio != null ? dataInicio : LocalDate.now().withDayOfMonth(1);
        LocalDate fim = dataFim != null ? dataFim : LocalDate.now();

        return ResponseEntity.ok(cmvService.getCmv(adegaId, inicio, fim));
    }
}
