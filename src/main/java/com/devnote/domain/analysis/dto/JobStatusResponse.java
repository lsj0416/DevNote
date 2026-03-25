package com.devnote.domain.analysis.dto;

import com.devnote.domain.analysis.entity.AnalysisJob;
import com.devnote.domain.analysis.entity.JobStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JobStatusResponse {

    private Long jobId;
    private JobStatus status;
    private String repoUrl;
    private Long noteId;            // COMPLETED 시에만 포함
    private String errorMessage;    // FAILED 시에만 포함
    private LocalDateTime createdAt;

    public static JobStatusResponse from(AnalysisJob job, Long noteId) {
        return JobStatusResponse.builder()
                .jobId(job.getId())
                .status(job.getStatus())
                .repoUrl(job.getRepoUrl())
                .noteId(noteId)
                .errorMessage(job.getErrorMessage())
                .createdAt(job.getCreatedAt())
                .build();
    }

    public static JobStatusResponse from(AnalysisJob job) {
        return from(job, null);
    }
}
