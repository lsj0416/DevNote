package com.devnote.domain.note.dto;

import com.devnote.domain.note.entity.Note;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NoteListResponse {

    private Long noteId;
    private String title;
    private String summary;
    private LocalDateTime createdAt;

    public static NoteListResponse from(Note note) {
        return NoteListResponse.builder()
                .noteId(note.getId())
                .title(note.getTitle())
                .summary(note.getSummary())
                .createdAt(note.getCreatedAt())
                .build();
    }
}