package com.devnote.domain.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UserUpdateRequest {

    @NotBlank(message = "username은 필수입니다")
    @Size(max = 100, message = "username은 100자 이하여야 합니다")
    private String username;
}
