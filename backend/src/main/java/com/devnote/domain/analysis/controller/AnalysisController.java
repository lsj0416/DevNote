package com.devnote.domain.analysis.controller;

import com.devnote.domain.analysis.dto.AnalysisRequest;
import com.devnote.domain.analysis.dto.JobListResponse;
import com.devnote.domain.analysis.dto.JobStatusResponse;
import com.devnote.domain.analysis.service.AnalysisService;
import com.devnote.global.response.ApiResponse;
import com.devnote.global.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Analysis", description = "분석 API")
@RestController
@RequestMapping("/api/v1/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @Operation(summary = "분석 요청")
    @PostMapping
    public ResponseEntity<ApiResponse<JobStatusResponse>> requestAnalysis(
            @Valid @RequestBody AnalysisRequest request) {
        JobStatusResponse response = analysisService.startAnalysis(  // 변경
                SecurityUtil.getCurrentUserId(), request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.ok(response));
    }

    @Operation(summary = "분석 상태 조회 (Polling)")
    @GetMapping("/{jobId}")
    public ResponseEntity<ApiResponse<JobStatusResponse>> getJobStatus(
            @PathVariable Long jobId) {
        return ResponseEntity.ok(ApiResponse.ok(
                analysisService.getJobStatus(SecurityUtil.getCurrentUserId(), jobId)));
    }

    @Operation(summary = "내 분석 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<JobListResponse>>> getJobList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                analysisService.getJobList(SecurityUtil.getCurrentUserId(), page, size)));
    }
}