package com.devnote.domain.analysis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AnalysisRequest {

    @NotBlank(message = "repoUrl은 필수입니다")
    @Pattern(
            regexp = "^https://github\\.com/[\\w.-]+/[\\w.-]+/?$",
            message = "유효한 GitHub repo URL이 아닙니다"
    )
    private String repoUrl;
}
