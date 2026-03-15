package com.devnote.domain.user.controller;

import com.devnote.domain.user.dto.UserResponse;
import com.devnote.domain.user.dto.UserUpdateRequest;
import com.devnote.domain.user.service.UserService;
import com.devnote.global.response.ApiResponse;
import com.devnote.global.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User", description = "사용자 API")
@Controller
@RestController("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe() {
        return ResponseEntity.ok(ApiResponse.ok(
                userService.getMe(SecurityUtil.getCurrentUserId())));
    }

    @Operation(summary = "내 정보 수정")
    @PatchMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateMe(
            @Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                userService.updateMe(SecurityUtil.getCurrentUserId(), request)));
    }

    @Operation(summary = "회원 탈퇴")
    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteMe() {
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
