package com.capstone_project.capstone_project.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class JwtUtilTest {

    @InjectMocks
    private JwtUtil jwtUtil;

    private static final String SECRET_KEY = "dGVzdFNlY3JldEtleUZvckp3dFRva2VuR2VuZXJhdGlvbkFuZFZhbGlkYXRpb24=";
    private static final long EXPIRATION_TIME = 86400000; // 24 hours

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtUtil, "secretKey", SECRET_KEY);
        ReflectionTestUtils.setField(jwtUtil, "expiration", EXPIRATION_TIME);
    }

    @Test
    void generateToken_WithUsername_ReturnsValidToken() {
        // Arrange
        String username = "user123";

        // Act
        String token = jwtUtil.generateToken(username);

        // Assert
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.split("\\.").length == 3); // JWT has 3 parts
    }

    @Test
    void generateToken_WithNullUsername_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> jwtUtil.generateToken(null));
    }

    @Test
    void generateToken_WithEmptyUsername_ThrowsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> jwtUtil.generateToken(""));
    }

    @Test
    void validateToken_WithValidToken_ReturnsTrue() {
        // Arrange
        String username = "user123";
        String token = jwtUtil.generateToken(username);

        // Act
        boolean isValid = jwtUtil.validateToken(token);

        // Assert
        assertTrue(isValid);
    }

    @Test
    void validateToken_WithInvalidToken_ReturnsFalse() {
        // Arrange
        String invalidToken = "invalid.token.here";

        // Act
        boolean isValid = jwtUtil.validateToken(invalidToken);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void validateToken_WithNullToken_ReturnsFalse() {
        // Act
        boolean isValid = jwtUtil.validateToken(null);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void validateToken_WithEmptyToken_ReturnsFalse() {
        // Act
        boolean isValid = jwtUtil.validateToken("");

        // Assert
        assertFalse(isValid);
    }

    @Test
    void extractUsername_WithValidToken_ReturnsUsername() {
        // Arrange
        String username = "user123";
        String token = jwtUtil.generateToken(username);

        // Act
        String extractedUsername = jwtUtil.extractUsername(token);

        // Assert
        assertEquals(username, extractedUsername);
    }

    @Test
    void extractUsername_WithInvalidToken_ThrowsException() {
        // Arrange
        String invalidToken = "invalid.token.here";

        // Act & Assert
        assertThrows(Exception.class, () -> jwtUtil.extractUsername(invalidToken));
    }

    @Test
    void generateToken_WithDifferentUsernames_ReturnsDifferentTokens() {
        // Arrange
        String username1 = "user123";
        String username2 = "user456";

        // Act
        String token1 = jwtUtil.generateToken(username1);
        String token2 = jwtUtil.generateToken(username2);

        // Assert
        assertNotEquals(token1, token2);
    }

    @Test
    void generateToken_WithSameUsername_ReturnsDifferentTokens() {
        // Arrange
        String username = "user123";

        // Act
        String token1 = jwtUtil.generateToken(username);
        String token2 = jwtUtil.generateToken(username);

        // Assert
        assertNotEquals(token1, token2); // Different timestamps
    }
}
