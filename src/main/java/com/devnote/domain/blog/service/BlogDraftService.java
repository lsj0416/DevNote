package com.devnote.domain.blog.service;

import com.devnote.domain.blog.client.OpenAiBlogClient;
import com.devnote.domain.blog.dto.BlogDraftResponse;
import com.devnote.domain.blog.entity.BlogDraft;
import com.devnote.domain.blog.repository.BlogDraftRepository;
import com.devnote.domain.note.entity.Note;
import com.devnote.domain.note.repository.NoteRepository;
import com.devnote.domain.user.entity.User;
import com.devnote.domain.user.repository.UserRepository;
import com.devnote.global.exception.BusinessException;
import com.devnote.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlogDraftService {

    private final BlogDraftRepository blogDraftRepository;
    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final OpenAiBlogClient openAiBlogClient;

    /**
     * 블로그 초안을 조회합니다.
     * 초안이 없으면 OpenAI API를 호출해서 생성 후 저장합니다 (지연 생성 전략).
     */
    @Transactional
    public BlogDraftResponse getOrCreateBlogDraft(Long userId, Long noteId) {
        // 이미 생성된 초안이 있으면 바로 반환
        return blogDraftRepository.findByNoteIdAndUserId(noteId, userId)
                .map(BlogDraftResponse::from)
                .orElseGet(() -> createBlogDraft(userId, noteId));
    }

    // ── 내부 메서드 ──────────────────────────────────────────────────────────────

    private BlogDraftResponse createBlogDraft(Long userId, Long noteId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 소유자 검증 포함 조회 — 다른 사용자의 노트로 블로그 초안 생성 차단
        Note note = noteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTE_NOT_FOUND));

        log.info("[Blog] 초안 생성 시작 - userId={}, noteId={}", userId, noteId);

        // OpenAI API 호출 — [title, content] 배열로 반환
        String[] generated = openAiBlogClient.generateBlogDraft(note);

        BlogDraft draft = BlogDraft.builder()
                .user(user)
                .note(note)
                .title(generated[0])
                .content(generated[1])
                .build();

        blogDraftRepository.save(draft);
        log.info("[Blog] 초안 생성 완료 - draftId={}", draft.getId());

        return BlogDraftResponse.from(draft);
    }
}