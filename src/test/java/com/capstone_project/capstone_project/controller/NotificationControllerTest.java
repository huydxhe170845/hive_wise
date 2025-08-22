package com.capstone_project.capstone_project.controller;

import com.capstone_project.capstone_project.model.Notification;
import com.capstone_project.capstone_project.security.CustomUserDetails;
import com.capstone_project.capstone_project.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private NotificationController notificationController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(notificationController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void getNotifications_ValidRequest_ReturnsNotificationsList() throws Exception {
        // Arrange
        String userId = "user123";
        String vaultId = "vault456";

        CustomUserDetails user = mock(CustomUserDetails.class);
        when(user.getId()).thenReturn(userId);

        List<Notification> notifications = Arrays.asList(
                createNotification("notif1", "Test notification 1", false),
                createNotification("notif2", "Test notification 2", true));

        when(notificationService.getNotificationsByUserAndVault(userId, vaultId))
                .thenReturn(notifications);

        // Act & Assert
        mockMvc.perform(get("/notification/list")
                .param("vaultId", vaultId)
                .requestAttr("user", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("notif1"))
                .andExpect(jsonPath("$[0].message").value("Test notification 1"))
                .andExpect(jsonPath("$[0].isRead").value(false))
                .andExpect(jsonPath("$[1].id").value("notif2"))
                .andExpect(jsonPath("$[1].message").value("Test notification 2"))
                .andExpect(jsonPath("$[1].isRead").value(true));

        verify(notificationService).getNotificationsByUserAndVault(userId, vaultId);
    }

    @Test
    void getNotifications_ServiceThrowsException_ReturnsBadRequest() throws Exception {
        // Arrange
        String userId = "user123";
        String vaultId = "vault456";

        CustomUserDetails user = mock(CustomUserDetails.class);
        when(user.getId()).thenReturn(userId);

        when(notificationService.getNotificationsByUserAndVault(userId, vaultId))
                .thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        mockMvc.perform(get("/notification/list")
                .param("vaultId", vaultId)
                .requestAttr("user", user))
                .andExpect(status().isBadRequest());

        verify(notificationService).getNotificationsByUserAndVault(userId, vaultId);
    }

    @Test
    void getUnreadCount_ValidRequest_ReturnsCount() throws Exception {
        // Arrange
        String userId = "user123";
        String vaultId = "vault456";

        CustomUserDetails user = mock(CustomUserDetails.class);
        when(user.getId()).thenReturn(userId);

        when(notificationService.getUnreadNotificationCount(userId, vaultId))
                .thenReturn(5);

        // Act & Assert
        mockMvc.perform(get("/notification/unread-count")
                .param("vaultId", vaultId)
                .requestAttr("user", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(5));

        verify(notificationService).getUnreadNotificationCount(userId, vaultId);
    }

    @Test
    void getUnreadCount_ServiceThrowsException_ReturnsBadRequest() throws Exception {
        // Arrange
        String userId = "user123";
        String vaultId = "vault456";

        CustomUserDetails user = mock(CustomUserDetails.class);
        when(user.getId()).thenReturn(userId);

        when(notificationService.getUnreadNotificationCount(userId, vaultId))
                .thenThrow(new RuntimeException("Service error"));

        // Act & Assert
        mockMvc.perform(get("/notification/unread-count")
                .param("vaultId", vaultId)
                .requestAttr("user", user))
                .andExpect(status().isBadRequest());

        verify(notificationService).getUnreadNotificationCount(userId, vaultId);
    }

    @Test
    void markAsRead_ValidRequest_ReturnsSuccess() throws Exception {
        // Arrange
        String notificationId = "notif123";
        CustomUserDetails user = mock(CustomUserDetails.class);

        doNothing().when(notificationService).markAsRead(notificationId);

        // Act & Assert
        mockMvc.perform(post("/notification/mark-as-read")
                .param("notificationId", notificationId)
                .requestAttr("user", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(notificationService).markAsRead(notificationId);
    }

    @Test
    void markAsRead_ServiceThrowsException_ReturnsBadRequest() throws Exception {
        // Arrange
        String notificationId = "notif123";
        CustomUserDetails user = mock(CustomUserDetails.class);

        doThrow(new RuntimeException("Notification not found"))
                .when(notificationService).markAsRead(notificationId);

        // Act & Assert
        mockMvc.perform(post("/notification/mark-as-read")
                .param("notificationId", notificationId)
                .requestAttr("user", user))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Notification not found"));

        verify(notificationService).markAsRead(notificationId);
    }

    @Test
    void markAsUnread_ValidRequest_ReturnsSuccess() throws Exception {
        // Arrange
        String notificationId = "notif123";
        CustomUserDetails user = mock(CustomUserDetails.class);

        doNothing().when(notificationService).markAsUnread(notificationId);

        // Act & Assert
        mockMvc.perform(post("/notification/mark-as-unread")
                .param("notificationId", notificationId)
                .requestAttr("user", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(notificationService).markAsUnread(notificationId);
    }

    @Test
    void markAsUnread_ServiceThrowsException_ReturnsBadRequest() throws Exception {
        // Arrange
        String notificationId = "notif123";
        CustomUserDetails user = mock(CustomUserDetails.class);

        doThrow(new RuntimeException("Notification not found"))
                .when(notificationService).markAsUnread(notificationId);

        // Act & Assert
        mockMvc.perform(post("/notification/mark-as-unread")
                .param("notificationId", notificationId)
                .requestAttr("user", user))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Notification not found"));

        verify(notificationService).markAsUnread(notificationId);
    }

    @Test
    void getNotifications_EmptyList_ReturnsEmptyArray() throws Exception {
        // Arrange
        String userId = "user123";
        String vaultId = "vault456";

        CustomUserDetails user = mock(CustomUserDetails.class);
        when(user.getId()).thenReturn(userId);

        when(notificationService.getNotificationsByUserAndVault(userId, vaultId))
                .thenReturn(Arrays.asList());

        // Act & Assert
        mockMvc.perform(get("/notification/list")
                .param("vaultId", vaultId)
                .requestAttr("user", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());

        verify(notificationService).getNotificationsByUserAndVault(userId, vaultId);
    }

    @Test
    void getUnreadCount_ZeroCount_ReturnsZero() throws Exception {
        // Arrange
        String userId = "user123";
        String vaultId = "vault456";

        CustomUserDetails user = mock(CustomUserDetails.class);
        when(user.getId()).thenReturn(userId);

        when(notificationService.getUnreadNotificationCount(userId, vaultId))
                .thenReturn(0);

        // Act & Assert
        mockMvc.perform(get("/notification/unread-count")
                .param("vaultId", vaultId)
                .requestAttr("user", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));

        verify(notificationService).getUnreadNotificationCount(userId, vaultId);
    }

    @Test
    void markAsRead_WithNullNotificationId_ReturnsBadRequest() throws Exception {
        // Arrange
        CustomUserDetails user = mock(CustomUserDetails.class);

        // Act & Assert
        mockMvc.perform(post("/notification/mark-as-read")
                .param("notificationId", "")
                .requestAttr("user", user))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(notificationService);
    }

    @Test
    void markAsUnread_WithNullNotificationId_ReturnsBadRequest() throws Exception {
        // Arrange
        CustomUserDetails user = mock(CustomUserDetails.class);

        // Act & Assert
        mockMvc.perform(post("/notification/mark-as-unread")
                .param("notificationId", "")
                .requestAttr("user", user))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(notificationService);
    }

    private Notification createNotification(String id, String message, boolean read) {
        Notification notification = Notification.builder()
                .id(id)
                .message(message)
                .isRead(read)
                .createdAt(LocalDateTime.now())
                .build();
        return notification;
    }
}
