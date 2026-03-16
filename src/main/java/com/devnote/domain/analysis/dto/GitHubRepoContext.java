package com.devnote.domain.analysis.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * GitHub API에서 수집한 repo 정보를 담는 중간 전달 객체.
 * GitHubApiClient → AnalysisJobProcessor 사이에서 사용됩니다.
 */
@Getter
@Builder
public class GitHubRepoContext {

    private String owner;
    private String repoName;
    private String description;
    private String language;
    private List<String> topics;
    private int stars;
    private String readme;              // Base64 디코딩 후 최대 3,000자 truncate
    private String directoryTree;       // depth 3 이하 트리 문자열
    private String commitSha;           // 최신 커밋 SHA (캐싱 키)
}
