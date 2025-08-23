package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.dto.RatingDTO;
import com.capstone_project.capstone_project.model.Rating;
import com.capstone_project.capstone_project.model.KnowledgeItem;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.repository.RatingRepository;
import com.capstone_project.capstone_project.repository.KnowledgeItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RatingServiceTest {

    @Mock
    private RatingRepository ratingRepository;

    @Mock
    private KnowledgeItemRepository knowledgeItemRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private RatingService ratingService;

    private User testUser;
    private KnowledgeItem testKnowledgeItem;
    private Rating testRating;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user1")
                .username("testuser")
                .email("test@example.com")
                .name("Test User")
                .build();

        testKnowledgeItem = KnowledgeItem.builder()
                .id("knowledge1")
                .name("Test Knowledge")
                .description("Test Description")
                .content("Test Content")
                .createdBy("user1")
                .vaultId("vault1")
                .build();

        testRating = Rating.builder()
                .id(1)
                .ratingValue(5)
                .knowledgeItem(testKnowledgeItem)
                .user(testUser)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void addOrUpdateRating_NewRating_Success() {
        // Arrange
        when(knowledgeItemRepository.findById("knowledge1")).thenReturn(Optional.of(testKnowledgeItem));
        when(userService.findById("user1")).thenReturn(testUser);
        when(ratingRepository.findByKnowledgeItemIdAndUserId("knowledge1", "user1")).thenReturn(Optional.empty());
        when(ratingRepository.save(any(Rating.class))).thenReturn(testRating);

        // Act
        RatingDTO result = ratingService.addOrUpdateRating("knowledge1", "user1", 5);

        // Assert
        assertNotNull(result);
        assertEquals(5, result.getRatingValue());
        verify(knowledgeItemRepository).findById("knowledge1");
        verify(userService).findById("user1");
        verify(ratingRepository).findByKnowledgeItemIdAndUserId("knowledge1", "user1");
        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    void addOrUpdateRating_ExistingRating_UpdatesRating() {
        // Arrange
        Rating existingRating = Rating.builder()
                .id(1)
                .ratingValue(3)
                .knowledgeItem(testKnowledgeItem)
                .user(testUser)
                .build();
        when(knowledgeItemRepository.findById("knowledge1")).thenReturn(Optional.of(testKnowledgeItem));
        when(userService.findById("user1")).thenReturn(testUser);
        when(ratingRepository.findByKnowledgeItemIdAndUserId("knowledge1", "user1"))
                .thenReturn(Optional.of(existingRating));
        when(ratingRepository.save(any(Rating.class))).thenReturn(testRating);

        // Act
        RatingDTO result = ratingService.addOrUpdateRating("knowledge1", "user1", 5);

        // Assert
        assertNotNull(result);
        assertEquals(5, result.getRatingValue());
        verify(knowledgeItemRepository).findById("knowledge1");
        verify(userService).findById("user1");
        verify(ratingRepository).findByKnowledgeItemIdAndUserId("knowledge1", "user1");
        verify(ratingRepository).save(any(Rating.class));
    }

    @Test
    void addOrUpdateRating_KnowledgeItemNotFound_ThrowsException() {
        // Arrange
        when(knowledgeItemRepository.findById("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> ratingService.addOrUpdateRating("nonexistent", "user1", 5));
        assertEquals("Knowledge item not found", exception.getMessage());
        verify(knowledgeItemRepository).findById("nonexistent");
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void addOrUpdateRating_InvalidRating_ThrowsException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> ratingService.addOrUpdateRating("knowledge1", "user1", 6));
        assertEquals("Rating value must be between 1 and 5", exception.getMessage());
        verify(ratingRepository, never()).save(any(Rating.class));
    }

    @Test
    void getUserRating_ExistingRating_ReturnsRating() {
        // Arrange
        when(ratingRepository.findByKnowledgeItemIdAndUserId("knowledge1", "user1"))
                .thenReturn(Optional.of(testRating));

        // Act
        Integer result = ratingService.getUserRating("knowledge1", "user1");

        // Assert
        assertEquals(5, result);
        verify(ratingRepository).findByKnowledgeItemIdAndUserId("knowledge1", "user1");
    }

    @Test
    void getUserRating_NoRating_ReturnsNull() {
        // Arrange
        when(ratingRepository.findByKnowledgeItemIdAndUserId("knowledge1", "user1")).thenReturn(Optional.empty());

        // Act
        Integer result = ratingService.getUserRating("knowledge1", "user1");

        // Assert
        assertNull(result);
        verify(ratingRepository).findByKnowledgeItemIdAndUserId("knowledge1", "user1");
    }

    @Test
    void getAverageRating_WithRatings_ReturnsAverage() {
        // Arrange
        when(ratingRepository.getAverageRatingByKnowledgeItemId("knowledge1")).thenReturn(4.0);

        // Act
        Double result = ratingService.getAverageRating("knowledge1");

        // Assert
        assertEquals(4.0, result, 0.01);
        verify(ratingRepository).getAverageRatingByKnowledgeItemId("knowledge1");
    }

    @Test
    void getAverageRating_NoRatings_ReturnsNull() {
        // Arrange
        when(ratingRepository.getAverageRatingByKnowledgeItemId("knowledge1")).thenReturn(null);

        // Act
        Double result = ratingService.getAverageRating("knowledge1");

        // Assert
        assertNull(result);
        verify(ratingRepository).getAverageRatingByKnowledgeItemId("knowledge1");
    }

    @Test
    void getRatingCount_ReturnsCorrectCount() {
        // Arrange
        when(ratingRepository.countByKnowledgeItemId("knowledge1")).thenReturn(2L);

        // Act
        long result = ratingService.getRatingCount("knowledge1");

        // Assert
        assertEquals(2L, result);
        verify(ratingRepository).countByKnowledgeItemId("knowledge1");
    }

    @Test
    void removeRating_Success() {
        // Arrange
        when(ratingRepository.findByKnowledgeItemIdAndUserId("knowledge1", "user1"))
                .thenReturn(Optional.of(testRating));
        doNothing().when(ratingRepository).delete(testRating);

        // Act
        assertDoesNotThrow(() -> ratingService.removeRating("knowledge1", "user1"));

        // Assert
        verify(ratingRepository).findByKnowledgeItemIdAndUserId("knowledge1", "user1");
        verify(ratingRepository).delete(testRating);
    }

    @Test
    void removeRating_RatingNotFound_DoesNothing() {
        // Arrange
        when(ratingRepository.findByKnowledgeItemIdAndUserId("knowledge1", "user1")).thenReturn(Optional.empty());

        // Act
        assertDoesNotThrow(() -> ratingService.removeRating("knowledge1", "user1"));

        // Assert
        verify(ratingRepository).findByKnowledgeItemIdAndUserId("knowledge1", "user1");
        verify(ratingRepository, never()).delete(any(Rating.class));
    }
}
