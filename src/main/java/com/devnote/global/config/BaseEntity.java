package com.devnote.global.config;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Getter
@MappedSuperclass                                   // 이 클래스는 테이블로 만들지 말고, 상속받는 Entity들의 컬럼으로만 사용
@EntityListeners(AuditingEntityListener.class)      // 이 리스너가 Entity의 생성/수정 이벤트를 감지해서 자동으로 값을 채워줌
public class BaseEntity {

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
