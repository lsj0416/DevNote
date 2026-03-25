package com.devnote.domain.analysis.service;

import com.devnote.domain.analysis.client.GitHubApiClient;
import com.devnote.domain.analysis.client.OpenAiNoteClient;
import com.devnote.domain.analysis.dto.GitHubRepoContext;
import com.devnote.domain.analysis.dto.NoteCreateData;
import com.devnote.domain.analysis.entity.AnalysisJob;
import com.devnote.domain.analysis.repository.AnalysisJobRepository;
import com.devnote.domain.note.service.NoteService;
import com.devnote.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async; // @Async: 별도 스레드 풀에서 비동기 실행 — 호출 즉시 반환되고 실제 작업은 백그라운드에서 진행
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Slf4j
@Component  // @Service 대신 @Component 사용 — 비즈니스 서비스라기보다 처리 작업 단위이므로 의미상 더 적합
@RequiredArgsConstructor
public class AnalysisJobProcessor {

    private final AnalysisJobRepository analysisJobRepository;
    private final GitHubApiClient gitHubApiClient;
    private final OpenAiNoteClient openAiNoteClient;
    private final NoteService noteService;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String NOTE_CACHE_PREFIX = "NOTE_CACHE:";
    private static final Duration NOTE_CACHE_TTL = Duration.ofDays(30);
    private static final int MAX_RETRY = 2;

    /**
     * 분석 Job을 비동기로 처리합니다.
     *
     * 1. GitHub API 호출 → commitSha 획득
     * 2. 캐시 확인 (동일 repo + commitSha → 기존 noteId 재사용)
     * 3. OpenAI API 호출 → 노트 생성
     * 4. Note 저장
     * 5. Job 상태 COMPLETED 처리
     */
    @Async("analysisExecutor")  // "analysisExecutor": AsyncConfig에 등록한 스레드 풀 빈 이름 — 지정하지 않으면 기본 SimpleAsyncTaskExecutor 사용
    public void process(Long jobId, String githubToken) {
        AnalysisJob job = analysisJobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalStateException("Job not found: " + jobId));

        log.info("[Analysis] 시작 - jobId={}, repoUrl={}", jobId, job.getRepoUrl());

        // 재시도 루프: 1차(temperature 0.3) → 2차(temperature 0.0) → 3차(README truncate)
        for (int attempt = 1; attempt <= MAX_RETRY + 1; attempt++) {
            try {
                execute(job, githubToken);
                return; // 성공 시 루프 탈출
            } catch (BusinessException e) {
                job.incrementRetry(); // 재시도 횟수를 엔티티에 기록
                analysisJobRepository.save(job);

                if (attempt > MAX_RETRY) {
                    // 재시도 횟수를 모두 소진하면 FAILED 처리
                    failJob(job, e.getMessage());
                    return;
                }
                log.warn("[Analysis] 재시도 {}/{} - jobId={}: {}", attempt, MAX_RETRY, jobId, e.getMessage());
            } catch (Exception e) {
                // BusinessException 외의 예상치 못한 예외는 즉시 FAILED 처리 (재시도 없음)
                log.error("[Analysis] 예상치 못한 오류 - jobId={}: {}", jobId, e.getMessage(), e);
                failJob(job, "예상치 못한 오류가 발생했습니다");
                return;
            }
        }
    }

    // @Transactional을 process()가 아닌 execute()에 선언하는 이유:
    // @Async 메서드에 @Transactional을 함께 쓰면 트랜잭션이 올바르게 전파되지 않을 수 있음
    // → 실제 DB 작업이 일어나는 execute()에만 트랜잭션을 적용해서 범위를 명확히 분리
    @Transactional
    public void execute(AnalysisJob job, String githubToken) {

        // 1. GitHub API 호출 — commitSha를 포함한 repo 전체 컨텍스트 수집
        GitHubRepoContext context = gitHubApiClient.fetchRepoContext(job.getRepoUrl(), githubToken);

        // 2. Job 상태를 PROCESSING으로 전이 + commitSha 저장
        job.markProcessing(context.getCommitSha());
        analysisJobRepository.save(job);

        // 3. 캐시 확인 — 동일 repo + 동일 commitSha로 이미 완료된 분석이 있으면 OpenAI 호출 생략
        String cacheKey = NOTE_CACHE_PREFIX + job.getRepoUrl() + ":" + context.getCommitSha();
        String cachedNoteId = redisTemplate.opsForValue().get(cacheKey);

        if (cachedNoteId != null) {
            // 캐시 히트: OpenAI 비용 절감 + 응답 속도 향상
            log.info("[Analysis] 캐시 히트 - jobId={}, noteId={}", job.getId(), cachedNoteId);
            job.markCompleted();
            analysisJobRepository.save(job);
            return;
        }

        // 4. OpenAI API 호출 — 내부에서 최대 3회 재시도 로직 포함
        NoteCreateData noteData = openAiNoteClient.generateNote(context);

        // 5. Note 저장 — NoteService를 통해 저장하고 생성된 noteId 반환
        // 도메인 간 Repository 직접 접근 금지 원칙에 따라 NoteService를 통해 접근
        Long noteId = noteService.saveNote(job.getUser().getId(), job.getId(), noteData);

        // 6. Redis 캐시 저장 — TTL 30일, 이후 동일 commitSha 요청 시 재사용
        redisTemplate.opsForValue().set(cacheKey, String.valueOf(noteId), NOTE_CACHE_TTL);

        // 7. Job 상태를 COMPLETED로 전이
        job.markCompleted();
        analysisJobRepository.save(job);

        log.info("[Analysis] 완료 - jobId={}, noteId={}", job.getId(), noteId);
    }

    private void failJob(AnalysisJob job, String errorMessage) {
        job.markFailed(errorMessage); // 엔티티에 FAILED 상태 + errorMessage 저장
        analysisJobRepository.save(job);
        log.error("[Analysis] 실패 처리 - jobId={}, reason={}", job.getId(), errorMessage);
    }
}