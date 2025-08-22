package com.capstone_project.capstone_project.validation;

import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsernameValidatorTest {

    private UsernameValidator usernameValidator;

    @Mock
    private ConstraintValidatorContext context;

    @Mock
    private ConstraintValidatorContext.ConstraintViolationBuilder builder;

    @BeforeEach
    void setUp() {
        usernameValidator = new UsernameValidator();
        when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(builder);
        when(builder.addConstraintViolation()).thenReturn(context);
    }

    @Test
    void isValid_ValidUsername_ReturnsTrue() {
        // Arrange
        String validUsername = "testuser";

        // Act
        boolean result = usernameValidator.isValid(validUsername, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidUsernameWithNumbers_ReturnsTrue() {
        // Arrange
        String validUsername = "testuser123";

        // Act
        boolean result = usernameValidator.isValid(validUsername, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidUsernameWithUnderscore_ReturnsTrue() {
        // Arrange
        String validUsername = "test_user";

        // Act
        boolean result = usernameValidator.isValid(validUsername, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidUsernameWithHyphen_ReturnsTrue() {
        // Arrange
        String validUsername = "test-user";

        // Act
        boolean result = usernameValidator.isValid(validUsername, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidUsernameWithDot_ReturnsTrue() {
        // Arrange
        String validUsername = "test.user";

        // Act
        boolean result = usernameValidator.isValid(validUsername, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidUsernameWithMixedCharacters_ReturnsTrue() {
        // Arrange
        String validUsername = "test.user_123";

        // Act
        boolean result = usernameValidator.isValid(validUsername, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidUsernameWithMinimumLength_ReturnsTrue() {
        // Arrange
        String validUsername = "abc"; // Exactly 3 characters

        // Act
        boolean result = usernameValidator.isValid(validUsername, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidUsernameWithMaximumLength_ReturnsTrue() {
        // Arrange
        String validUsername = "verylongusername123"; // Exactly 20 characters

        // Act
        boolean result = usernameValidator.isValid(validUsername, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_NullUsername_ReturnsFalse() {
        // Arrange
        String nullUsername = null;

        // Act
        boolean result = usernameValidator.isValid(nullUsername, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Username không được để trống");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_EmptyUsername_ReturnsFalse() {
        // Arrange
        String emptyUsername = "";

        // Act
        boolean result = usernameValidator.isValid(emptyUsername, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Username không được để trống");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_BlankUsername_ReturnsFalse() {
        // Arrange
        String blankUsername = "   ";

        // Act
        boolean result = usernameValidator.isValid(blankUsername, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Username không được để trống");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_UsernameTooShort_ReturnsFalse() {
        // Arrange
        String shortUsername = "ab"; // Less than 3 characters

        // Act
        boolean result = usernameValidator.isValid(shortUsername, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Username phải có từ 3 đến 20 ký tự");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_UsernameTooLong_ReturnsFalse() {
        // Arrange
        String longUsername = "verylongusername123456"; // More than 20 characters

        // Act
        boolean result = usernameValidator.isValid(longUsername, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Username phải có từ 3 đến 20 ký tự");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_UsernameWithInvalidCharacters_ReturnsFalse() {
        // Arrange
        String invalidUsername = "test@user";

        // Act
        boolean result = usernameValidator.isValid(invalidUsername, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Username chỉ được chứa chữ, số, dấu . _ -");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_UsernameWithSpaces_ReturnsFalse() {
        // Arrange
        String usernameWithSpaces = "test user";

        // Act
        boolean result = usernameValidator.isValid(usernameWithSpaces, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Username chỉ được chứa chữ, số, dấu . _ -");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_UsernameWithSpecialCharacters_ReturnsFalse() {
        // Arrange
        String usernameWithSpecialChars = "test#user";

        // Act
        boolean result = usernameValidator.isValid(usernameWithSpecialChars, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Username chỉ được chứa chữ, số, dấu . _ -");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_UsernameWithMultipleSpecialCharacters_ReturnsFalse() {
        // Arrange
        String usernameWithMultipleSpecial = "test!@#$%user";

        // Act
        boolean result = usernameValidator.isValid(usernameWithMultipleSpecial, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Username chỉ được chứa chữ, số, dấu . _ -");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_UsernameStartingWithNumber_ReturnsTrue() {
        // Arrange
        String usernameStartingWithNumber = "123test";

        // Act
        boolean result = usernameValidator.isValid(usernameStartingWithNumber, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_UsernameStartingWithUnderscore_ReturnsTrue() {
        // Arrange
        String usernameStartingWithUnderscore = "_testuser";

        // Act
        boolean result = usernameValidator.isValid(usernameStartingWithUnderscore, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_UsernameStartingWithHyphen_ReturnsTrue() {
        // Arrange
        String usernameStartingWithHyphen = "-testuser";

        // Act
        boolean result = usernameValidator.isValid(usernameStartingWithHyphen, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_UsernameStartingWithDot_ReturnsTrue() {
        // Arrange
        String usernameStartingWithDot = ".testuser";

        // Act
        boolean result = usernameValidator.isValid(usernameStartingWithDot, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_UsernameEndingWithNumber_ReturnsTrue() {
        // Arrange
        String usernameEndingWithNumber = "testuser123";

        // Act
        boolean result = usernameValidator.isValid(usernameEndingWithNumber, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_UsernameEndingWithUnderscore_ReturnsTrue() {
        // Arrange
        String usernameEndingWithUnderscore = "testuser_";

        // Act
        boolean result = usernameValidator.isValid(usernameEndingWithUnderscore, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_UsernameEndingWithHyphen_ReturnsTrue() {
        // Arrange
        String usernameEndingWithHyphen = "testuser-";

        // Act
        boolean result = usernameValidator.isValid(usernameEndingWithHyphen, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_UsernameEndingWithDot_ReturnsTrue() {
        // Arrange
        String usernameEndingWithDot = "testuser.";

        // Act
        boolean result = usernameValidator.isValid(usernameEndingWithDot, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_UsernameWithConsecutiveDots_ReturnsTrue() {
        // Arrange
        String usernameWithConsecutiveDots = "test..user";

        // Act
        boolean result = usernameValidator.isValid(usernameWithConsecutiveDots, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_UsernameWithConsecutiveUnderscores_ReturnsTrue() {
        // Arrange
        String usernameWithConsecutiveUnderscores = "test__user";

        // Act
        boolean result = usernameValidator.isValid(usernameWithConsecutiveUnderscores, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_UsernameWithConsecutiveHyphens_ReturnsTrue() {
        // Arrange
        String usernameWithConsecutiveHyphens = "test--user";

        // Act
        boolean result = usernameValidator.isValid(usernameWithConsecutiveHyphens, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_UsernameWithMixedCase_ReturnsTrue() {
        // Arrange
        String usernameWithMixedCase = "TestUser123";

        // Act
        boolean result = usernameValidator.isValid(usernameWithMixedCase, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_UsernameWithAllValidCharacters_ReturnsTrue() {
        // Arrange
        String usernameWithAllValid = "Test.User_123-";

        // Act
        boolean result = usernameValidator.isValid(usernameWithAllValid, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }
}
