# ── 1단계: 빌드 ──────────────────────────────────────────────────────────────
# AS builder: 이 스테이지에 이름을 붙여 2단계에서 참조할 수 있게 함
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# 의존성 레이어 캐싱 — gradle 파일이 바뀌지 않으면 이 레이어는 재사용
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# gradlew에 실행 권한 부여
RUN chmod +x gradlew

# 의존성만 먼저 다운로드 — 소스 변경 시 이 레이어는 캐시 유지
RUN ./gradlew dependencies --no-daemon

# 소스 복사 후 빌드
COPY src src
RUN ./gradlew bootJar --no-daemon -x test  # -x test: 빌드 시 테스트 생략 (CI에서 별도 실행)

# ── 2단계: 실행 ──────────────────────────────────────────────────────────────
# JRE만 포함한 경량 이미지 사용 — JDK 불필요, 이미지 크기 절감
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# 빌드 스테이지에서 생성된 jar만 복사 — 빌드 도구, 소스코드는 최종 이미지에 포함되지 않음
COPY --from=builder /app/build/libs/*.jar app.jar

# 컨테이너가 사용하는 포트 명시 (실제 포트 바인딩은 docker run -p 또는 compose에서 설정)
EXPOSE 8080

# spring.profiles.active는 환경변수로 주입 — 운영: prod, 로컬: local
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:prod}", "app.jar"]