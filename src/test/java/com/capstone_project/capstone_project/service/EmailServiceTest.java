package com.capstone_project.capstone_project.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "test@example.com");
    }

    @Test
    void sendVerificationEmail_Success() throws MessagingException, IOException {
        // Arrange
        String toEmail = "user@example.com";
        String token = "test-token";
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act
        assertDoesNotThrow(() -> emailService.sendVerificationEmail(toEmail, token));

        // Assert
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendWelcomeEmail_Success() throws MessagingException, IOException {
        // Arrange
        String toEmail = "user@example.com";
        String username = "testuser";
        String name = "Test User";
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act
        assertDoesNotThrow(() -> emailService.sendWelcomeEmail(toEmail, username, name));

        // Assert
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendWelcomeEmailWithPassword_Success() throws MessagingException, IOException {
        // Arrange
        String toEmail = "user@example.com";
        String username = "testuser";
        String name = "Test User";
        String password = "testpassword";
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act
        assertDoesNotThrow(() -> emailService.sendWelcomeEmailWithPassword(toEmail, username, name, password));

        // Assert
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendResetPasswordEmail_Success() throws MessagingException, IOException {
        // Arrange
        String toEmail = "user@example.com";
        String token = "reset-token";
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act
        assertDoesNotThrow(() -> emailService.sendResetPasswordEmail(toEmail, token));

        // Assert
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendVerificationCodeEmail_Success() throws MessagingException, IOException {
        // Arrange
        String toEmail = "user@example.com";
        String code = "123456";
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act
        assertDoesNotThrow(() -> emailService.sendVerificationCodeEmail(toEmail, code));

        // Assert
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendRegitrationSuccessEmail_Success() throws MessagingException, IOException {
        // Arrange
        String toEmail = "user@example.com";
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act
        assertDoesNotThrow(() -> emailService.sendRegitrationSuccessEmail(toEmail));

        // Assert
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendEmail_WithNullEmail_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> emailService.sendVerificationEmail(null, "token"));
    }

    @Test
    void sendEmail_WithEmptyEmail_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> emailService.sendVerificationEmail("", "token"));
    }

    @Test
    void sendEmail_WithInvalidEmailFormat_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> emailService.sendVerificationEmail("invalid-email", "token"));
    }
}
