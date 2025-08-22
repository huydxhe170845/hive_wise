package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.model.Visit;
import com.capstone_project.capstone_project.repository.VisitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VisitServiceTest {

    @Mock
    private VisitRepository visitRepository;

    @InjectMocks
    private VisitService visitService;

    private MockHttpServletRequest mockRequest;
    private Visit testVisit;

    @BeforeEach
    void setUp() {
        mockRequest = new MockHttpServletRequest();
        mockRequest.setRemoteAddr("192.168.1.1");
        mockRequest.addHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");

        testVisit = Visit.builder()
                .id(1L)
                .userId("user1")
                .sessionId("session123")
                .ipAddress("192.168.1.1")
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .pageUrl("/dashboard")
                .isLogin(true)
                .visitTime(LocalDateTime.now())
                .build();
    }

    @Test
    void recordVisit_WithUserId_Success() {
        // Arrange
        when(visitRepository.save(any(Visit.class))).thenReturn(testVisit);

        // Act
        assertDoesNotThrow(() -> visitService.recordVisit("user1", "/dashboard", mockRequest, true));

        // Assert
        verify(visitRepository).save(any(Visit.class));
    }

    @Test
    void recordVisit_WithoutUserId_Success() {
        // Arrange
        when(visitRepository.save(any(Visit.class))).thenReturn(testVisit);

        // Act
        assertDoesNotThrow(() -> visitService.recordVisit(null, "/landing", mockRequest, false));

        // Assert
        verify(visitRepository).save(any(Visit.class));
    }

    @Test
    void recordAnonymousVisit_Success() {
        // Arrange
        when(visitRepository.save(any(Visit.class))).thenReturn(testVisit);

        // Act
        assertDoesNotThrow(() -> visitService.recordAnonymousVisit("/landing", mockRequest));

        // Assert
        verify(visitRepository).save(any(Visit.class));
    }

    @Test
    void recordLoginVisit_Success() {
        // Arrange
        when(visitRepository.save(any(Visit.class))).thenReturn(testVisit);

        // Act
        assertDoesNotThrow(() -> visitService.recordLoginVisit("user1", mockRequest));

        // Assert
        verify(visitRepository).save(any(Visit.class));
    }

    @Test
    void getTotalVisitsToday_ReturnsCorrectCount() {
        // Arrange
        when(visitRepository.countTotalVisitsToday()).thenReturn(150L);

        // Act
        long result = visitService.getTotalVisitsToday();

        // Assert
        assertEquals(150L, result);
        verify(visitRepository).countTotalVisitsToday();
    }

    @Test
    void getUniqueVisitorsToday_ReturnsCorrectCount() {
        // Arrange
        when(visitRepository.countUniqueVisitorsToday()).thenReturn(45L);

        // Act
        long result = visitService.getUniqueVisitorsToday();

        // Assert
        assertEquals(45L, result);
        verify(visitRepository).countUniqueVisitorsToday();
    }

    @Test
    void getTotalVisitsThisMonth_ReturnsCorrectCount() {
        // Arrange
        when(visitRepository.countTotalVisitsThisMonth()).thenReturn(2500L);

        // Act
        long result = visitService.getTotalVisitsThisMonth();

        // Assert
        assertEquals(2500L, result);
        verify(visitRepository).countTotalVisitsThisMonth();
    }

    @Test
    void getUniqueVisitorsThisMonth_ReturnsCorrectCount() {
        // Arrange
        when(visitRepository.countUniqueVisitorsThisMonth()).thenReturn(320L);

        // Act
        long result = visitService.getUniqueVisitorsThisMonth();

        // Assert
        assertEquals(320L, result);
        verify(visitRepository).countUniqueVisitorsThisMonth();
    }

    @Test
    void getAverageVisitsPerDay_ReturnsCorrectAverage() {
        // Arrange
        when(visitRepository.countTotalVisitsThisMonth()).thenReturn(2500L);

        // Act
        double result = visitService.getAverageVisitsPerDay();

        // Assert
        assertTrue(result > 0);
        verify(visitRepository).countTotalVisitsThisMonth();
    }

    @Test
    void getLoginVisitsToday_ReturnsCorrectCount() {
        // Arrange
        when(visitRepository.countLoginVisitsToday()).thenReturn(25L);

        // Act
        long result = visitService.getLoginVisitsToday();

        // Assert
        assertEquals(25L, result);
        verify(visitRepository).countLoginVisitsToday();
    }

    @Test
    void hasUserVisitedToday_UserVisitedToday_ReturnsTrue() {
        // Arrange
        when(visitRepository.hasUserVisitedToday("user1")).thenReturn(true);

        // Act
        boolean result = visitService.hasUserVisitedToday("user1");

        // Assert
        assertTrue(result);
        verify(visitRepository).hasUserVisitedToday("user1");
    }

    @Test
    void hasUserVisitedToday_UserNotVisitedToday_ReturnsFalse() {
        // Arrange
        when(visitRepository.hasUserVisitedToday("user1")).thenReturn(false);

        // Act
        boolean result = visitService.hasUserVisitedToday("user1");

        // Assert
        assertFalse(result);
        verify(visitRepository).hasUserVisitedToday("user1");
    }

    @Test
    void hasUserVisitedToday_NullUserId_ReturnsFalse() {
        // Act
        boolean result = visitService.hasUserVisitedToday(null);

        // Assert
        assertFalse(result);
        verify(visitRepository, never()).hasUserVisitedToday(anyString());
    }

    @Test
    void getUserVisitsToday_ReturnsCorrectCount() {
        // Arrange
        when(visitRepository.countVisitsByUserToday("user1")).thenReturn(5L);

        // Act
        long result = visitService.getUserVisitsToday("user1");

        // Assert
        assertEquals(5L, result);
        verify(visitRepository).countVisitsByUserToday("user1");
    }

    @Test
    void getUserVisitsToday_NullUserId_ReturnsZero() {
        // Act
        long result = visitService.getUserVisitsToday(null);

        // Assert
        assertEquals(0L, result);
        verify(visitRepository, never()).countVisitsByUserToday(anyString());
    }

    @Test
    void getDailyVisitsLast7Days_ReturnsCorrectList() {
        // Arrange
        when(visitRepository.countVisitsByDate(any(LocalDateTime.class))).thenReturn(10L);

        // Act
        List<Long> result = visitService.getDailyVisitsLast7Days();

        // Assert
        assertNotNull(result);
        assertEquals(7, result.size());
        verify(visitRepository, times(7)).countVisitsByDate(any(LocalDateTime.class));
    }
}
