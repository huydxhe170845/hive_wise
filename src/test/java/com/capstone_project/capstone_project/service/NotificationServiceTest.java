package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.enums.NotificationType;
import com.capstone_project.capstone_project.model.Notification;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.repository.NotificationRepository;
import com.capstone_project.capstone_project.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserVaultRoleService userVaultRoleService;

    @InjectMocks
    private NotificationService notificationService;

    private User testUser;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user1")
                .username("testuser")
                .email("test@example.com")
                .name("Test User")
                .build();

        testNotification = Notification.builder()
                .id("notification1")
                .title("Test Notification")
                .message("Test Message")
                .type(NotificationType.ADMIN_NEW_USER_REGISTERED)
                .recipientId("user1")
                .senderId("admin1")
                .vaultId("vault1")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createKnowledgeApprovedNotification_Success() {
        // Arrange
        User approver = User.builder().id("admin1").name("Admin User").username("admin").build();
        when(userRepository.findById("admin1")).thenReturn(Optional.of(approver));
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        assertDoesNotThrow(() -> notificationService.createKnowledgeApprovedNotification(
                createTestKnowledgeItem(), "admin1"));

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void createKnowledgeRejectedNotification_Success() {
        // Arrange
        User rejector = User.builder().id("admin1").name("Admin User").username("admin").build();
        when(userRepository.findById("admin1")).thenReturn(Optional.of(rejector));
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        assertDoesNotThrow(() -> notificationService.createKnowledgeRejectedNotification(
                createTestKnowledgeItem(), "admin1", "Test reason"));

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void createNewKnowledgeNotification_Success() {
        // Arrange
        User creator = User.builder().id("user1").name("Test User").username("testuser").build();
        when(userRepository.findById("user1")).thenReturn(Optional.of(creator));
        when(userVaultRoleService.getRoleInVault("user1", "vault1")).thenReturn("EXPERT");
        when(userVaultRoleService.getUserIdsByVaultId("vault1")).thenReturn(Arrays.asList("user2", "user3"));
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        assertDoesNotThrow(() -> notificationService.createNewKnowledgeNotification(createTestKnowledgeItem()));

        // Assert
        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    void createAdminNewVaultNotification_Success() {
        // Arrange
        when(userRepository.findBySystemRoleName("ADMIN")).thenReturn(Arrays.asList(testUser));
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        assertDoesNotThrow(() -> notificationService.createAdminNewVaultNotification(createTestVault()));

        // Assert
        verify(notificationRepository, atLeastOnce()).save(any(Notification.class));
    }

    @Test
    void getNotificationsByUserAndVault_ReturnsUserNotifications() {
        // Arrange
        when(notificationRepository.findByRecipientIdAndVaultIdOrderByCreatedAtDesc("user1", "vault1"))
                .thenReturn(Arrays.asList(testNotification));

        // Act
        List<Notification> result = notificationService.getNotificationsByUserAndVault("user1", "vault1");

        // Assert
        assertEquals(1, result.size());
        assertEquals(testNotification, result.get(0));
        verify(notificationRepository).findByRecipientIdAndVaultIdOrderByCreatedAtDesc("user1", "vault1");
    }

    @Test
    void getUnreadNotifications_ReturnsUnreadNotifications() {
        // Arrange
        when(notificationRepository.findByRecipientIdAndVaultIdAndIsReadFalseOrderByCreatedAtDesc("user1", "vault1"))
                .thenReturn(Arrays.asList(testNotification));

        // Act
        List<Notification> result = notificationService.getUnreadNotifications("user1", "vault1");

        // Assert
        assertEquals(1, result.size());
        assertEquals(testNotification, result.get(0));
        verify(notificationRepository).findByRecipientIdAndVaultIdAndIsReadFalseOrderByCreatedAtDesc("user1", "vault1");
    }

    @Test
    void markAsRead_Success() {
        // Arrange
        when(notificationRepository.findById("notification1")).thenReturn(Optional.of(testNotification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);

        // Act
        assertDoesNotThrow(() -> notificationService.markAsRead("notification1"));

        // Assert
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void markAsRead_NotificationNotFound_DoesNothing() {
        // Arrange
        when(notificationRepository.findById("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        assertDoesNotThrow(() -> notificationService.markAsRead("nonexistent"));
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void deleteNotification_Success() {
        // Arrange
        when(notificationRepository.findById("notification1")).thenReturn(Optional.of(testNotification));
        doNothing().when(notificationRepository).delete(testNotification);

        // Act
        assertDoesNotThrow(() -> notificationService.deleteNotification("notification1"));

        // Assert
        verify(notificationRepository).delete(testNotification);
    }

    @Test
    void deleteNotification_NotificationNotFound_ThrowsException() {
        // Arrange
        when(notificationRepository.findById("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> notificationService.deleteNotification("nonexistent"));
        assertEquals("Notification not found", exception.getMessage());
    }

    @Test
    void getUnreadNotificationCount_ReturnsCorrectCount() {
        // Arrange
        when(notificationRepository.countByRecipientIdAndVaultIdAndIsReadFalse("user1", "vault1")).thenReturn(5);

        // Act
        int result = notificationService.getUnreadNotificationCount("user1", "vault1");

        // Assert
        assertEquals(5, result);
        verify(notificationRepository).countByRecipientIdAndVaultIdAndIsReadFalse("user1", "vault1");
    }

    // Helper methods to create test data
    private com.capstone_project.capstone_project.model.KnowledgeItem createTestKnowledgeItem() {
        return com.capstone_project.capstone_project.model.KnowledgeItem.builder()
                .id("knowledge1")
                .name("Test Knowledge")
                .description("Test Description")
                .content("Test Content")
                .vaultId("vault1")
                .createdBy("user1")
                .approvalStatus(com.capstone_project.capstone_project.enums.KnowledgeApprovalStatus.APPROVED)
                .build();
    }

    private com.capstone_project.capstone_project.model.Vault createTestVault() {
        return com.capstone_project.capstone_project.model.Vault.builder()
                .id("vault1")
                .name("Test Vault")
                .description("Test Description")
                .createdByUserId("user1")
                .build();
    }
}
