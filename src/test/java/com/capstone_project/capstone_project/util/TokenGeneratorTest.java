package com.capstone_project.capstone_project.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class TokenGeneratorTest {

    @InjectMocks
    private TokenGenerator tokenGenerator;

    @BeforeEach
    void setUp() {
        // TokenGenerator is a utility class, no setup needed
    }

    @Test
    void generateToken_ReturnsValidToken() {
        // Act
        String token = tokenGenerator.generateToken();

        // Assert
        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.length() > 0);
    }

    @Test
    void generateToken_ReturnsUniqueTokens() {
        // Arrange
        Set<String> tokens = new HashSet<>();
        int numberOfTokens = 100;

        // Act
        for (int i = 0; i < numberOfTokens; i++) {
            String token = tokenGenerator.generateToken();
            tokens.add(token);
        }

        // Assert
        assertEquals(numberOfTokens, tokens.size(), "All generated tokens should be unique");
    }

    @Test
    void generateToken_ReturnsAlphanumericTokens() {
        // Act
        String token = tokenGenerator.generateToken();

        // Assert
        assertTrue(token.matches("^[a-zA-Z0-9]+$"), "Token should contain only alphanumeric characters");
    }

    @Test
    void generateToken_ReturnsConsistentLength() {
        // Arrange
        int numberOfTokens = 10;
        Set<Integer> lengths = new HashSet<>();

        // Act
        for (int i = 0; i < numberOfTokens; i++) {
            String token = tokenGenerator.generateToken();
            lengths.add(token.length());
        }

        // Assert
        assertEquals(1, lengths.size(), "All tokens should have the same length");
        assertTrue(lengths.iterator().next() > 0, "Token length should be greater than 0");
    }

    @Test
    void generateToken_ReturnsDifferentTokensOnMultipleCalls() {
        // Act
        String token1 = tokenGenerator.generateToken();
        String token2 = tokenGenerator.generateToken();
        String token3 = tokenGenerator.generateToken();

        // Assert
        assertNotEquals(token1, token2, "First and second tokens should be different");
        assertNotEquals(token2, token3, "Second and third tokens should be different");
        assertNotEquals(token1, token3, "First and third tokens should be different");
    }

    @Test
    void generateToken_HandlesConcurrentGeneration() {
        // Arrange
        int numberOfThreads = 10;
        int tokensPerThread = 10;
        Set<String> allTokens = new HashSet<>();

        // Act
        Thread[] threads = new Thread[numberOfThreads];
        for (int i = 0; i < numberOfThreads; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < tokensPerThread; j++) {
                    String token = tokenGenerator.generateToken();
                    synchronized (allTokens) {
                        allTokens.add(token);
                    }
                }
            });
            threads[i].start();
        }

        // Wait for all threads to complete
        for (Thread thread : threads) {
            try {
                thread.join();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        // Assert
        assertEquals(numberOfThreads * tokensPerThread, allTokens.size(),
                "All tokens generated across threads should be unique");
    }

    @Test
    void generateToken_ReturnsValidFormat() {
        // Act
        String token = tokenGenerator.generateToken();

        // Assert
        assertNotNull(token);
        assertFalse(token.contains(" "), "Token should not contain spaces");
        assertFalse(token.contains("-"), "Token should not contain hyphens");
        assertFalse(token.contains("_"), "Token should not contain underscores");
        assertFalse(token.contains("."), "Token should not contain dots");
        assertFalse(token.contains("/"), "Token should not contain forward slashes");
        assertFalse(token.contains("\\"), "Token should not contain backslashes");
    }

    @Test
    void generateToken_ReturnsCaseSensitiveTokens() {
        // Act
        String token1 = tokenGenerator.generateToken();
        String token2 = tokenGenerator.generateToken();

        // Assert
        assertNotEquals(token1.toLowerCase(), token2.toLowerCase(),
                "Tokens should be different even when converted to lowercase");
    }

    @Test
    void generateToken_ReturnsTokensWithMixedCase() {
        // Act
        String token = tokenGenerator.generateToken();

        // Assert
        boolean hasUpperCase = token.chars().anyMatch(Character::isUpperCase);
        boolean hasLowerCase = token.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = token.chars().anyMatch(Character::isDigit);

        assertTrue(hasUpperCase || hasLowerCase || hasDigit,
                "Token should contain at least one alphanumeric character");
    }

    @Test
    void generateToken_ReturnsTokensWithReasonableLength() {
        // Act
        String token = tokenGenerator.generateToken();

        // Assert
        assertTrue(token.length() >= 8, "Token should be at least 8 characters long");
        assertTrue(token.length() <= 64, "Token should not be excessively long");
    }

    @Test
    void generateToken_ReturnsTokensWithoutSpecialCharacters() {
        // Act
        String token = tokenGenerator.generateToken();

        // Assert
        assertTrue(token.matches("^[a-zA-Z0-9]+$"),
                "Token should only contain alphanumeric characters");
    }
}
