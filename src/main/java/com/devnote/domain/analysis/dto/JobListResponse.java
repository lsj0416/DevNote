package com.devnote.domain.analysis.dto;

import com.devnote.domain.analysis.entity.AnalysisJob;
import com.devnote.domain.analysis.entity.JobStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class JobListResponse {

    private Long jobId;
    private String repoUrl;
    private JobStatus status;
    private LocalDateTime createdAt;

    public static JobListResponse from(AnalysisJob job) {
        return JobListResponse.builder()
                .jobId(job.getId())
                .repoUrl(job.getRepoUrl())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .build();
    }
}
