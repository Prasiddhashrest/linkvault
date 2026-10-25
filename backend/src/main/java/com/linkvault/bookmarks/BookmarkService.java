package com.linkvault.bookmarks;

import java.net.URI;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BookmarkService {
    private final BookmarkRepository repository;
    public BookmarkService(BookmarkRepository repository) { this.repository = repository; }

    public List<Bookmark> all() { return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")); }
    public Bookmark find(long id) { return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bookmark not found")); }
    public Bookmark create(BookmarkRequest request) { return repository.save(apply(new Bookmark(), request)); }
    public Bookmark update(long id, BookmarkRequest request) { return repository.save(apply(find(id), request)); }
    public void delete(long id) { repository.delete(find(id)); }

    private Bookmark apply(Bookmark bookmark, BookmarkRequest request) {
        validateUrl(request.url());
        bookmark.setTitle(request.title().trim());
        bookmark.setUrl(request.url().trim());
        bookmark.setCategory(request.category().trim());
        bookmark.setNotes(request.notes() == null ? "" : request.notes().trim());
        bookmark.setFavorite(request.favorite());
        return bookmark;
    }

    static void validateUrl(String url) {
        try {
            URI uri = new URI(url.trim());
            String scheme = uri.getScheme();
            if (scheme == null || !(scheme.toLowerCase(Locale.ROOT).equals("https") || scheme.toLowerCase(Locale.ROOT).equals("http")) || uri.getHost() == null || uri.getHost().isBlank()) {
                throw new IllegalArgumentException();
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid http:// or https:// URL");
        }
    }
}
