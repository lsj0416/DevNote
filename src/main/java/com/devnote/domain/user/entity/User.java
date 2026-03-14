package com.devnote.domain.user.entity;

import com.devnote.global.config.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false, unique = true, length = 100)
    private String githubId;

    @Column(nullable = false, length = 100)
    private String username;

    @Column(length = 255)
    private String email;

    @Column(length = 500)
    private String profileImage;

    @Column(columnDefinition = "TEXT")
    private String githubToken;

    @Builder
    public User(String githubId, String username, String email,
                String profileImage, String githubToken) {
        this.githubId = githubId;
        this.username = username;
        this.email = email;
        this.profileImage = profileImage;
        this.githubToken = githubToken;
    }

    public User updateOAuthInfo(String username, String email,
                                String profileImage, String githubToken) {
        this.username = username;
        this.email = email;
        this.profileImage = profileImage;
        this.githubToken = githubToken;
        return this;
    }

    public void updateUsername(String username) {
        this.username = username;
    }
}
