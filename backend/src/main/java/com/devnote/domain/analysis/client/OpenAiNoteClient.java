package com.devnote.domain.analysis.client;

import com.devnote.domain.analysis.dto.GitHubRepoContext;
import com.devnote.domain.analysis.dto.NoteCreateData;
import com.devnote.global.exception.BusinessException;
import com.devnote.global.exception.ErrorCode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAiNoteClient {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.note-model}")
    private String noteModel;

    @Value("${openai.timeout}")
    private long timeoutMs;

    private static final String OPENAI_BASE_URL = "https://api.openai.com";
    private static final int MAX_RETRY = 2;
    private static final int README_FALLBACK_LENGTH = 1500;

    /**
     * GitHub repo 컨텍스트를 받아 OpenAI로 학습 노트 JSON을 생성합니다.
     * 실패 시 최대 2회 재시도 (prompt.md 재시도 전략 참고).
     */
    public NoteCreateData generateNote(GitHubRepoContext context) {
        String readme = context.getReadme();

        for (int attempt = 1; attempt <= MAX_RETRY + 1; attempt++) {
            double temperature = (attempt == 1) ? 0.3 : 0.0;

            // 3차 시도: README 1,500자로 재truncate
            if (attempt == MAX_RETRY + 1) {
                readme = truncate(readme, README_FALLBACK_LENGTH);
            }

            try {
                String responseText = callOpenAi(buildUserPrompt(context, readme), temperature);
                return parseResponse(responseText, context.getRepoName());
            } catch (BusinessException e) {
                if (attempt > MAX_RETRY) {
                    log.error("OpenAI 노트 생성 최종 실패 (시도 {}회): {}", attempt, e.getMessage());
                    throw e;
                }
                log.warn("OpenAI 노트 생성 실패, 재시도 {}/{}: {}", attempt, MAX_RETRY, e.getMessage());
            }
        }

        throw new BusinessException(ErrorCode.AI_API_ERROR);
    }

    // ── 내부 메서드 ──────────────────────────────────────────────────────────────

    private String callOpenAi(String userPrompt, double temperature) {
        WebClient client = webClientBuilder
                .baseUrl(OPENAI_BASE_URL)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();

        // Map.of(): 불변 Map 생성 - OpenAI 요청 바디를 key-value 형태로 구성
        Map<String, Object> requestBody = Map.of(
                "model", noteModel,
                "temperature", temperature,
                "max_tokens", 2000,
                "response_format", Map.of("type", "json_object"),   // json_object: OpenAI가 반드시 유효한 JSON만 반환하도록 강제하는 옵션
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt()),
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        try {
            JsonNode response = client.post()
                    .uri("/v1/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)    // 요청 바디의 Content-Type 헤더를 application/json으로 지정
                    .bodyValue(requestBody)                     // 요청 바디에 객체를 직렬화해서 담음
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(Duration.ofMillis(timeoutMs))      // 지정 시간 안에 응답이 없으면 Timeout Exception 발생
                    .block();

            if (response == null) {
                throw new BusinessException(ErrorCode.AI_API_ERROR);
            }

            // OpenAI 응답 구조: choices[0].message.content 에 실제 텍스트가 담김
            return response
                    .path("choices").get(0)
                    .path("message")
                    .path("content").asText();
        } catch (WebClientResponseException e) {
            log.error("OpenAI API 호출 오류: status={}", e.getStatusCode());
            throw new BusinessException(ErrorCode.AI_API_ERROR);
        } catch (Exception e) {
            log.error("OpenAI API 호출 중 예외: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AI_API_ERROR);
        }
    }

    private NoteCreateData parseResponse(String json, String repoName) {
        try {
            JsonNode root = objectMapper.readTree(json);    // JSON 문자열을 JsonNode 트리로 파싱

            List<String> concepts = toStringList(root.path("concepts"));
            List<String> learningPoints = toStringList(root.path("learningPoints"));
            List<String> techStack = toStringList(root.path("techStack"));
            String summary = root.path("summary").asText("");
            String architecture = root.path("architecture").asText("");
            String difficulty = root.path("difficulty").asText("INTERMEDIATE");

            String rawMarkdown = buildRawMarkdown(repoName, summary, concepts,
                    architecture, learningPoints, techStack, difficulty);

            return NoteCreateData.builder()
                    .title(repoName + " 학습 노트")
                    .summary(summary)
                    .concepts(concepts)
                    .architecture(architecture)
                    .learningPoints(learningPoints)
                    .techStack(techStack)
                    .difficulty(difficulty)
                    .rawMarkdown(rawMarkdown)
                    .build();

        } catch (JsonProcessingException e) {
            log.warn("OpenAI 응답 JSON 파싱 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AI_API_ERROR);
        }
    }

    private List<String> toStringList(JsonNode node) {
        List<String> list = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(n -> list.add(n.asText()));
        }
        return list;
    }

    private String buildRawMarkdown(String repoName, String summary, List<String> concepts,
                                    String architecture, List<String> learningPoints,
                                    List<String> techStack, String difficulty) {
        StringBuilder sb = new StringBuilder();
        sb.append("# ").append(repoName).append(" 학습 노트\n\n");
        sb.append("## 요약\n").append(summary).append("\n\n");
        sb.append("## 핵심 개념\n");
        concepts.forEach(c -> sb.append("- ").append(c).append("\n"));
        sb.append("\n## 아키텍처\n").append(architecture).append("\n\n");
        sb.append("## 학습 포인트\n");
        learningPoints.forEach(lp -> sb.append("- ").append(lp).append("\n"));
        sb.append("\n## 기술 스택\n");
        techStack.forEach(t -> sb.append("- ").append(t).append("\n"));
        sb.append("\n## 난이도: ").append(difficulty).append("\n");
        return sb.toString();
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        return text.length() > maxLength ? text.substring(0, maxLength) : text;
    }

    private String systemPrompt() {
        return """
                You are a developer education assistant.
                Analyze the given GitHub repository information and generate a structured learning note in Korean.
                Always respond in valid JSON format only. Do not include any explanation outside of JSON.
                """;
    }

    private String buildUserPrompt(GitHubRepoContext ctx, String readme) {
        // 텍스트 블록("""): Java 15+ 멀티라인 문자열 — 들여쓰기와 줄바꿈을 그대로 유지
        return """
                아래 GitHub repo 정보를 분석해서 개발자 학습 노트를 JSON으로 작성해줘.
 
                [repo 메타데이터]
                - 이름: %s
                - 설명: %s
                - 주요 언어: %s
                - 토픽: %s
 
                [README]
                %s
 
                [디렉토리 구조]
                %s
 
                아래 JSON 형식으로만 응답해줘:
                {
                  "summary": "프로젝트를 1~3문장으로 요약",
                  "concepts": ["핵심 개념 키워드 배열"],
                  "architecture": "주요 구조 설명 (Markdown 형식)",
                  "learningPoints": ["이 repo에서 배울 수 있는 점 배열"],
                  "techStack": ["사용된 기술 스택 배열"],
                  "difficulty": "BEGINNER 또는 INTERMEDIATE 또는 ADVANCED"
                }
                """.formatted(
                        ctx.getRepoName(),
                        ctx.getDescription(),
                        ctx.getLanguage(),
                        String.join(", ", ctx.getTopics()),
                        readme,
                        ctx.getDirectoryTree()
        );
    }
}
