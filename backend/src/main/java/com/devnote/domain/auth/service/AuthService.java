package com.devnote.domain.auth.service;

import com.devnote.domain.auth.dto.RefreshRequest;
import com.devnote.domain.auth.dto.TokenResponse;
import com.devnote.domain.auth.jwt.JwtTokenProvider;
import com.devnote.global.exception.BusinessException;
import com.devnote.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String RT_PREFIX = "RT:";
    private static final Duration RT_TTL = Duration.ofDays(14);

    public TokenResponse refresh(RefreshRequest request) {
        String refreshToken = request.getRefreshToken();

        jwtTokenProvider.validateToken(refreshToken);   // 실패 시 예외 throw

        Long userId = jwtTokenProvider.getUserId(refreshToken);
        String stored = redisTemplate.opsForValue().get(RT_PREFIX + userId);

        if (stored == null) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
        }
        if (!stored.equals(refreshToken)) {
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        return new TokenResponse(jwtTokenProvider.createAccessToken(userId));
    }

    public void logout(Long userId) {
        String stored = redisTemplate.opsForValue().get(RT_PREFIX + userId);
        if (stored == null) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
        }
        redisTemplate.delete(RT_PREFIX + userId);
    }
}
