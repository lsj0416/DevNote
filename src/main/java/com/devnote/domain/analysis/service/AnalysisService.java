package com.devnote.domain.analysis.service;

import com.devnote.domain.analysis.dto.AnalysisRequest;
import com.devnote.domain.analysis.dto.JobListResponse;
import com.devnote.domain.analysis.dto.JobStatusResponse;
import com.devnote.domain.analysis.entity.AnalysisJob;
import com.devnote.domain.analysis.entity.JobStatus;
import com.devnote.domain.analysis.repository.AnalysisJobRepository;
import com.devnote.domain.user.entity.User;
import com.devnote.domain.user.repository.UserRepository;
import com.devnote.global.exception.BusinessException;
import com.devnote.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final AnalysisJobRepository analysisJobRepository;
    private final UserRepository userRepository;
    private final AnalysisJobProcessor analysisJobProcessor;
    private final RedisTemplate<String, String> redisTemplate;

    // Redis 캐싱 키: "NOTE_CACHE:{repoUrl}:{commitSha}" → noteId
    private static final String NOTE_CACHE_PREFIX = "NOTE_CACHE:";
    private static final Pattern REPO_NAME_PATTERN =
            Pattern.compile("https://github\\.com/([\\w.-]+/[\\w.-]+)/?");

    /**
     * 분석 요청을 생성합니다.
     * - 진행 중인 Job이 있으면 DUPLICATE_REQUEST 예외
     * - Job 생성 후 @Async 비동기 처리 위임
     */
    @Transactional
    public JobStatusResponse requestAnalysis(Long userId, AnalysisRequest request) {
        // 중복 요청 검사
        boolean inProgress = analysisJobRepository.existsByUserIdAndStatusIn(
                userId, List.of(JobStatus.PENDING, JobStatus.PROCESSING));
        if (inProgress) {
            throw new BusinessException(ErrorCode.DUPLICATE_ANALYSIS);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        String repoName = parseRepoName(request.getRepoUrl());

        AnalysisJob job = AnalysisJob.builder()
                .user(user)
                .repoUrl(request.getRepoUrl())
                .repoName(repoName)
                .build();

        analysisJobRepository.save(job);
        log.info("분석 Job 생성 완료: jobId={}, userId={}, repoUrl={}",
                job.getId(), userId, request.getRepoUrl());

        // @Async 비동기 처리 시작
        analysisJobProcessor.process(job.getId(), user.getGithubToken());

        return JobStatusResponse.from(job);
    }

    /**
     * 분석 Job 상태를 조회합니다.
     * COMPLETED 상태면 Redis 캐시에서 noteId를 함께 반환합니다.
     */
    @Transactional(readOnly = true)
    public JobStatusResponse getJobStatus(Long userId, Long jobId) {
        AnalysisJob job = findJobByIdAndUserId(jobId, userId);

        Long noteId = null;
        if (job.getStatus() == JobStatus.COMPLETED) {
            String cacheKey = NOTE_CACHE_PREFIX + job.getRepoUrl() + ":" + job.getCommitSha();
            String cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached != null) {
                noteId = Long.parseLong(cached);
            }
        }

        return JobStatusResponse.from(job, noteId);
    }

    /**
     * 사용자의 분석 Job 목록을 페이징 조회합니다.
     */
    @Transactional(readOnly = true)
    public Page<JobListResponse> getJobList(Long userId, int page, int size) {
        // 페이지 번호(0부터 시작), 페이지 크기, 정렬 조건을 묶어서 Pageable 생성
        PageRequest pageRequest = PageRequest.of(
                page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        return analysisJobRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageRequest)
                .map(JobListResponse::from);
    }

    // ── 내부 메서드 ──────────────────────────────────────────────────────────────

    private AnalysisJob findJobByIdAndUserId(Long jobId, Long userId) {
        AnalysisJob job = analysisJobRepository.findById(jobId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ANALYSIS_JOB_NOT_FOUND));

        if (!job.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return job;
    }

    private String parseRepoName(String repoUrl) {
        // "https://github.com/lsj0416/devnote" → "lsj0416/devnote" 형태로 추출
        Matcher m = REPO_NAME_PATTERN.matcher(repoUrl);
        return m.find() ? m.group(1) : repoUrl; // 매칭 실패 시 원본 URL을 그대로 저장
    }

}
