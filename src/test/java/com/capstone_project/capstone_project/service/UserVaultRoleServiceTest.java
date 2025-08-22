package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.model.UserVaultRole;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.model.Vault;
import com.capstone_project.capstone_project.model.VaultRole;
import com.capstone_project.capstone_project.repository.UserVaultRoleRepository;
import com.capstone_project.capstone_project.repository.UserRepository;
import com.capstone_project.capstone_project.repository.VaultRepository;
import com.capstone_project.capstone_project.repository.VaultRoleRepository;
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
class UserVaultRoleServiceTest {

    @Mock
    private UserVaultRoleRepository userVaultRoleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VaultRepository vaultRepository;

    @Mock
    private VaultRoleRepository vaultRoleRepository;

    @InjectMocks
    private UserVaultRoleService userVaultRoleService;

    private User testUser;
    private Vault testVault;
    private VaultRole testVaultRole;
    private UserVaultRole testUserVaultRole;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user1")
                .username("testuser")
                .email("test@example.com")
                .name("Test User")
                .build();

        testVault = Vault.builder()
                .id("vault1")
                .name("Test Vault")
                .description("Test Description")
                .createdByUserId("user1")
                .build();

        testVaultRole = VaultRole.builder()
                .id(1)
                .name("MEMBER")
                .description("Vault Member")
                .build();

        testUserVaultRole = UserVaultRole.builder()
                .id(1)
                .user(testUser)
                .vault(testVault)
                .role(testVaultRole)
                .build();
    }

    @Test
    void addMemberToVault_Success() {
        // Arrange
        when(userRepository.findById("user1")).thenReturn(Optional.of(testUser));
        when(vaultRepository.findById("vault1")).thenReturn(Optional.of(testVault));
        when(vaultRoleRepository.findByName("MEMBER")).thenReturn(testVaultRole);
        when(userVaultRoleRepository.existsByUserIdAndVaultId("user1", "vault1")).thenReturn(false);
        when(userVaultRoleRepository.save(any(UserVaultRole.class))).thenReturn(testUserVaultRole);

        // Act
        assertDoesNotThrow(() -> userVaultRoleService.addMemberToVault("vault1", "user1", "MEMBER", "owner1"));

        // Assert
        verify(userRepository).findById("user1");
        verify(vaultRepository).findById("vault1");
        verify(vaultRoleRepository).findByName("MEMBER");
        verify(userVaultRoleRepository).save(any(UserVaultRole.class));
    }

    @Test
    void addMemberToVault_UserNotFound_ThrowsException() {
        // Arrange
        when(userRepository.findById("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> userVaultRoleService.addMemberToVault("vault1", "nonexistent", "MEMBER", "owner1"));
        assertEquals("User not found", exception.getMessage());
        verify(userRepository).findById("nonexistent");
        verify(vaultRepository, never()).findById(anyString());
    }

    @Test
    void addMemberToVault_VaultNotFound_ThrowsException() {
        // Arrange
        when(userRepository.findById("user1")).thenReturn(Optional.of(testUser));
        when(vaultRepository.findById("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> userVaultRoleService.addMemberToVault("nonexistent", "user1", "MEMBER", "owner1"));
        assertEquals("Vault not found", exception.getMessage());
        verify(userRepository).findById("user1");
        verify(vaultRepository).findById("nonexistent");
        verify(vaultRoleRepository, never()).findByName(anyString());
    }

    @Test
    void addMemberToVault_RoleNotFound_ThrowsException() {
        // Arrange
        when(userRepository.findById("user1")).thenReturn(Optional.of(testUser));
        when(vaultRepository.findById("vault1")).thenReturn(Optional.of(testVault));
        when(vaultRoleRepository.findByName("INVALID_ROLE")).thenReturn(null);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> userVaultRoleService.addMemberToVault("vault1", "user1", "INVALID_ROLE", "owner1"));
        assertEquals("Role not found: INVALID_ROLE", exception.getMessage());
        verify(userRepository).findById("user1");
        verify(vaultRepository).findById("vault1");
        verify(vaultRoleRepository).findByName("INVALID_ROLE");
        verify(userVaultRoleRepository, never()).save(any(UserVaultRole.class));
    }

    @Test
    void getRoleInVault_ExistingRole_ReturnsRole() {
        // Arrange
        when(userVaultRoleRepository.findByUserIdAndVaultId("user1", "vault1"))
                .thenReturn(Optional.of(testUserVaultRole));

        // Act
        String result = userVaultRoleService.getRoleInVault("user1", "vault1");

        // Assert
        assertEquals("MEMBER", result);
        verify(userVaultRoleRepository).findByUserIdAndVaultId("user1", "vault1");
    }

    @Test
    void getRoleInVault_NoRole_ReturnsNull() {
        // Arrange
        when(userVaultRoleRepository.findByUserIdAndVaultId("user1", "vault1")).thenReturn(Optional.empty());

        // Act
        String result = userVaultRoleService.getRoleInVault("user1", "vault1");

        // Assert
        assertNull(result);
        verify(userVaultRoleRepository).findByUserIdAndVaultId("user1", "vault1");
    }

    @Test
    void countMembersInVault_ReturnsCorrectCount() {
        // Arrange
        when(userVaultRoleRepository.countByVaultId("vault1")).thenReturn(5);

        // Act
        int result = userVaultRoleService.countMembersInVault("vault1");

        // Assert
        assertEquals(5, result);
        verify(userVaultRoleRepository).countByVaultId("vault1");
    }

    @Test
    void isVaultOwner_UserIsOwner_ReturnsTrue() {
        // Arrange
        VaultRole ownerRole = VaultRole.builder().name("VAULT_OWNER").build();
        UserVaultRole ownerUVR = UserVaultRole.builder().role(ownerRole).build();
        when(userVaultRoleRepository.findByUserIdAndVaultId("user1", "vault1"))
                .thenReturn(Optional.of(ownerUVR));

        // Act
        boolean result = userVaultRoleService.isVaultOwner("user1", "vault1");

        // Assert
        assertTrue(result);
        verify(userVaultRoleRepository).findByUserIdAndVaultId("user1", "vault1");
    }

    @Test
    void isVaultOwner_UserIsNotOwner_ReturnsFalse() {
        // Arrange
        when(userVaultRoleRepository.findByUserIdAndVaultId("user1", "vault1"))
                .thenReturn(Optional.of(testUserVaultRole));

        // Act
        boolean result = userVaultRoleService.isVaultOwner("user1", "vault1");

        // Assert
        assertFalse(result);
        verify(userVaultRoleRepository).findByUserIdAndVaultId("user1", "vault1");
    }

    @Test
    void removeMemberFromVault_Success() {
        // Arrange
        when(userVaultRoleRepository.findByUserIdAndVaultId("owner1", "vault1"))
                .thenReturn(Optional.of(UserVaultRole.builder()
                        .role(VaultRole.builder().name("VAULT_OWNER").build())
                        .build()));
        doNothing().when(userVaultRoleRepository).deleteByUserIdAndVaultId("user1", "vault1");

        // Act
        assertDoesNotThrow(() -> userVaultRoleService.removeMemberFromVault("vault1", "user1", "owner1"));

        // Assert
        verify(userVaultRoleRepository).deleteByUserIdAndVaultId("user1", "vault1");
    }

    @Test
    void leaveVault_Success() {
        // Arrange
        doNothing().when(userVaultRoleRepository).deleteByUserIdAndVaultId("user1", "vault1");

        // Act
        assertDoesNotThrow(() -> userVaultRoleService.leaveVault("vault1", "user1"));

        // Assert
        verify(userVaultRoleRepository).deleteByUserIdAndVaultId("user1", "vault1");
    }

    @Test
    void getVaultsByUserId_ReturnsVaults() {
        // Arrange
        Vault vault2 = Vault.builder().id("vault2").name("Vault 2").build();
        when(userVaultRoleRepository.findVaultsByUserId("user1")).thenReturn(Arrays.asList(testVault, vault2));

        // Act
        List<Vault> result = userVaultRoleService.getVaultsByUserId("user1");

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.contains(testVault));
        assertTrue(result.contains(vault2));
        verify(userVaultRoleRepository).findVaultsByUserId("user1");
    }

    @Test
    void getVaultsByUserId_NoVaults_ReturnsEmptyList() {
        // Arrange
        when(userVaultRoleRepository.findVaultsByUserId("user1")).thenReturn(Arrays.asList());

        // Act
        List<Vault> result = userVaultRoleService.getVaultsByUserId("user1");

        // Assert
        assertTrue(result.isEmpty());
        verify(userVaultRoleRepository).findVaultsByUserId("user1");
    }
}
