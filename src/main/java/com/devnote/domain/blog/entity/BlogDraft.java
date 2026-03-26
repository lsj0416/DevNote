package com.devnote.domain.blog.entity;

import com.devnote.domain.note.entity.Note;
import com.devnote.domain.user.entity.User;
import com.devnote.global.config.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "blog_drafts",
        indexes = {
                @Index(name = "idx_blog_drafts_note_id", columnList = "note_id", unique = true) // unique: Note와 1:1 관계 보장
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BlogDraft extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false, unique = true) // unique: 하나의 Note는 하나의 BlogDraft만 가질 수 있음
    private Note note;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 500)
    private String exportUrl; // S3 export 후 채워지는 필드 — 초기값 null

    @Builder
    public BlogDraft(User user, Note note, String title, String content) {
        this.user = user;
        this.note = note;
        this.title = title;
        this.content = content;
    }

    public void updateExportUrl(String exportUrl) {
        this.exportUrl = exportUrl;
    }
}