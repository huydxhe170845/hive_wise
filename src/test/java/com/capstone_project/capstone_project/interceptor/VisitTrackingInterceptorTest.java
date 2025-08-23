package com.capstone_project.capstone_project.interceptor;

import com.capstone_project.capstone_project.security.CustomUserDetails;
import com.capstone_project.capstone_project.service.VisitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VisitTrackingInterceptorTest {

    @Mock
    private VisitService visitService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private CustomUserDetails userDetails;

    private VisitTrackingInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new VisitTrackingInterceptor(visitService);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void shouldRecordVisit_FirstVisitOfDay_ReturnsTrue() throws Exception {
        // Arrange
        when(request.getRequestURI()).thenReturn("/dashboard");
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getId()).thenReturn("user123");

        // Act
        boolean result = interceptor.preHandle(request, response, null);

        // Assert
        assertTrue(result);
        verify(visitService).recordVisit("user123", "/dashboard", request, false);
    }

    @Test
    void shouldRecordVisit_SecondVisitWithin30Minutes_ReturnsFalse() throws Exception {
        // Arrange
        when(request.getRequestURI()).thenReturn("/dashboard");
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getId()).thenReturn("user123");

        // First visit
        interceptor.preHandle(request, response, null);

        // Second visit within 30 minutes
        boolean result = interceptor.preHandle(request, response, null);

        // Assert
        assertTrue(result); // preHandle should always return true
        verify(visitService, times(1)).recordVisit("user123", "/dashboard", request, false);
    }

    @Test
    void shouldRecordVisit_LoginVisit_AlwaysRecords() throws Exception {
        // Arrange
        when(request.getRequestURI()).thenReturn("/auth/log-in");
        when(request.getMethod()).thenReturn("POST");
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getId()).thenReturn("user123");

        // Act
        boolean result = interceptor.preHandle(request, response, null);

        // Assert
        assertTrue(result);
        verify(visitService).recordLoginVisit("user123", request);
    }

    @Test
    void shouldRecordVisit_AnonymousUser_UsesIpBasedTracking() throws Exception {
        // Arrange
        when(request.getRequestURI()).thenReturn("/landing");
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("anonymousUser");

        // Act
        boolean result = interceptor.preHandle(request, response, null);

        // Assert
        assertTrue(result);
        verify(visitService).recordVisit(null, "/landing", request, false);
    }

    @Test
    void shouldRecordVisit_StaticResource_SkipsTracking() throws Exception {
        // Arrange
        when(request.getRequestURI()).thenReturn("/css/style.css");

        // Act
        boolean result = interceptor.preHandle(request, response, null);

        // Assert
        assertTrue(result);
        verify(visitService, never()).recordVisit(any(), any(), any(), anyBoolean());
    }

    @Test
    void shouldRecordVisit_ApiCall_SkipsTracking() throws Exception {
        // Arrange
        when(request.getRequestURI()).thenReturn("/api/users");

        // Act
        boolean result = interceptor.preHandle(request, response, null);

        // Assert
        assertTrue(result);
        verify(visitService, never()).recordVisit(any(), any(), any(), anyBoolean());
    }

    @Test
    void shouldRecordVisit_ExtractsUserIdFromCustomUserDetails() throws Exception {
        // Arrange
        when(request.getRequestURI()).thenReturn("/dashboard");
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getId()).thenReturn("user456");

        // Act
        boolean result = interceptor.preHandle(request, response, null);

        // Assert
        assertTrue(result);
        verify(visitService).recordVisit("user456", "/dashboard", request, false);
    }

    @Test
    void shouldRecordVisit_FallbackToUsername_WhenCustomUserDetailsNotAvailable() throws Exception {
        // Arrange
        when(request.getRequestURI()).thenReturn("/dashboard");
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("testuser");
        when(authentication.getPrincipal()).thenReturn("testuser"); // Not CustomUserDetails

        // Act
        boolean result = interceptor.preHandle(request, response, null);

        // Assert
        assertTrue(result);
        verify(visitService).recordVisit("testuser", "/dashboard", request, false);
    }
}
