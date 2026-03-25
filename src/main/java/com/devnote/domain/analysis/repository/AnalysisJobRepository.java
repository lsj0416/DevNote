package com.devnote.domain.analysis.repository;

import com.devnote.domain.analysis.entity.AnalysisJob;
import com.devnote.domain.analysis.entity.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnalysisJobRepository extends JpaRepository<AnalysisJob, Long> {

    // 사용자의 진행 중(PENDING / PROCESSING) 분석 Job 존재 여부 확인
    boolean existsByUserIdAndStatusIn(Long userId, List<JobStatus> statuses);

    // 사용자의 분석 Job 목록 (최신순)
    Page<AnalysisJob> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // 동일 repo + commitSha 캐싱 확인
    Optional<AnalysisJob> findTopByRepoUrlAndCommitShaAndStatus(
            String repoUrl, String commitSha, JobStatus status);
}
