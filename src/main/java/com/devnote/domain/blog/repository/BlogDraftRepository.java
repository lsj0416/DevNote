package com.devnote.domain.blog.repository;

import com.devnote.domain.blog.entity.BlogDraft;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BlogDraftRepository extends JpaRepository<BlogDraft, Long> {

    // noteId로 블로그 초안 조회 — Note와 1:1 관계이므로 noteId가 곧 식별자
    Optional<BlogDraft> findByNoteId(Long noteId);

    // 소유자 검증을 포함한 단건 조회
    Optional<BlogDraft> findByNoteIdAndUserId(Long noteId, Long userId);
}