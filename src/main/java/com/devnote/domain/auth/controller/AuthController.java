package com.devnote.domain.auth.controller;

import com.devnote.domain.auth.dto.RefreshRequest;
import com.devnote.domain.auth.dto.TokenResponse;
import com.devnote.domain.auth.service.AuthService;
import com.devnote.global.response.ApiResponse;
import com.devnote.global.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(
            @Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.refresh(request)));
    }

    @PostMapping("logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshRequest request) {
        authService.logout(SecurityUtil.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
