package com.devnote.domain.auth.jwt;

import com.devnote.global.exception.BusinessException;
import com.devnote.global.exception.ErrorCode;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(Long userId) {
        return createToken(userId, accessTokenExpiration);
    }

    public String createRefreshToken(Long userId) {
        return createToken(userId, refreshTokenExpiration);
    }

    public String createToken(Long userId, long expiration) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))    // 토큰 주체 (userId를 문자열로)
                .issuedAt(now)                      // 발급 시각
                .expiration(new Date(now.getTime() + expiration))   // 만료 시각
                .signWith(secretKey)                // 서명
                .compact();                         // 최종 토큰 문자열 생성
    }

    public Long getUserId(String token) {
        return Long.parseLong(getClaims(token).getSubject());   // subject에서 userId 문자열을 꺼내 Long으로 변환
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (ExpiredJwtException e) {   // 토큰 만료
            throw new BusinessException(ErrorCode.TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException e) {   // 위변조 / 키 불일치 또는 null / 빈 문자열
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)      // 검증에 사용할 키 지정
                .build()
                .parseSignedClaims(token)   // 서명 검증 + 파싱
                .getPayload();              // PayLoad(Claims) 반환
    }
}
