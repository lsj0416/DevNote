package com.devnote.domain.user.controller;

import com.devnote.domain.user.dto.UserResponse;
import com.devnote.domain.user.dto.UserUpdateRequest;
import com.devnote.domain.user.service.UserService;
import com.devnote.global.response.ApiResponse;
import com.devnote.global.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RestController("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe() {
        return ResponseEntity.ok(ApiResponse.ok(
                userService.getMe(SecurityUtil.getCurrentUserId())));
    }

    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            @Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                userService.updateMe(SecurityUtil.getCurrentUserId(), request)));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteMe() {
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
