package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.model.KnowledgeView;
import com.capstone_project.capstone_project.model.KnowledgeItem;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.repository.KnowledgeViewRepository;
import com.capstone_project.capstone_project.repository.CommentRepository;
import com.capstone_project.capstone_project.repository.RatingRepository;
import com.capstone_project.capstone_project.repository.KnowledgeItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KnowledgeViewServiceTest {

    @Mock
    private KnowledgeViewRepository knowledgeViewRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private RatingRepository ratingRepository;

    @Mock
    private KnowledgeItemRepository knowledgeItemRepository;

    @InjectMocks
    private KnowledgeViewService knowledgeViewService;

    private MockHttpServletRequest mockRequest;
    private User testUser;
    private KnowledgeItem testKnowledgeItem;
    private KnowledgeView testKnowledgeView;

    @BeforeEach
    void setUp() {
        mockRequest = new MockHttpServletRequest();
        mockRequest.setRemoteAddr("192.168.1.1");
        mockRequest.addHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

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

        testKnowledgeView = KnowledgeView.builder()
                .id(1L)
                .knowledgeItemId("knowledge1")
                .userId("user1")
                .ipAddress("192.168.1.1")
                .viewTime(LocalDateTime.now())
                .build();
    }

    @Test
    void recordKnowledgeView_WithUserId_Success() {
        // Arrange
        when(knowledgeViewRepository.hasUserViewedToday("knowledge1", "user1")).thenReturn(false);
        when(knowledgeViewRepository.save(any(KnowledgeView.class))).thenReturn(testKnowledgeView);

        // Act
        assertDoesNotThrow(() -> knowledgeViewService.recordKnowledgeView("knowledge1", "user1", mockRequest));

        // Assert
        verify(knowledgeViewRepository).hasUserViewedToday("knowledge1", "user1");
        verify(knowledgeViewRepository).save(any(KnowledgeView.class));
    }

    @Test
    void recordKnowledgeView_WithoutUserId_Success() {
        // Arrange
        when(knowledgeViewRepository.save(any(KnowledgeView.class))).thenReturn(testKnowledgeView);

        // Act
        assertDoesNotThrow(() -> knowledgeViewService.recordKnowledgeView("knowledge1", null, mockRequest));

        // Assert
        verify(knowledgeViewRepository).save(any(KnowledgeView.class));
    }

    @Test
    void recordKnowledgeView_DuplicateViewToday_DoesNotSave() {
        // Arrange
        when(knowledgeViewRepository.hasUserViewedToday("knowledge1", "user1")).thenReturn(true);

        // Act
        assertDoesNotThrow(() -> knowledgeViewService.recordKnowledgeView("knowledge1", "user1", mockRequest));

        // Assert
        verify(knowledgeViewRepository).hasUserViewedToday("knowledge1", "user1");
        verify(knowledgeViewRepository, never()).save(any(KnowledgeView.class));
    }

    @Test
    void recordAnonymousView_Success() {
        // Arrange
        when(knowledgeViewRepository.save(any(KnowledgeView.class))).thenReturn(testKnowledgeView);

        // Act
        assertDoesNotThrow(() -> knowledgeViewService.recordAnonymousView("knowledge1", mockRequest));

        // Assert
        verify(knowledgeViewRepository).save(any(KnowledgeView.class));
    }

    @Test
    void getTotalViewsToday_ReturnsCorrectCount() {
        // Arrange
        when(knowledgeViewRepository.countViewsToday()).thenReturn(25L);

        // Act
        long result = knowledgeViewService.getTotalViewsToday();

        // Assert
        assertEquals(25L, result);
        verify(knowledgeViewRepository).countViewsToday();
    }

    @Test
    void getTotalViewsThisMonth_ReturnsCorrectCount() {
        // Arrange
        when(knowledgeViewRepository.countViewsThisMonth()).thenReturn(150L);

        // Act
        long result = knowledgeViewService.getTotalViewsThisMonth();

        // Assert
        assertEquals(150L, result);
        verify(knowledgeViewRepository).countViewsThisMonth();
    }

    @Test
    void getUniqueViewersToday_ReturnsCorrectCount() {
        // Arrange
        when(knowledgeViewRepository.countUniqueViewersToday()).thenReturn(15L);

        // Act
        long result = knowledgeViewService.getUniqueViewersToday();

        // Assert
        assertEquals(15L, result);
        verify(knowledgeViewRepository).countUniqueViewersToday();
    }

    @Test
    void getViewsForKnowledgeItem_ReturnsCorrectCount() {
        // Arrange
        when(knowledgeViewRepository.countViewsByKnowledgeItem("knowledge1")).thenReturn(25L);

        // Act
        long result = knowledgeViewService.getViewsForKnowledgeItem("knowledge1");

        // Assert
        assertEquals(25L, result);
        verify(knowledgeViewRepository).countViewsByKnowledgeItem("knowledge1");
    }

    @Test
    void getEngagementRate_ReturnsCorrectRate() {
        // Arrange
        when(knowledgeItemRepository.countByIsDeletedFalse()).thenReturn(100L);
        when(commentRepository.count()).thenReturn(30L);
        when(ratingRepository.count()).thenReturn(20L);

        // Act
        double result = knowledgeViewService.getEngagementRate();

        // Assert
        assertTrue(result > 0);
        verify(knowledgeItemRepository).countByIsDeletedFalse();
    }

    @Test
    void getTotalInteractions_ReturnsCorrectCount() {
        // Arrange
        when(commentRepository.count()).thenReturn(30L);
        when(ratingRepository.count()).thenReturn(20L);

        // Act
        long result = knowledgeViewService.getTotalInteractions();

        // Assert
        assertEquals(50L, result);
        verify(commentRepository).count();
        verify(ratingRepository).count();
    }

    @Test
    void getInteractionsToday_ReturnsCorrectCount() {
        // Arrange
        when(commentRepository.count()).thenReturn(30L);
        when(ratingRepository.count()).thenReturn(20L);

        // Act
        long result = knowledgeViewService.getInteractionsToday();

        // Assert
        assertTrue(result >= 0);
        verify(commentRepository).count();
        verify(ratingRepository).count();
    }

    @Test
    void getDailyKnowledgeViewsLast7Days_ReturnsCorrectList() {
        // Act
        List<Long> result = knowledgeViewService.getDailyKnowledgeViewsLast7Days();

        // Assert
        assertNotNull(result);
        assertEquals(7, result.size());
    }
}
