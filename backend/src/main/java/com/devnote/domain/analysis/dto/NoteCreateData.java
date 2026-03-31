package com.devnote.domain.analysis.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * OpenAiNoteClient 파싱 결과 → AnalysisJobProcessor → NoteService 로 전달하는 내부 객체.
 */
@Getter
@Builder
public class NoteCreateData {

    private String title;
    private String summary;
    private List<String> concepts;
    private String architecture;
    private List<String> learningPoints;
    private List<String> techStack;
    private String difficulty;
    private String rawMarkdown;
}
