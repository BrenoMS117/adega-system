package com.adega.controller;

import com.adega.dto.request.FechamentoCaixaRequest;
import com.adega.dto.response.FechamentoCaixaResponse;
import com.adega.service.FechamentoCaixaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/caixa")
@RequiredArgsConstructor
public class FechamentoCaixaController {

    private final FechamentoCaixaService fechamentoCaixaService;

    @PostMapping("/fechar")
    public ResponseEntity<FechamentoCaixaResponse> fechar(
            @RequestBody @Valid FechamentoCaixaRequest request,
            HttpServletRequest httpRequest) {
        UUID usuarioId = (UUID) httpRequest.getAttribute("usuarioId");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fechamentoCaixaService.fechar(request, usuarioId));
    }

    @GetMapping("/aberto")
    public FechamentoCaixaResponse getCaixaAberto(@RequestParam UUID adegaId) {
        return fechamentoCaixaService.getCaixaAberto(adegaId);
    }

    @GetMapping("/historico")
    public List<FechamentoCaixaResponse> getHistorico(@RequestParam UUID adegaId) {
        return fechamentoCaixaService.getHistorico(adegaId);
    }
}
