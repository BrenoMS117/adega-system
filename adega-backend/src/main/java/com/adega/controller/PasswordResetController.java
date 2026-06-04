package com.adega.controller;

import com.adega.dto.request.NewPasswordRequest;
import com.adega.dto.request.PasswordResetRequest;
import com.adega.exception.BusinessException;
import com.adega.exception.ResourceNotFoundException;
import com.adega.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/password")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/request")
    public ResponseEntity<Map<String, String>> requestReset(@RequestBody @Valid PasswordResetRequest request) {
        passwordResetService.requestReset(request.email());
        return ResponseEntity.ok(Map.of("message",
                "Se o email estiver cadastrado, você receberá as instruções em breve."));
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody @Valid NewPasswordRequest request) {
        try {
            passwordResetService.resetPassword(request.token(), request.newPassword());
            return ResponseEntity.ok(Map.of("message", "Senha redefinida com sucesso."));
        } catch (BusinessException | ResourceNotFoundException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
