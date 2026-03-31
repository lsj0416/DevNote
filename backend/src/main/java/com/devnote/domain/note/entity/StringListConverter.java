package com.devnote.domain.note.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference; // TypeReference: 제네릭 타입(List<String>)을 Jackson이 인식할 수 있도록 타입 정보를 전달하는 클래스
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter; // AttributeConverter: Java 필드 타입 ↔ DB 컬럼 타입 변환을 정의하는 JPA 인터페이스
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;

@Converter // JPA가 이 클래스를 변환기로 인식하도록 등록
public class StringListConverter implements AttributeConverter<List<String>, String> {

    // ObjectMapper를 static으로 선언 — 변환기는 매 호출마다 생성되므로 인스턴스를 공유해서 비용 절감
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        // Java List → JSON 문자열 ("["JWT","OAuth2"]") 로 변환해서 DB에 저장
        if (attribute == null || attribute.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(attribute); // writeValueAsString(): 객체를 JSON 문자열로 직렬화
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        // DB의 JSON 문자열 → Java List 로 변환해서 엔티티 필드에 세팅
        if (dbData == null || dbData.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(dbData, new TypeReference<List<String>>() {}); // TypeReference: List<String> 제네릭 타입 정보를 런타임에 전달
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }
}