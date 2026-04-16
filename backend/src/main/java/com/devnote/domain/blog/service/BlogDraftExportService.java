package com.devnote.domain.blog.service;

import com.devnote.domain.blog.dto.BlogExportResponse;
import com.devnote.domain.blog.entity.BlogDraft;
import com.devnote.domain.blog.repository.BlogDraftRepository;
import com.devnote.global.exception.BusinessException;
import com.devnote.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlogDraftExportService {

    private final BlogDraftRepository blogDraftRepository;
    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Transactional
    public BlogExportResponse export(Long userId, Long noteId) {
        BlogDraft draft = blogDraftRepository.findByNoteIdAndUserId(noteId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BLOG_DRAFT_NOT_FOUND));

        String key = "blog-drafts/" + userId + "/" + noteId + ".md";
        byte[] content = draft.getContent().getBytes(StandardCharsets.UTF_8);

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType("text/markdown; charset=utf-8")
                            .build(),
                    RequestBody.fromBytes(content));
        } catch (Exception e) {
            log.error("[Blog] S3 업로드 실패 - userId={}, noteId={}", userId, noteId, e);
            throw new BusinessException(ErrorCode.S3_UPLOAD_FAILED);
        }

        String exportUrl = "https://" + bucket + ".s3.ap-northeast-2.amazonaws.com/" + key;
        draft.updateExportUrl(exportUrl);
        log.info("[Blog] S3 export 완료 - userId={}, noteId={}, url={}", userId, noteId, exportUrl);

        return new BlogExportResponse(exportUrl);
    }
}