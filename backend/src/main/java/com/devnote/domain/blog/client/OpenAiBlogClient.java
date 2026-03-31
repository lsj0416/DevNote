package com.devnote.domain.blog.client;

import com.devnote.domain.note.entity.Note;
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
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAiBlogClient {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.blog-model}")
    private String blogModel;

    @Value("${openai.timeout}")
    private long timeoutMs;

    private static final String OPENAI_BASE_URL = "https://api.openai.com";

    /**
     * 학습 노트를 기반으로 블로그 초안을 생성합니다.
     * OpenAiNoteClient와 달리 재시도 없음 — 블로그 초안은 사용자가 수동으로 재요청 가능
     *
     * @return [title, content] 배열
     */
    public String[] generateBlogDraft(Note note) {
        String userPrompt = buildUserPrompt(note);

        Map<String, Object> requestBody = Map.of(
                "model", blogModel,
                "temperature", 0.6,     // 자연스러운 글쓰기를 위해 노트 생성(0.3)보다 높게 설정
                "max_tokens", 3000,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt()),
                        Map.of("role", "user",   "content", userPrompt)
                )
        );

        WebClient client = webClientBuilder
                .baseUrl(OPENAI_BASE_URL)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();

        try {
            JsonNode response = client.post()
                    .uri("/v1/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(Duration.ofMillis(timeoutMs))
                    .block();

            if (response == null) {
                throw new BusinessException(ErrorCode.AI_API_ERROR);
            }

            String content = response
                    .path("choices").get(0)
                    .path("message")
                    .path("content").asText();

            return parseResponse(content);

        } catch (WebClientResponseException e) {
            log.error("OpenAI 블로그 초안 생성 오류: status={}", e.getStatusCode());
            throw new BusinessException(ErrorCode.AI_API_ERROR);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("OpenAI 블로그 초안 생성 중 예외: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AI_API_ERROR);
        }
    }

    // ── 내부 메서드 ──────────────────────────────────────────────────────────────

    private String[] parseResponse(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            String title   = root.path("title").asText("");
            String content = root.path("content").asText("");
            return new String[]{title, content};
        } catch (JsonProcessingException e) {
            log.warn("블로그 초안 JSON 파싱 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AI_API_ERROR);
        }
    }

    private String systemPrompt() {
        return """
                You are a technical blog writing assistant.
                Write a Korean developer blog post based on the given learning note.
                Always respond in valid JSON format only. Do not include any explanation outside of JSON.
                """;
    }

    private String buildUserPrompt(Note note) {
        return """
                아래 학습 노트를 바탕으로 개발자 블로그 포스트 초안을 JSON으로 작성해줘.

                [학습 노트]
                - 요약: %s
                - 핵심 개념: %s
                - 아키텍처: %s
                - 학습 포인트: %s

                블로그 구조는 아래를 따라줘:
                1. 서론 (이 프로젝트를 왜 분석했는지)
                2. 프로젝트 개요 (summary 기반)
                3. 아키텍처 설명 (architecture 기반)
                4. 배운 점 (learningPoints 기반)
                5. 결론

                아래 JSON 형식으로만 응답해줘:
                {
                  "title": "블로그 포스트 제목",
                  "content": "블로그 본문 (Markdown 형식)"
                }
                """.formatted(
                note.getSummary(),
                String.join(", ", note.getConcepts()),
                note.getArchitecture(),
                String.join(", ", note.getLearningPoints())
        );
    }
}