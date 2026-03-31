package com.devnote.domain.note.service;

import com.devnote.domain.analysis.entity.AnalysisJob;
import com.devnote.domain.analysis.repository.AnalysisJobRepository;
import com.devnote.domain.note.dto.NoteListResponse;
import com.devnote.domain.note.dto.NoteResponse;
import com.devnote.domain.note.entity.Note;
import com.devnote.domain.note.repository.NoteRepository;
import com.devnote.domain.analysis.dto.NoteCreateData;
import com.devnote.domain.user.entity.User;
import com.devnote.domain.user.repository.UserRepository;
import com.devnote.global.exception.BusinessException;
import com.devnote.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final AnalysisJobRepository analysisJobRepository; // 도메인 간 Repository 직접 접근 금지 원칙의 예외 — Note 저장 시 AnalysisJob 참조가 필요하므로 허용
    private final RedisTemplate<String, String> redisTemplate;

    /**
     * AnalysisJobProcessor에서 호출 — OpenAI 응답 데이터를 Note로 저장합니다.
     *
     * @return 저장된 Note의 id (AnalysisJobProcessor가 Redis 캐싱 키 값으로 사용)
     */
    @Transactional
    public Long saveNote(Long userId, Long jobId, NoteCreateData data) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        AnalysisJob job = analysisJobRepository.findById(jobId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ANALYSIS_JOB_NOT_FOUND));

        Note note = Note.builder()
                .user(user)
                .job(job)
                .title(data.getTitle())
                .summary(data.getSummary())
                .concepts(data.getConcepts())
                .architecture(data.getArchitecture())
                .learningPoints(data.getLearningPoints())
                .rawMarkdown(data.getRawMarkdown())
                .build();

        return noteRepository.save(note).getId();
    }

    /**
     * 노트 상세 조회
     */
    @Transactional(readOnly = true)
    public NoteResponse getNote(Long userId, Long noteId) {
        return NoteResponse.from(findByIdAndUserId(noteId, userId));
    }

    /**
     * 노트 목록 조회 (페이징)
     */
    @Transactional(readOnly = true)
    public Page<NoteListResponse> getNoteList(Long userId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(
                page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return noteRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageRequest)
                .map(NoteListResponse::from);
    }

    /**
     * 노트 삭제
     */
    @Transactional
    public void deleteNote(Long userId, Long noteId) {
        Note note = findByIdAndUserId(noteId, userId);

        // 연관된 Redis 캐시 삭제
        String cacheKey = "NOTE_CACHE:" + note.getJob().getRepoUrl()
                + ":" + note.getJob().getCommitSha();
        redisTemplate.delete(cacheKey);

        noteRepository.delete(note);
    }

    // ── 내부 메서드 ──────────────────────────────────────────────────────────────

    private Note findByIdAndUserId(Long noteId, Long userId) {
        // findByIdAndUserId: id + userId 조건을 한 쿼리로 처리 — 소유자 검증과 조회를 동시에
        return noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));
    }
}