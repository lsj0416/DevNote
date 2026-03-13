package com.devnote.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@EnableAsync        // @Async 기능 활성화
@Configuration
public class AsyncConfig {

    @Bean(name = "analysisExecutor")    // 빈 이름 설정
    public Executor analysisExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);    // 기본 유지 스레드 수
        executor.setMaxPoolSize(8);     // 최대 스레드 수
        executor.setMaxPoolSize(50);    // 대기 큐 크기
        executor.setThreadNamePrefix("analysis-");  // 스레드 이름 prefix
        executor.setWaitForTasksToCompleteOnShutdown(true); // 종료 시 작업 완료 대기
        executor.setAwaitTerminationSeconds(30);            // 최대 30초 대기
        executor.initialize();
        return executor;
    }
}
