package com.devnote.domain.auth.service;

import com.devnote.domain.user.entity.User;
import com.devnote.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String githubId = String.valueOf(attributes.get("id"));
        String username = (String) attributes.get("login");
        String email = (String) attributes.get("email");
        String profileImage = (String) attributes.get("avatar_url");
        String githubToken = userRequest.getAccessToken().getTokenValue();

        User user = userRepository.findByGithubId(githubId)
                .map(existing -> existing.updateOAuthInfo(username, email, profileImage, githubToken))
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .githubId(githubId)
                                .username(username)
                                .email(email)
                                .profileImage(profileImage)
                                .githubToken(githubToken)
                                .build()
                ));

        return new CustomOAuth2User(user, attributes);
    }
}
