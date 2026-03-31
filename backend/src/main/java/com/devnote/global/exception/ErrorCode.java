package com.devnote.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통
    INVALID_REQUEST(400, "INVALID_REQUEST", "요청 파라미터가 올바르지 않습니다."),
    UNAUTHORIZED(401, "UNAUTHORIZED", "인증이 필요합니다."),
    FORBIDDEN(403, "FORBIDDEN", "접근 권한이 없습니다"),
    NOT_FOUND(404, "NOT_FOUND", "리소스를 찾을 수 없습니다"),
    INTERNAL_ERROR(500, "INTERNAL_ERROR", "서버 내부 오류가 발생했습니다"),

    // Auth
    TOKEN_EXPIRED(401, "TOKEN_EXPIRED", "토큰이 만료되었습니다"),
    INVALID_TOKEN(401, "INVALID_TOKEN", "유효하지 않은 토큰입니다"),
    REFRESH_TOKEN_NOT_FOUND(401, "REFRESH_TOKEN_NOT_FOUND", "Refresh Token이 존재하지 않습니다"),

    // User
    USER_NOT_FOUND(404, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다"),

    // Analysis
    ANALYSIS_JOB_NOT_FOUND(404, "ANALYSIS_JOB_NOT_FOUND", "분석 Job을 찾을 수 없습니다"),
    DUPLICATE_ANALYSIS(409, "DUPLICATE_REQUEST", "이미 진행 중인 분석 요청이 있습니다"),
    RATE_LIMIT_EXCEEDED(429, "RATE_LIMIT_EXCEEDED", "요청 한도를 초과했습니다"),
    GITHUB_API_ERROR(502, "GITHUB_API_ERROR", "GitHub API 호출에 실패했습니다"),
    AI_API_ERROR(502, "AI_API_ERROR", "AI API 호출에 실패했습니다"),

    // Note
    NOTE_NOT_FOUND(404, "NOTE_NOT_FOUND", "노트를 찾을 수 없습니다"),

    // Blog
    BLOG_DRAFT_NOT_FOUND(404, "BLOG_DRAFT_NOT_FOUND", "블로그 초안을 찾을 수 없습니다"),
    S3_UPLOAD_FAILED(502, "S3_UPLOAD_FAILED", "파일 업로드에 실패했습니다");

    private final int status;
    private final String code;
    private final String message;
}
