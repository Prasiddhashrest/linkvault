package com.linkvault.bookmarks;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookmarks")
public class BookmarkController {
    private final BookmarkService service;
    public BookmarkController(BookmarkService service) { this.service = service; }
    @GetMapping public List<Bookmark> list() { return service.all(); }
    @GetMapping("/{id}") public Bookmark get(@PathVariable long id) { return service.find(id); }
    @PostMapping public ResponseEntity<Bookmark> create(@Valid @RequestBody BookmarkRequest request) {
        Bookmark saved = service.create(request);
        return ResponseEntity.created(URI.create("/api/bookmarks/" + saved.getId())).body(saved);
    }
    @PutMapping("/{id}") public Bookmark update(@PathVariable long id, @Valid @RequestBody BookmarkRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
