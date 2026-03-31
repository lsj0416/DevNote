package com.devnote.global.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing          // @CreatedDate, @LastModifiedDate 어노테이션이 실제 동작하려면 JPA Auditing이 활성화 되어 있어야 함
@Configuration
public class JpaConfig {
    // BaseEntity의 @CreatedDate, @LastModifiedDate 활성화

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                .registerModule(new JavaTimeModule()) // JavaTimeModule: LocalDateTime 등 Java 8 날짜/시간 타입을 Jackson이 처리할 수 있도록 지원하는 모듈
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS); // 날짜를 타임스탬프 숫자가 아닌 "2026-03-01T12:00:00" 문자열 형식으로 직렬화
    }
}
