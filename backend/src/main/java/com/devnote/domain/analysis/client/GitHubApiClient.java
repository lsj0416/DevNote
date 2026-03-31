package com.devnote.domain.analysis.client;

import com.devnote.domain.analysis.dto.GitHubRepoContext;
import com.devnote.global.exception.BusinessException;
import com.devnote.global.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class GitHubApiClient {

    // WebClient 인스턴스를 설정(baseUrl, 헤더 등)과 함께 생성하는 빌더
    private final WebClient.Builder webClientBuilder;

    @Value("${github.api-base-url}")
    private String baseUrl;

    private static final int README_MAX_LENGTH = 3000;
    private static final int DIRECTORY_MAX_DEPTH = 3;
    private static final Pattern REPO_URL_PATTERN =
            Pattern.compile("https://github\\.com/([\\w.-]+)/([\\w.-]+)/?");

    /**
     * GitHub repo URL을 파싱해서 owner / repoName 을 추출하고,
     * README + 디렉토리 구조 + 메타데이터를 수집합니다.
     *
     * @param repoUrl  사용자가 입력한 GitHub repo URL
     * @param token    GitHub OAuth access token (private repo 접근용)
     */
    public GitHubRepoContext fetchRepoContext(String repoUrl, String token) {
        String[] parsed = parseRepoUrl(repoUrl);
        String owner = parsed[0];
        String repoName = parsed[1];

        WebClient client = buildClient(token);

        // 1. repo 메타데이터 + 최신 커밋 SHA
        JsonNode repoMeta = fetchRepoMeta(client, owner, repoName);
        String commitSha = fetchLastestCommitSha(client, owner, repoName);

        // 2. README
        String readme = fetchReadme(client, owner, repoName);

        // 3. 디렉토리 구조 (depth 3 이하)
        String directoryTree = fetchDirectoryTree(client, owner, repoName, commitSha);

        // 4. topics
        List<String> topics = new ArrayList<>();
        JsonNode topicsNode = repoMeta.path("topics");  // .path(): 해당 키가 없어도 NullPointerException 없이 MissingNode를 반환하는 안전한 접근 메서드
        if (topicsNode.isArray()) {
            topicsNode.forEach(t -> topics.add(t.asText()));    // .asText(): JsonNode의 값을 String으로 변환
        }

        return GitHubRepoContext.builder()
                .owner(owner)
                .repoName(repoName)
                .description(repoMeta.path("description").asText(""))   // asText("기본값"): 키가 없거나 null이면 기본값 반환
                .language(repoMeta.path("language").asText(""))
                .topics(topics)
                .stars(repoMeta.path("stargazers_count").asInt())   // asInt(): JsonNode 값은 int로 변환
                .readme(readme)
                .directoryTree(directoryTree)
                .commitSha(commitSha)
                .build();
    }

    // ── 내부 메서드 ──────────────────────────────────────────────────────────────

    private String[] parseRepoUrl(String repoUrl) {
        Matcher m = REPO_URL_PATTERN.matcher(repoUrl);
        if (!m.find()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }
        return new String[]{m.group(1), m.group(2)};    // .group(n): 정규식에서 n번째 캡처 그룹 값 반환
    }

    private WebClient buildClient(String token) {
        return webClientBuilder
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + token)
                .defaultHeader("Accept", "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
                .build();
    }

    private JsonNode fetchRepoMeta(WebClient client, String owner, String repo) {
        try {
            return client.get()
                    .uri("/repos/{owner}/{repo}", owner, repo)  // {변수} 자리에 값을 순서대로 바인딩
                    .retrieve()                     // 응답을 받아 처리하는 단계로 진입
                    .bodyToMono(JsonNode.class)     // 응답 바디를 단일 객체(Mono)로 변환 -> Mono는 0 또는 1개의 비동기 결과를 담는 Reactor 타입
                    .block();                       // 비동기 결과를 동기적으로 기다림 - @Async 스레드 안에서만 사용
        } catch (WebClientResponseException e) {
            log.error("GitHub repo 메타데이터 조회 실패: {}/{} status={}", owner, repo, e.getStatusCode());
            throw new BusinessException(ErrorCode.GITHUB_API_ERROR);
        }
    }

    private String fetchLastestCommitSha(WebClient client, String owner, String repo) {
        try {
            JsonNode commits = client.get()
                    .uri("/repos/{owner}/{repo}/commits?per_page=1", owner, repo)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (commits != null && commits.isArray() && !commits.isEmpty()) {
                return commits.get(0).path("sha").asText("");
            }
            return "";
        } catch (WebClientResponseException e) {
            log.warn("최신 커밋 SHA 조회 실패: {}/{}", owner, repo);
            return "";  // 캐싱 키로만 사용되므로 실패해도 빈 문자열로 진행
        }
    }

    private String fetchReadme(WebClient client, String owner, String repo) {
        try {
            JsonNode readmeNode = client.get()
                    .uri("/repos/{owner}/{repo}/readme", owner, repo)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (readmeNode == null) return "";

            // GitHub API는 README 내용을 Base64로 인코딩해서 내려줌
            // content 필드에 줄바꿈(\n)이 포함되어 있어 제거 후 디코딩
            String encoded = readmeNode.path("content").asText("").replace("\n", "");
            String decoded = new String(Base64.getDecoder().decode(encoded));   // Base64 문자열 -> 원본 바이트 배열로 복원

            return decoded.length() > README_MAX_LENGTH
                    ? decoded.substring(0, README_MAX_LENGTH)
                    : decoded;
        } catch (WebClientResponseException e) {
            log.warn("README 조회 실패: {}/{} (README 없는 repo일 수 있음)", owner, repo);
            return "";
        }
    }

    private String fetchDirectoryTree(WebClient client, String owner, String repo, String commitSha) {
        try {
            String sha = (commitSha == null || commitSha.isBlank()) ? "HEAD" : commitSha;

            JsonNode treeNode = client.get()
                    .uri("/repos/{owner}/{repo}/git/trees/{sha}?recursive=1", owner, repo, sha)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            if (treeNode == null) return "";

            StringBuilder sb = new StringBuilder();
            JsonNode tree = treeNode.path("tree");

            if (tree.isArray()) {
                tree.forEach(node -> {
                    String path = node.path("path").asText();
                    int depth = (int) path.chars().filter(c -> c == '/').count();   // 문자열을 char 스트림으로 변환 - '/' 개수를 세서 디렉토리 깊이 계산
                    if (depth < DIRECTORY_MAX_DEPTH) {
                        sb.append("  ".repeat(depth))    // depth만큼 들여쓰기해서 트리 구조 표현
                                .append(path.contains("/") ? path.substring(path.lastIndexOf('/') + 1) : path)
                                .append(node.path("type").asText().equals("blob") ? "" : "/")   // blob: 파일, tree: 디렉토리 - 디렉토리면 "/" 추가
                                .append("\n");
                    }
                });
            }

            return sb.toString();

        } catch (WebClientResponseException e) {
            log.warn("디렉토리 구조 조회 실패: {}/{}", owner, repo);
            return "";
        }
    }

}
