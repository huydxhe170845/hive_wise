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
class PasswordValidatorTest {

    private PasswordValidator passwordValidator;

    @Mock
    private ConstraintValidatorContext context;

    @Mock
    private ConstraintValidatorContext.ConstraintViolationBuilder builder;

    @BeforeEach
    void setUp() {
        passwordValidator = new PasswordValidator();
        when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(builder);
        when(builder.addConstraintViolation()).thenReturn(context);
    }

    @Test
    void isValid_ValidPassword_ReturnsTrue() {
        // Arrange
        String validPassword = "Password123!";

        // Act
        boolean result = passwordValidator.isValid(validPassword, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidPasswordWithSpecialCharacters_ReturnsTrue() {
        // Arrange
        String validPassword = "MyP@ssw0rd#";

        // Act
        boolean result = passwordValidator.isValid(validPassword, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidPasswordWithNumbers_ReturnsTrue() {
        // Arrange
        String validPassword = "SecurePass123";

        // Act
        boolean result = passwordValidator.isValid(validPassword, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidPasswordWithMixedCase_ReturnsTrue() {
        // Arrange
        String validPassword = "MixedCase123!";

        // Act
        boolean result = passwordValidator.isValid(validPassword, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_NullPassword_ReturnsFalse() {
        // Arrange
        String nullPassword = null;

        // Act
        boolean result = passwordValidator.isValid(nullPassword, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password không được để trống");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_EmptyPassword_ReturnsFalse() {
        // Arrange
        String emptyPassword = "";

        // Act
        boolean result = passwordValidator.isValid(emptyPassword, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password không được để trống");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_BlankPassword_ReturnsFalse() {
        // Arrange
        String blankPassword = "   ";

        // Act
        boolean result = passwordValidator.isValid(blankPassword, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password không được để trống");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_PasswordTooShort_ReturnsFalse() {
        // Arrange
        String shortPassword = "Pass1!";

        // Act
        boolean result = passwordValidator.isValid(shortPassword, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password phải có ít nhất 8 ký tự");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_PasswordTooLong_ReturnsFalse() {
        // Arrange
        String longPassword = "VeryLongPasswordThatExceedsTheMaximumLengthAllowed123!";

        // Act
        boolean result = passwordValidator.isValid(longPassword, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password không được quá 50 ký tự");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_PasswordWithoutUppercase_ReturnsFalse() {
        // Arrange
        String passwordWithoutUppercase = "password123!";

        // Act
        boolean result = passwordValidator.isValid(passwordWithoutUppercase, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password phải có ít nhất 1 chữ hoa");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_PasswordWithoutLowercase_ReturnsFalse() {
        // Arrange
        String passwordWithoutLowercase = "PASSWORD123!";

        // Act
        boolean result = passwordValidator.isValid(passwordWithoutLowercase, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password phải có ít nhất 1 chữ thường");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_PasswordWithoutNumber_ReturnsFalse() {
        // Arrange
        String passwordWithoutNumber = "Password!";

        // Act
        boolean result = passwordValidator.isValid(passwordWithoutNumber, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password phải có ít nhất 1 số");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_PasswordWithoutSpecialCharacter_ReturnsFalse() {
        // Arrange
        String passwordWithoutSpecial = "Password123";

        // Act
        boolean result = passwordValidator.isValid(passwordWithoutSpecial, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password phải có ít nhất 1 ký tự đặc biệt");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_PasswordWithOnlyLetters_ReturnsFalse() {
        // Arrange
        String lettersOnlyPassword = "OnlyLetters";

        // Act
        boolean result = passwordValidator.isValid(lettersOnlyPassword, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password phải có ít nhất 1 số");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_PasswordWithOnlyNumbers_ReturnsFalse() {
        // Arrange
        String numbersOnlyPassword = "12345678";

        // Act
        boolean result = passwordValidator.isValid(numbersOnlyPassword, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password phải có ít nhất 1 chữ hoa");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_PasswordWithOnlySpecialCharacters_ReturnsFalse() {
        // Arrange
        String specialOnlyPassword = "!@#$%^&*";

        // Act
        boolean result = passwordValidator.isValid(specialOnlyPassword, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password phải có ít nhất 1 chữ hoa");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_PasswordWithSpaces_ReturnsFalse() {
        // Arrange
        String passwordWithSpaces = "Pass word123!";

        // Act
        boolean result = passwordValidator.isValid(passwordWithSpaces, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password không được chứa khoảng trắng");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_PasswordWithLeadingSpace_ReturnsFalse() {
        // Arrange
        String passwordWithLeadingSpace = " Password123!";

        // Act
        boolean result = passwordValidator.isValid(passwordWithLeadingSpace, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password không được chứa khoảng trắng");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_PasswordWithTrailingSpace_ReturnsFalse() {
        // Arrange
        String passwordWithTrailingSpace = "Password123! ";

        // Act
        boolean result = passwordValidator.isValid(passwordWithTrailingSpace, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Password không được chứa khoảng trắng");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_PasswordWithMultipleValidationErrors_ReturnsFalse() {
        // Arrange
        String invalidPassword = "pass"; // Too short, no uppercase, no number, no special char

        // Act
        boolean result = passwordValidator.isValid(invalidPassword, context);

        // Assert
        assertFalse(result);
        // Should fail on the first validation error (length)
        verify(context).buildConstraintViolationWithTemplate("Password phải có ít nhất 8 ký tự");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_ValidPasswordWithMinimumLength_ReturnsTrue() {
        // Arrange
        String validPassword = "Pass1!@#"; // Exactly 8 characters

        // Act
        boolean result = passwordValidator.isValid(validPassword, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidPasswordWithMaximumLength_ReturnsTrue() {
        // Arrange
        String validPassword = "VeryLongPasswordThatIsExactlyFiftyCharactersLong123!@#"; // Exactly 50 characters

        // Act
        boolean result = passwordValidator.isValid(validPassword, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }
}
