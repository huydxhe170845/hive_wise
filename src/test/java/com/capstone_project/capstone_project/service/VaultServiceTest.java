package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.dto.request.AddVaultRequest;
import com.capstone_project.capstone_project.dto.request.UpdateVaultRequest;
import com.capstone_project.capstone_project.dto.response.VaultDashboardResponse;
import com.capstone_project.capstone_project.enums.KnowledgeVisibility;
import com.capstone_project.capstone_project.exception.FieldValidationException;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.model.Vault;
import com.capstone_project.capstone_project.model.VaultRole;
import com.capstone_project.capstone_project.repository.VaultRepository;
import com.capstone_project.capstone_project.repository.UserRepository;
import com.capstone_project.capstone_project.repository.VaultRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VaultServiceTest {

    @Mock
    private VaultRepository vaultRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VaultRoleRepository vaultRoleRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private VaultService vaultService;

    private User testUser;
    private Vault testVault;
    private VaultRole testVaultRole;
    private AddVaultRequest addVaultRequest;
    private UpdateVaultRequest updateVaultRequest;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user1")
                .username("testuser")
                .email("test@example.com")
                .build();

        testVault = Vault.builder()
                .id("vault1")
                .name("Test Vault")
                .description("Test Description")
                .photoUrl("/images/vault/vault_df.webp")
                .createdByUserId("user1")
                .createdByEmail("test@example.com")
                .isActivated(true)
                .createdAt(LocalDateTime.now())
                .build();

        testVaultRole = VaultRole.builder()
                .id(1)
                .name("OWNER")
                .build();

        addVaultRequest = new AddVaultRequest();
        addVaultRequest.setName("New Vault");
        addVaultRequest.setDescription("New Description");
        addVaultRequest.setCreatedByUserId("user1");
        addVaultRequest.setCreatedByEmail("test@example.com");

        updateVaultRequest = new UpdateVaultRequest();
        updateVaultRequest.setName("Updated Vault");
        updateVaultRequest.setDescription("Updated Description");
    }

    @Test
    void addVault_Success() {
        // Arrange
        when(vaultRepository.existsByNameAndCreatedByUserId("New Vault", "user1")).thenReturn(false);
        when(vaultRepository.save(any(Vault.class))).thenReturn(testVault);
        doNothing().when(notificationService).createAdminNewVaultNotification(any(Vault.class));

        // Act
        Vault result = vaultService.addVault(addVaultRequest, "user1");

        // Assert
        assertNotNull(result);
        assertEquals("Test Vault", result.getName());
        verify(vaultRepository).save(any(Vault.class));
        verify(notificationService).createAdminNewVaultNotification(any(Vault.class));
    }

    @Test
    void addVault_VaultNameAlreadyExists_ThrowsException() {
        // Arrange
        when(vaultRepository.existsByNameAndCreatedByUserId("New Vault", "user1")).thenReturn(true);

        // Act & Assert
        FieldValidationException exception = assertThrows(FieldValidationException.class,
                () -> vaultService.addVault(addVaultRequest, "user1"));
        assertEquals("name", exception.getField());
        assertEquals("Vault with this name already exists in your list", exception.getMessage());
    }

    @Test
    void addVault_WithPhoto_Success() {
        // Arrange
        MockMultipartFile photo = new MockMultipartFile(
                "photo",
                "vault.jpg",
                "image/jpeg",
                "test image content".getBytes());
        addVaultRequest.setPhoto(photo);

        when(vaultRepository.existsByNameAndCreatedByUserId("New Vault", "user1")).thenReturn(false);
        when(vaultRepository.save(any(Vault.class))).thenReturn(testVault);
        doNothing().when(notificationService).createAdminNewVaultNotification(any(Vault.class));

        // Act
        Vault result = vaultService.addVault(addVaultRequest, "user1");

        // Assert
        assertNotNull(result);
        verify(vaultRepository).save(any(Vault.class));
    }

    @Test
    void updateVault_Success() {
        // Arrange
        when(vaultRepository.findById("vault1")).thenReturn(Optional.of(testVault));
        when(vaultRepository.existsByNameAndCreatedByUserId("Updated Vault", "user1")).thenReturn(false);
        when(vaultRepository.save(any(Vault.class))).thenReturn(testVault);

        // Act
        Vault result = vaultService.updateVault(updateVaultRequest, "vault1", "user1");

        // Assert
        assertNotNull(result);
        verify(vaultRepository).save(any(Vault.class));
    }

    @Test
    void updateVault_VaultNotFound_ThrowsException() {
        // Arrange
        when(vaultRepository.findById("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> vaultService.updateVault(updateVaultRequest, "nonexistent", "user1"));
        assertEquals("Vault not found", exception.getMessage());
    }

    @Test
    void updateVault_VaultNameAlreadyExists_ThrowsException() {
        // Arrange
        when(vaultRepository.findById("vault1")).thenReturn(Optional.of(testVault));
        when(vaultRepository.existsByNameAndCreatedByUserId("Updated Vault", "user1")).thenReturn(true);

        // Act & Assert
        FieldValidationException exception = assertThrows(FieldValidationException.class,
                () -> vaultService.updateVault(updateVaultRequest, "vault1", "user1"));
        assertEquals("name", exception.getField());
        assertEquals("Vault with this name already exists in your list", exception.getMessage());
    }
}
