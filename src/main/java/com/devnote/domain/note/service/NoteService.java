package com.devnote.domain.note.service;

import com.devnote.domain.analysis.dto.NoteCreateData;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NoteService {
    public Long saveNote(Long userId, Long jobId, NoteCreateData data) {
        // TODO: feature/note에서 구현
        throw new UnsupportedOperationException("feature/note에서 구현 예정");
    }
}
