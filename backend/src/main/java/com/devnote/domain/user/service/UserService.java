package com.devnote.domain.user.service;

import com.devnote.domain.user.dto.UserResponse;
import com.devnote.domain.user.dto.UserUpdateRequest;
import com.devnote.domain.user.entity.User;
import com.devnote.domain.user.repository.UserRepository;
import com.devnote.global.exception.BusinessException;
import com.devnote.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserResponse getMe(Long userId) {
        return UserResponse.from(findById(userId));
    }

    @Transactional
    public UserResponse updateMe(Long userId, UserUpdateRequest request) {
        User user = findById(userId);
        user.updateUsername(request.getUsername());
        return UserResponse.from(user);
    }

    @Transactional
    public void deleteMe(Long userId) {
        userRepository.deleteById(userId);
    }

    private User findById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
