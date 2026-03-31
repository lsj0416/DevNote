package com.devnote.domain.blog.controller;

import com.devnote.domain.blog.dto.BlogDraftResponse;
import com.devnote.domain.blog.dto.BlogExportResponse;
import com.devnote.domain.blog.service.BlogDraftExportService;
import com.devnote.domain.blog.service.BlogDraftService;
import com.devnote.global.response.ApiResponse;
import com.devnote.global.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Blog", description = "블로그 초안 API")
@RestController
@RequestMapping("/api/v1/notes/{noteId}/blog-draft")
@RequiredArgsConstructor
public class BlogDraftController {

    private final BlogDraftService blogDraftService;
    private final BlogDraftExportService blogDraftExportService;

    @Operation(summary = "블로그 초안 조회 (없으면 자동 생성)")
    @GetMapping
    public ResponseEntity<ApiResponse<BlogDraftResponse>> getBlogDraft(
            @PathVariable Long noteId) {
        return ResponseEntity.ok(ApiResponse.ok(
                blogDraftService.getOrCreateBlogDraft(
                        SecurityUtil.getCurrentUserId(), noteId)));
    }

    @Operation(summary = "블로그 초안 Markdown export")
    @PostMapping("/export")
    public ResponseEntity<ApiResponse<BlogExportResponse>> exportBlogDraft(
            @PathVariable Long noteId) {
        return ResponseEntity.ok(ApiResponse.ok(
                blogDraftExportService.export(
                        SecurityUtil.getCurrentUserId(), noteId)));
    }
}