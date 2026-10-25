package com.linkvault.bookmarks;

import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:linkvaulttest;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookmarkControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper objectMapper;
    private final String sample = "{\"title\":\"React Documentation\",\"url\":\"https://react.dev\",\"category\":\"Development\",\"notes\":\"Docs\",\"favorite\":false}";

    @Test void createAndList() throws Exception {
        mvc.perform(post("/api/bookmarks").contentType(MediaType.APPLICATION_JSON).content(sample))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.title").value("React Documentation"));
        mvc.perform(get("/api/bookmarks")).andExpect(status().isOk()).andExpect(jsonPath("$[0].url").exists());
    }
    @Test void updateAndDelete() throws Exception {
        MvcResult created = mvc.perform(post("/api/bookmarks").contentType(MediaType.APPLICATION_JSON).content(sample))
            .andExpect(status().isCreated()).andReturn();
        JsonNode item = objectMapper.readTree(created.getResponse().getContentAsString());
        long id = item.get("id").asLong();
        mvc.perform(put("/api/bookmarks/" + id).contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"Updated\",\"url\":\"https://react.dev\",\"category\":\"Learning\",\"favorite\":true}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Updated"))
            .andExpect(jsonPath("$.favorite").value(true));
        mvc.perform(delete("/api/bookmarks/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/bookmarks/" + id)).andExpect(status().isNotFound());
    }
    @Test void rejectsMissingTitle() throws Exception {
        mvc.perform(post("/api/bookmarks").contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"\",\"url\":\"https://react.dev\",\"category\":\"Development\"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").exists());
    }
    @Test void rejectsUnsupportedUrlScheme() throws Exception {
        mvc.perform(post("/api/bookmarks").contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"bad\",\"url\":\"javascript:alert(1)\",\"category\":\"Development\"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").exists());
    }
    @Test void missingBookmarkReturns404() throws Exception {
        mvc.perform(delete("/api/bookmarks/999999999")).andExpect(status().isNotFound());
    }
}
