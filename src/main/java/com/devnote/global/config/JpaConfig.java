package com.devnote.global.config;

import org.springframework.beans.factory.annotation.Configurable;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing          // @CreatedDate, @LastModifiedDate 어노테이션이 실제 동작하려면 JPA Auditing이 활성화 되어 있어야 함
@Configurable
public class JpaConfig {
    // BaseEntity의 @CreatedDate, @LastModifiedDate 활성화
}
