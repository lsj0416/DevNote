package com.devnote.domain.note.entity;

import com.devnote.domain.analysis.entity.AnalysisJob;
import com.devnote.domain.user.entity.User;
import com.devnote.global.config.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(
        name = "notes",
        indexes = {
                @Index(name = "idx_notes_user_id", columnList = "user_id"),
                @Index(name = "idx_notes_job_id",  columnList = "job_id", unique = true) // unique: AnalysisJob과 1:1 관계 보장
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Note extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false, unique = true) // unique: 하나의 Job은 하나의 Note만 생성 가능
    private AnalysisJob job;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String summary;

    // @Convert: Java 타입(List<String>)과 DB 타입(JSON 문자열) 사이의 변환을 담당하는 어노테이션
    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT") // PostgreSQL JSONB 대신 TEXT로 저장 (MVP 단계)
    private List<String> concepts;

    @Column(columnDefinition = "TEXT")
    private String architecture;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> learningPoints;

    @Column(columnDefinition = "TEXT")
    private String rawMarkdown;

    @Builder
    public Note(User user, AnalysisJob job, String title, String summary,
                List<String> concepts, String architecture,
                List<String> learningPoints, String rawMarkdown) {
        this.user = user;
        this.job = job;
        this.title = title;
        this.summary = summary;
        this.concepts = concepts;
        this.architecture = architecture;
        this.learningPoints = learningPoints;
        this.rawMarkdown = rawMarkdown;
    }
}