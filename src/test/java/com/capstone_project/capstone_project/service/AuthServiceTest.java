package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.dto.request.LogInRequest;
import com.capstone_project.capstone_project.dto.request.SignUpRequest;
import com.capstone_project.capstone_project.dto.response.LoginResponse;
import com.capstone_project.capstone_project.dto.response.SignUpResponse;
import com.capstone_project.capstone_project.enums.AuthProvider;
import com.capstone_project.capstone_project.enums.PurposeToken;
import com.capstone_project.capstone_project.exception.FieldValidationException;
import com.capstone_project.capstone_project.model.SystemRole;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.model.VerificationToken;
import com.capstone_project.capstone_project.repository.SystemRoleRepository;
import com.capstone_project.capstone_project.repository.UserRepository;
import com.capstone_project.capstone_project.repository.VerificationTokenRepository;
import com.capstone_project.capstone_project.util.JwtUtil;
import com.capstone_project.capstone_project.util.TokenGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SystemRoleRepository systemRoleRepository;

    @Mock
    private VerificationTokenRepository tokenRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private TokenGenerator tokenGenerator;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private SystemRole testRole;
    private SignUpRequest signUpRequest;
    private LogInRequest loginRequest;

    @BeforeEach
    void setUp() {
        testRole = SystemRole.builder()
                .id(2)
                .name("USER")
                .build();

        testUser = User.builder()
                .id("user123")
                .username("testuser")
                .email("test@example.com")
                .password("encodedPassword")
                .isActivated(true)
                .authProvider(AuthProvider.LOCAL)
                .systemRole(testRole)
                .createdAt(LocalDateTime.now())
                .build();

        signUpRequest = new SignUpRequest();
        signUpRequest.setUsername("newuser");
        signUpRequest.setEmail("newuser@example.com");
        signUpRequest.setPassword("password123");
        signUpRequest.setConfirmPassword("password123");

        loginRequest = LogInRequest.builder()
                .username("test@example.com")
                .password("password123")
                .build();
    }

    @Test
    void signup_Success() throws Exception {
        // Arrange
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(systemRoleRepository.findById(2)).thenReturn(Optional.of(testRole));
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(tokenGenerator.generateToken()).thenReturn("test-token");
        doNothing().when(emailService).sendVerificationEmail(anyString(), anyString());

        // Act
        SignUpResponse response = authService.signup(signUpRequest);

        // Assert
        assertNotNull(response);
        assertEquals(testUser.getEmail(), response.getEmail());
        verify(userRepository).save(any(User.class));
        verify(tokenRepository).save(any(VerificationToken.class));
        verify(emailService).sendVerificationEmail(anyString(), anyString());
    }

    @Test
    void signup_EmailAlreadyExists_ThrowsException() {
        // Arrange
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        // Act & Assert
        FieldValidationException exception = assertThrows(FieldValidationException.class,
                () -> authService.signup(signUpRequest));
        assertEquals("email", exception.getField());
        assertEquals("Email đã được sử dụng.", exception.getMessage());
    }

    @Test
    void signup_UsernameAlreadyExists_ThrowsException() {
        // Arrange
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByUsername(anyString())).thenReturn(true);

        // Act & Assert
        FieldValidationException exception = assertThrows(FieldValidationException.class,
                () -> authService.signup(signUpRequest));
        assertEquals("username", exception.getField());
        assertEquals("Username đã được sử dụng.", exception.getMessage());
    }

    @Test
    void signup_PasswordMismatch_ThrowsException() {
        // Arrange
        signUpRequest.setConfirmPassword("differentpassword");

        // Act & Assert
        FieldValidationException exception = assertThrows(FieldValidationException.class,
                () -> authService.signup(signUpRequest));
        assertEquals("confirmPassword", exception.getField());
        assertEquals("Confirm password không khớp với password", exception.getMessage());
    }

    @Test
    void verifyAccount_Success() {
        // Arrange
        VerificationToken token = VerificationToken.builder()
                .token("test-token")
                .user(testUser)
                .purposeToken(PurposeToken.ACTIVATION)
                .expiryDate(LocalDateTime.now().plusHours(1))
                .build();

        when(tokenRepository.findByToken("test-token")).thenReturn(Optional.of(token));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        assertDoesNotThrow(() -> authService.verifyAccount("test-token"));

        // Assert
        verify(userRepository).save(any(User.class));
        verify(tokenRepository).delete(token);
    }

    @Test
    void verifyAccount_TokenNotFound_ThrowsException() {
        // Arrange
        when(tokenRepository.findByToken("invalid-token")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.verifyAccount("invalid-token"));
        assertEquals("YOUR ACCOUNT VERIFICATION LINK HAS EXPIRED..", exception.getMessage());
    }

    @Test
    void verifyAccount_TokenExpired_ThrowsException() {
        // Arrange
        VerificationToken token = VerificationToken.builder()
                .token("expired-token")
                .user(testUser)
                .purposeToken(PurposeToken.ACTIVATION)
                .expiryDate(LocalDateTime.now().minusHours(1))
                .build();

        when(tokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.verifyAccount("expired-token"));
        assertEquals("YOUR ACCOUNT VERIFICATION LINK HAS EXPIRED.", exception.getMessage());
    }

    @Test
    void login_Success() {
        // Arrange
        when(userRepository.findByUsername("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtUtil.generateToken(anyString())).thenReturn("jwt-token");

        // Act
        LoginResponse response = authService.login(loginRequest);

        // Assert
        assertNotNull(response);
        assertEquals("jwt-token", response.getToken());
        verify(jwtUtil).generateToken(testUser.getId());
    }

    @Test
    void login_UserNotFound_ThrowsException() {
        // Arrange
        when(userRepository.findByUsername("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.login(loginRequest));
        assertEquals("Invalid email or password", exception.getMessage());
    }

    @Test
    void login_WrongPassword_ThrowsException() {
        // Arrange
        when(userRepository.findByUsername("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.login(loginRequest));
        assertEquals("Invalid email or password", exception.getMessage());
    }

    @Test
    void login_AccountNotActivated_ThrowsException() {
        // Arrange
        testUser.setActivated(false);
        when(userRepository.findByUsername("test@example.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.login(loginRequest));
        assertEquals("Account not activated", exception.getMessage());
    }

    @Test
    void resendVerificationEmail_Success() throws Exception {
        // Arrange
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(tokenGenerator.generateToken()).thenReturn("new-token");
        doNothing().when(emailService).sendVerificationEmail(anyString(), anyString());

        // Act
        assertDoesNotThrow(() -> authService.resendVerificationEmail("test@example.com"));

        // Assert
        verify(tokenRepository).save(any(VerificationToken.class));
        verify(emailService).sendVerificationEmail(anyString(), anyString());
    }

    @Test
    void resendVerificationEmail_UserNotFound_ThrowsException() {
        // Arrange
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.resendVerificationEmail("nonexistent@example.com"));
        assertEquals("User not found", exception.getMessage());
    }

    @Test
    void resendVerificationEmail_AccountAlreadyActivated_ThrowsException() {
        // Arrange
        testUser.setActivated(true);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.resendVerificationEmail("test@example.com"));
        assertEquals("Account already activated", exception.getMessage());
    }
}
