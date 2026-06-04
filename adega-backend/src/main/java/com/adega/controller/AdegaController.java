package com.adega.controller;

import com.adega.dto.request.AdegaRequest;
import com.adega.dto.response.AdegaResponse;
import com.adega.service.AdegaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/adegas")
@RequiredArgsConstructor
public class AdegaController {

    private final AdegaService adegaService;

    @GetMapping
    public ResponseEntity<List<AdegaResponse>> getAdegas() {
        return ResponseEntity.ok(adegaService.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('DONO')")
    public ResponseEntity<AdegaResponse> create(@Valid @RequestBody AdegaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adegaService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DONO')")
    public ResponseEntity<AdegaResponse> update(@PathVariable UUID id,
                                                @Valid @RequestBody AdegaRequest request) {
        return ResponseEntity.ok(adegaService.update(id, request));
    }
}
