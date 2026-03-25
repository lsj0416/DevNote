package com.devnote.domain.note.dto;

import com.devnote.domain.note.entity.Note;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class NoteResponse {

    private Long noteId;
    private String title;
    private String summary;
    private List<String> concepts;
    private String architecture;
    private List<String> learningPoints;
    private String rawMarkdown;
    private LocalDateTime createdAt;

    public static NoteResponse from(Note note) {
        return NoteResponse.builder()
                .noteId(note.getId())
                .title(note.getTitle())
                .summary(note.getSummary())
                .concepts(note.getConcepts())
                .architecture(note.getArchitecture())
                .learningPoints(note.getLearningPoints())
                .rawMarkdown(note.getRawMarkdown())
                .createdAt(note.getCreatedAt())
                .build();
    }
}