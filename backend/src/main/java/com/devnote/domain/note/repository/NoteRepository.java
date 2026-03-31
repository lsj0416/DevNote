package com.devnote.domain.note.repository;

import com.devnote.domain.note.entity.Note;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {

    // 사용자의 노트 목록 (최신순)
    Page<Note> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // 노트 단건 조회 시 소유자 검증을 한 번의 쿼리로 처리
    Optional<Note> findByIdAndUserId(Long id, Long userId);
}