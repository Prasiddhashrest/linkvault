package com.linkvault.bookmarks;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BookmarkRequest(
    @NotBlank(message = "Title is required") @Size(max = 160) String title,
    @NotBlank(message = "URL is required") @Size(max = 2048) String url,
    @NotBlank(message = "Category is required") @Size(max = 60) String category,
    @Size(max = 2000) String notes,
    boolean favorite
) {}
