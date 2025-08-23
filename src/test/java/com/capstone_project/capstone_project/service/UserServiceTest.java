package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.dto.response.UserDTO;
import com.capstone_project.capstone_project.enums.AuthProvider;
import com.capstone_project.capstone_project.model.SystemRole;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.repository.SystemRoleRepository;
import com.capstone_project.capstone_project.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SystemRoleRepository systemRoleRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ApplicationContext applicationContext;

    @InjectMocks
    private UserService userService;

    private User testUser1;
    private User testUser2;
    private SystemRole testRole;

    @BeforeEach
    void setUp() {
        testRole = SystemRole.builder()
                .id(2)
                .name("USER")
                .build();

        testUser1 = User.builder()
                .id("user1")
                .username("user1")
                .email("user1@example.com")
                .password("password")
                .isActivated(true)
                .authProvider(AuthProvider.LOCAL)
                .systemRole(testRole)
                .createdAt(LocalDateTime.now())
                .build();

        testUser2 = User.builder()
                .id("user2")
                .username("user2")
                .email("user2@example.com")
                .password("password")
                .isActivated(true)
                .authProvider(AuthProvider.LOCAL)
                .systemRole(testRole)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void findByKeyword_WithKeyword_ReturnsFilteredUsers() {
        // Arrange
        String keyword = "user1";
        when(userRepository.findByKeyword(keyword)).thenReturn(Arrays.asList(testUser1));

        // Act
        List<User> result = userService.findByKeyword(keyword);

        // Assert
        assertEquals(1, result.size());
        assertEquals(testUser1, result.get(0));
        verify(userRepository).findByKeyword(keyword);
    }

    @Test
    void findByKeyword_WithEmptyKeyword_ReturnsAllUsers() {
        // Arrange
        when(userRepository.findAll()).thenReturn(Arrays.asList(testUser1, testUser2));

        // Act
        List<User> result = userService.findByKeyword("");

        // Assert
        assertEquals(2, result.size());
        verify(userRepository).findAll();
    }

    @Test
    void findByKeyword_WithNullKeyword_ReturnsAllUsers() {
        // Arrange
        when(userRepository.findAll()).thenReturn(Arrays.asList(testUser1, testUser2));

        // Act
        List<User> result = userService.findByKeyword(null);

        // Assert
        assertEquals(2, result.size());
        verify(userRepository).findAll();
    }

    @Test
    void getAllUsers_ReturnsAllUsers() {
        // Arrange
        when(userRepository.findAll()).thenReturn(Arrays.asList(testUser1, testUser2));

        // Act
        List<User> result = userService.getAllUsers();

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.contains(testUser1));
        assertTrue(result.contains(testUser2));
        verify(userRepository).findAll();
    }

    @Test
    void getTotalAccounts_ReturnsCorrectCount() {
        // Arrange
        when(userRepository.count()).thenReturn(2L);

        // Act
        long result = userService.getTotalAccounts();

        // Assert
        assertEquals(2L, result);
        verify(userRepository).count();
    }

    @Test
    void findById_ExistingUser_ReturnsUser() {
        // Arrange
        when(userRepository.findById("user1")).thenReturn(Optional.of(testUser1));

        // Act
        User result = userService.findById("user1");

        // Assert
        assertNotNull(result);
        assertEquals(testUser1, result);
        verify(userRepository).findById("user1");
    }

    @Test
    void findById_NonExistingUser_ThrowsException() {
        // Arrange
        when(userRepository.findById("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> userService.findById("nonexistent"));
        assertEquals("User not found with id: nonexistent", exception.getMessage());
    }

    @Test
    void findDTOById_ExistingUser_ReturnsUserDTO() {
        // Arrange
        when(userRepository.findById("user1")).thenReturn(Optional.of(testUser1));

        // Act
        UserDTO result = userService.findDTOById("user1");

        // Assert
        assertNotNull(result);
        assertEquals(testUser1.getId(), result.getId());
        assertEquals(testUser1.getUsername(), result.getUsername());
        assertEquals(testUser1.getEmail(), result.getEmail());
    }

    @Test
    void updateUserRole_Success() {
        // Arrange
        SystemRole newRole = SystemRole.builder().id(1).name("ADMIN").build();
        when(userRepository.findById("user1")).thenReturn(Optional.of(testUser1));
        when(systemRoleRepository.findById(1)).thenReturn(Optional.of(newRole));
        when(userRepository.save(any(User.class))).thenReturn(testUser1);

        // Act
        assertDoesNotThrow(() -> userService.updateUserRole("user1", 1));

        // Assert
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUserStatus_Success() {
        // Arrange
        when(userRepository.findById("user1")).thenReturn(Optional.of(testUser1));
        when(userRepository.save(any(User.class))).thenReturn(testUser1);

        // Act
        assertDoesNotThrow(() -> userService.updateUserStatus("user1", false));

        // Assert
        verify(userRepository).save(any(User.class));
    }

    @Test
    void getAllRoles_ReturnsAllRoles() {
        // Arrange
        SystemRole adminRole = SystemRole.builder().id(1).name("ADMIN").build();
        when(systemRoleRepository.findAll()).thenReturn(Arrays.asList(testRole, adminRole));

        // Act
        List<SystemRole> result = userService.getAllRoles();

        // Assert
        assertEquals(2, result.size());
        verify(systemRoleRepository).findAll();
    }

    @Test
    void getActiveAccounts_ReturnsCorrectCount() {
        // Arrange
        when(userRepository.countUsersByActivationStatus(1)).thenReturn(10L);

        // Act
        long result = userService.getActiveAccounts();

        // Assert
        assertEquals(10L, result);
        verify(userRepository).countUsersByActivationStatus(1);
    }

    @Test
    void getInactiveAccounts_ReturnsCorrectCount() {
        // Arrange
        when(userRepository.countUsersByActivationStatus(0)).thenReturn(5L);

        // Act
        long result = userService.getInactiveAccounts();

        // Assert
        assertEquals(5L, result);
        verify(userRepository).countUsersByActivationStatus(0);
    }
}
