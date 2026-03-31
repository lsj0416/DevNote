package com.devnote.domain.blog.service;

import com.devnote.domain.blog.dto.BlogExportResponse;
import com.devnote.domain.blog.entity.BlogDraft;
import com.devnote.domain.blog.repository.BlogDraftRepository;
import com.devnote.global.exception.BusinessException;
import com.devnote.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlogDraftExportService {

    private final BlogDraftRepository blogDraftRepository;

    /**
     * 블로그 초안을 .md 파일로 S3에 업로드하고 다운로드 URL을 반환합니다.
     * TODO: feature/infra 또는 feature/deploy에서 AWS S3 연동 구현 예정
     */
    @Transactional
    public BlogExportResponse export(Long userId, Long noteId) {
        BlogDraft draft = blogDraftRepository.findByNoteIdAndUserId(noteId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BLOG_DRAFT_NOT_FOUND));

        // TODO: S3 업로드 구현
        // 1. draft.getContent()를 .md 파일로 변환
        // 2. S3에 업로드 후 URL 획득
        // 3. draft.updateExportUrl(url) 저장
        throw new UnsupportedOperationException("S3 export는 feature/infra에서 구현 예정");
    }
}