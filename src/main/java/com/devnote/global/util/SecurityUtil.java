package com.devnote.global.util;

import com.devnote.global.exception.BusinessException;
import com.devnote.global.exception.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtil {

    private SecurityUtil() {}

    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        try {
            return (Long) authentication.getPrincipal();
        } catch (ClassCastException e) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
    }
}
