package com.adega.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NewPasswordRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres") String newPassword
) {}
