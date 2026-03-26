package com.devnote.domain.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BlogExportResponse {

    private String exportUrl; // S3에 업로드된 Markdown 파일의 다운로드 URL
}