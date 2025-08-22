package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.model.Tag;
import com.capstone_project.capstone_project.repository.TagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TagServiceTest {

    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private TagService tagService;

    private Tag testTag;

    @BeforeEach
    void setUp() {
        testTag = Tag.builder()
                .id(1)
                .name("Test Tag")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createTag_NewTag_Success() {
        // Arrange
        when(tagRepository.findByName("New Tag")).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenReturn(testTag);

        // Act
        Tag result = tagService.createTag("New Tag");

        // Assert
        assertNotNull(result);
        assertEquals("Test Tag", result.getName());
        verify(tagRepository).findByName("New Tag");
        verify(tagRepository).save(any(Tag.class));
    }

    @Test
    void createTag_ExistingTag_ReturnsExistingTag() {
        // Arrange
        when(tagRepository.findByName("Existing Tag")).thenReturn(Optional.of(testTag));

        // Act
        Tag result = tagService.createTag("Existing Tag");

        // Assert
        assertNotNull(result);
        assertEquals(testTag, result);
        verify(tagRepository).findByName("Existing Tag");
        verify(tagRepository, never()).save(any(Tag.class));
    }

    @Test
    void createTag_WithWhitespace_TrimsName() {
        // Arrange
        when(tagRepository.findByName("Test Tag")).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenReturn(testTag);

        // Act
        Tag result = tagService.createTag("  Test Tag  ");

        // Assert
        assertNotNull(result);
        verify(tagRepository).findByName("Test Tag");
        verify(tagRepository).save(any(Tag.class));
    }

    @Test
    void findByName_ExistingTag_ReturnsTag() {
        // Arrange
        when(tagRepository.findByName("Test Tag")).thenReturn(Optional.of(testTag));

        // Act
        Optional<Tag> result = tagService.findByName("Test Tag");

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testTag, result.get());
        verify(tagRepository).findByName("Test Tag");
    }

    @Test
    void findByName_NonExistingTag_ReturnsEmpty() {
        // Arrange
        when(tagRepository.findByName("Non Existing")).thenReturn(Optional.empty());

        // Act
        Optional<Tag> result = tagService.findByName("Non Existing");

        // Assert
        assertFalse(result.isPresent());
        verify(tagRepository).findByName("Non Existing");
    }

    @Test
    void searchTags_WithValidTerm_ReturnsMatchingTags() {
        // Arrange
        Tag tag1 = Tag.builder().id(1).name("Java Programming").build();
        Tag tag2 = Tag.builder().id(2).name("JavaScript").build();
        when(tagRepository.findByNameContainingIgnoreCase("java")).thenReturn(Arrays.asList(tag1, tag2));

        // Act
        List<Tag> result = tagService.searchTags("java");

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.contains(tag1));
        assertTrue(result.contains(tag2));
        verify(tagRepository).findByNameContainingIgnoreCase("java");
    }

    @Test
    void searchTags_WithNullTerm_ReturnsEmptyList() {
        // Act
        List<Tag> result = tagService.searchTags(null);

        // Assert
        assertTrue(result.isEmpty());
        verify(tagRepository, never()).findByNameContainingIgnoreCase(anyString());
    }

    @Test
    void searchTags_WithEmptyTerm_ReturnsEmptyList() {
        // Act
        List<Tag> result = tagService.searchTags("   ");

        // Assert
        assertTrue(result.isEmpty());
        verify(tagRepository, never()).findByNameContainingIgnoreCase(anyString());
    }

    @Test
    void searchTags_WithWhitespace_TrimsTerm() {
        // Arrange
        when(tagRepository.findByNameContainingIgnoreCase("test")).thenReturn(Arrays.asList(testTag));

        // Act
        List<Tag> result = tagService.searchTags("  test  ");

        // Assert
        assertEquals(1, result.size());
        verify(tagRepository).findByNameContainingIgnoreCase("test");
    }

    @Test
    void getAllTags_ReturnsAllTags() {
        // Arrange
        Tag tag1 = Tag.builder().id(1).name("Tag 1").build();
        Tag tag2 = Tag.builder().id(2).name("Tag 2").build();
        when(tagRepository.findAll()).thenReturn(Arrays.asList(tag1, tag2));

        // Act
        List<Tag> result = tagService.getAllTags();

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.contains(tag1));
        assertTrue(result.contains(tag2));
        verify(tagRepository).findAll();
    }

    @Test
    void getTagsWithUsageCount_WithSearchTerm_ReturnsMatchingTags() {
        // Arrange
        Object[] result1 = { testTag, 5L };
        Object[] result2 = { Tag.builder().id(2).name("Tag 2").build(), 3L };
        when(tagRepository.findTagsWithUsageCount("test")).thenReturn(Arrays.asList(result1, result2));

        // Act
        List<Map<String, Object>> result = tagService.getTagsWithUsageCount("test");

        // Assert
        assertEquals(2, result.size());
        assertEquals(1, result.get(0).get("id"));
        assertEquals("Test Tag", result.get(0).get("name"));
        assertEquals(5L, result.get(0).get("count"));
        verify(tagRepository).findTagsWithUsageCount("test");
    }

    @Test
    void getTagsWithUsageCount_WithEmptySearchTerm_ReturnsAllTags() {
        // Arrange
        Object[] result1 = { testTag, 5L };
        List<Object[]> results = new ArrayList<>();
        results.add(result1);
        when(tagRepository.findAllTagsWithUsageCount()).thenReturn(results);

        // Act
        List<Map<String, Object>> result = tagService.getTagsWithUsageCount("");

        // Assert
        assertEquals(1, result.size());
        assertEquals(1, result.get(0).get("id"));
        assertEquals("Test Tag", result.get(0).get("name"));
        assertEquals(5L, result.get(0).get("count"));
        verify(tagRepository).findAllTagsWithUsageCount();
    }

    @Test
    void findOrCreateTags_WithNewTags_CreatesAndReturnsTags() {
        // Arrange
        Tag newTag1 = Tag.builder().id(1).name("New Tag 1").build();
        Tag newTag2 = Tag.builder().id(2).name("New Tag 2").build();
        when(tagRepository.findByName("New Tag 1")).thenReturn(Optional.empty());
        when(tagRepository.findByName("New Tag 2")).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenReturn(newTag1, newTag2);

        // Act
        List<Tag> result = tagService.findOrCreateTags(Arrays.asList("New Tag 1", "New Tag 2"));

        // Assert
        assertEquals(2, result.size());
        verify(tagRepository).findByName("New Tag 1");
        verify(tagRepository).findByName("New Tag 2");
        verify(tagRepository, times(2)).save(any(Tag.class));
    }

    @Test
    void findOrCreateTags_WithExistingTags_ReturnsExistingTags() {
        // Arrange
        Tag existingTag1 = Tag.builder().id(1).name("Existing Tag 1").build();
        Tag existingTag2 = Tag.builder().id(2).name("Existing Tag 2").build();
        when(tagRepository.findByName("Existing Tag 1")).thenReturn(Optional.of(existingTag1));
        when(tagRepository.findByName("Existing Tag 2")).thenReturn(Optional.of(existingTag2));

        // Act
        List<Tag> result = tagService.findOrCreateTags(Arrays.asList("Existing Tag 1", "Existing Tag 2"));

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.contains(existingTag1));
        assertTrue(result.contains(existingTag2));
        verify(tagRepository).findByName("Existing Tag 1");
        verify(tagRepository).findByName("Existing Tag 2");
        verify(tagRepository, never()).save(any(Tag.class));
    }

    @Test
    void findOrCreateTags_WithEmptyTags_ReturnsEmptyList() {
        // Act
        List<Tag> result = tagService.findOrCreateTags(Arrays.asList("", "   ", null));

        // Assert
        assertTrue(result.isEmpty());
        verify(tagRepository, never()).findByName(anyString());
        verify(tagRepository, never()).save(any(Tag.class));
    }
}
