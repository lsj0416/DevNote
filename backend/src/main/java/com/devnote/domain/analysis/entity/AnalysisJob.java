package com.devnote.domain.analysis.entity;

import com.devnote.domain.user.entity.User;
import com.devnote.global.config.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "analysis_jobs",
        indexes = {
                @Index(name = "idx_analysis_jobs_user_id", columnList = "user_id"),
                @Index(name = "idx_analysis_jobs_status", columnList = "status"),
                @Index(name = "idx_analysis_jobs_repo_commit", columnList = "repo_url, commit_sha")
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnalysisJob extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String repoUrl;

    @Column(nullable = false, length = 200)
    private String repoName;

    @Column(length = 40)
    private String commitSha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JobStatus status;

    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @Column(nullable = false)
    private int retryCount;

    @Builder
    public AnalysisJob(User user, String repoUrl, String repoName) {
        this.user = user;
        this.repoUrl = repoUrl;
        this.repoName = repoName;
        this.status = JobStatus.PENDING;
        this.retryCount = 0;
    }

    // --- 상태 전이 메서드 ---

    public void markProcessing(String commitSha) {
        this.commitSha = commitSha;
        this.status = JobStatus.PROCESSING;
    }

    public void markCompleted() {
        this.status = JobStatus.COMPLETED;
    }

    public void markFailed(String errorMessage) {
        this.status = JobStatus.FAILED;
        this.errorMessage = errorMessage;
    }

    public void incrementRetry() {
        this.retryCount++;
    }

    public boolean isInProcessing() {
        return this.status == JobStatus.PENDING || this.status == JobStatus.PROCESSING;
    }
}
