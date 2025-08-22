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
class EmailValidatorTest {

    private EmailValidator emailValidator;

    @Mock
    private ConstraintValidatorContext context;

    @Mock
    private ConstraintValidatorContext.ConstraintViolationBuilder builder;

    @BeforeEach
    void setUp() {
        emailValidator = new EmailValidator();
        when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(builder);
        when(builder.addConstraintViolation()).thenReturn(context);
    }

    @Test
    void isValid_ValidEmail_ReturnsTrue() {
        // Arrange
        String validEmail = "test@example.com";

        // Act
        boolean result = emailValidator.isValid(validEmail, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidEmailWithSubdomain_ReturnsTrue() {
        // Arrange
        String validEmail = "test@subdomain.example.com";

        // Act
        boolean result = emailValidator.isValid(validEmail, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidEmailWithHyphen_ReturnsTrue() {
        // Arrange
        String validEmail = "test-user@example.com";

        // Act
        boolean result = emailValidator.isValid(validEmail, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidEmailWithUnderscore_ReturnsTrue() {
        // Arrange
        String validEmail = "test_user@example.com";

        // Act
        boolean result = emailValidator.isValid(validEmail, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidEmailWithPlus_ReturnsTrue() {
        // Arrange
        String validEmail = "test+tag@example.com";

        // Act
        boolean result = emailValidator.isValid(validEmail, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidEmailWithNumbers_ReturnsTrue() {
        // Arrange
        String validEmail = "test123@example.com";

        // Act
        boolean result = emailValidator.isValid(validEmail, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_ValidEmailWithDotInLocalPart_ReturnsTrue() {
        // Arrange
        String validEmail = "test.name@example.com";

        // Act
        boolean result = emailValidator.isValid(validEmail, context);

        // Assert
        assertTrue(result);
        verifyNoInteractions(context);
    }

    @Test
    void isValid_NullEmail_ReturnsFalse() {
        // Arrange
        String nullEmail = null;

        // Act
        boolean result = emailValidator.isValid(nullEmail, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Email không được để trống");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_EmptyEmail_ReturnsFalse() {
        // Arrange
        String emptyEmail = "";

        // Act
        boolean result = emailValidator.isValid(emptyEmail, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Email không được để trống");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_BlankEmail_ReturnsFalse() {
        // Arrange
        String blankEmail = "   ";

        // Act
        boolean result = emailValidator.isValid(blankEmail, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Email không được để trống");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_EmailWithoutAtSymbol_ReturnsFalse() {
        // Arrange
        String invalidEmail = "testexample.com";

        // Act
        boolean result = emailValidator.isValid(invalidEmail, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Email không đúng định dạng");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_EmailWithMultipleAtSymbols_ReturnsFalse() {
        // Arrange
        String invalidEmail = "test@@example.com";

        // Act
        boolean result = emailValidator.isValid(invalidEmail, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Email không đúng định dạng");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_EmailWithoutDomain_ReturnsFalse() {
        // Arrange
        String invalidEmail = "test@";

        // Act
        boolean result = emailValidator.isValid(invalidEmail, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Email không đúng định dạng");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_EmailWithoutLocalPart_ReturnsFalse() {
        // Arrange
        String invalidEmail = "@example.com";

        // Act
        boolean result = emailValidator.isValid(invalidEmail, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Email không đúng định dạng");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_EmailWithInvalidCharacters_ReturnsFalse() {
        // Arrange
        String invalidEmail = "test<>@example.com";

        // Act
        boolean result = emailValidator.isValid(invalidEmail, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Email không đúng định dạng");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_EmailWithSpace_ReturnsFalse() {
        // Arrange
        String invalidEmail = "test @example.com";

        // Act
        boolean result = emailValidator.isValid(invalidEmail, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Email không đúng định dạng");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_EmailWithConsecutiveDots_ReturnsFalse() {
        // Arrange
        String invalidEmail = "test..name@example.com";

        // Act
        boolean result = emailValidator.isValid(invalidEmail, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Email không đúng định dạng");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_EmailStartingWithDot_ReturnsFalse() {
        // Arrange
        String invalidEmail = ".test@example.com";

        // Act
        boolean result = emailValidator.isValid(invalidEmail, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Email không đúng định dạng");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_EmailEndingWithDot_ReturnsFalse() {
        // Arrange
        String invalidEmail = "test.@example.com";

        // Act
        boolean result = emailValidator.isValid(invalidEmail, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Email không đúng định dạng");
        verify(builder).addConstraintViolation();
    }

    @Test
    void isValid_EmailWithInvalidDomain_ReturnsFalse() {
        // Arrange
        String invalidEmail = "test@example";

        // Act
        boolean result = emailValidator.isValid(invalidEmail, context);

        // Assert
        assertFalse(result);
        verify(context).buildConstraintViolationWithTemplate("Email không đúng định dạng");
        verify(builder).addConstraintViolation();
    }
}
