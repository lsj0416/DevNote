package com.devnote.domain.blog.dto;

import com.devnote.domain.blog.entity.BlogDraft;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL) // exportUrl은 S3 export 전까지 null — 응답에서 자동 제외
public class BlogDraftResponse {

    private Long draftId;
    private Long noteId;
    private String title;
    private String content;
    private String exportUrl;
    private LocalDateTime createdAt;

    public static BlogDraftResponse from(BlogDraft draft) {
        return BlogDraftResponse.builder()
                .draftId(draft.getId())
                .noteId(draft.getNote().getId())
                .title(draft.getTitle())
                .content(draft.getContent())
                .exportUrl(draft.getExportUrl())
                .createdAt(draft.getCreatedAt())
                .build();
    }
}