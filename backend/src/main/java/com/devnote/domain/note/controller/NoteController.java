package com.devnote.domain.note.controller;

import com.devnote.domain.note.dto.NoteListResponse;
import com.devnote.domain.note.dto.NoteResponse;
import com.devnote.domain.note.service.NoteService;
import com.devnote.global.response.ApiResponse;
import com.devnote.global.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Note", description = "노트 API")
@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @Operation(summary = "내 노트 목록 조회")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NoteListResponse>>> getNoteList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(
                noteService.getNoteList(SecurityUtil.getCurrentUserId(), page, size)));
    }

    @Operation(summary = "노트 상세 조회")
    @GetMapping("/{noteId}")
    public ResponseEntity<ApiResponse<NoteResponse>> getNote(
            @PathVariable Long noteId) {
        return ResponseEntity.ok(ApiResponse.ok(
                noteService.getNote(SecurityUtil.getCurrentUserId(), noteId)));
    }

    @Operation(summary = "노트 삭제")
    @DeleteMapping("/{noteId}")
    public ResponseEntity<ApiResponse<Void>> deleteNote(
            @PathVariable Long noteId) {
        noteService.deleteNote(SecurityUtil.getCurrentUserId(), noteId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}