package com.capstone_project.capstone_project.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FieldValidationExceptionTest {

    @Test
    void constructor_WithFieldAndMessage_CreatesExceptionWithCorrectValues() {
        // Arrange
        String field = "email";
        String message = "Email không hợp lệ";

        // Act
        FieldValidationException exception = new FieldValidationException(field, message);

        // Assert
        assertEquals(field, exception.getField());
        assertEquals(message, exception.getMessage());
    }

    @Test
    void constructor_WithNullField_CreatesExceptionWithNullField() {
        // Arrange
        String field = null;
        String message = "Validation error";

        // Act
        FieldValidationException exception = new FieldValidationException(field, message);

        // Assert
        assertNull(exception.getField());
        assertEquals(message, exception.getMessage());
    }

    @Test
    void constructor_WithNullMessage_CreatesExceptionWithNullMessage() {
        // Arrange
        String field = "username";
        String message = null;

        // Act
        FieldValidationException exception = new FieldValidationException(field, message);

        // Assert
        assertEquals(field, exception.getField());
        assertNull(exception.getMessage());
    }

    @Test
    void constructor_WithEmptyField_CreatesExceptionWithEmptyField() {
        // Arrange
        String field = "";
        String message = "Field is empty";

        // Act
        FieldValidationException exception = new FieldValidationException(field, message);

        // Assert
        assertEquals(field, exception.getField());
        assertEquals(message, exception.getMessage());
    }

    @Test
    void constructor_WithEmptyMessage_CreatesExceptionWithEmptyMessage() {
        // Arrange
        String field = "password";
        String message = "";

        // Act
        FieldValidationException exception = new FieldValidationException(field, message);

        // Assert
        assertEquals(field, exception.getField());
        assertEquals(message, exception.getMessage());
    }

    @Test
    void constructor_WithSpecialCharactersInField_CreatesExceptionWithCorrectField() {
        // Arrange
        String field = "user.email";
        String message = "Invalid email format";

        // Act
        FieldValidationException exception = new FieldValidationException(field, message);

        // Assert
        assertEquals(field, exception.getField());
        assertEquals(message, exception.getMessage());
    }

    @Test
    void constructor_WithSpecialCharactersInMessage_CreatesExceptionWithCorrectMessage() {
        // Arrange
        String field = "password";
        String message = "Mật khẩu phải có ít nhất 8 ký tự và chứa @#$%^&*";

        // Act
        FieldValidationException exception = new FieldValidationException(field, message);

        // Assert
        assertEquals(field, exception.getField());
        assertEquals(message, exception.getMessage());
    }

    @Test
    void getField_ReturnsCorrectField() {
        // Arrange
        String field = "confirmPassword";
        String message = "Passwords do not match";
        FieldValidationException exception = new FieldValidationException(field, message);

        // Act
        String result = exception.getField();

        // Assert
        assertEquals(field, result);
    }

    @Test
    void getMessage_ReturnsCorrectMessage() {
        // Arrange
        String field = "username";
        String message = "Username already exists";
        FieldValidationException exception = new FieldValidationException(field, message);

        // Act
        String result = exception.getMessage();

        // Assert
        assertEquals(message, result);
    }

    @Test
    void exception_IsInstanceOfRuntimeException() {
        // Arrange
        String field = "email";
        String message = "Invalid email";

        // Act
        FieldValidationException exception = new FieldValidationException(field, message);

        // Assert
        assertTrue(exception instanceof RuntimeException);
    }

    @Test
    void exception_CanBeThrownAndCaught() {
        // Arrange
        String field = "age";
        String message = "Age must be positive";

        // Act & Assert
        assertThrows(FieldValidationException.class, () -> {
            throw new FieldValidationException(field, message);
        });
    }

    @Test
    void exception_CanBeCaughtAndFieldAndMessageRetrieved() {
        // Arrange
        String field = "phone";
        String message = "Invalid phone number format";

        try {
            // Act
            throw new FieldValidationException(field, message);
        } catch (FieldValidationException e) {
            // Assert
            assertEquals(field, e.getField());
            assertEquals(message, e.getMessage());
        }
    }

    @Test
    void multipleExceptions_CanBeCreatedWithDifferentValues() {
        // Arrange & Act
        FieldValidationException exception1 = new FieldValidationException("email", "Invalid email");
        FieldValidationException exception2 = new FieldValidationException("password", "Too short");
        FieldValidationException exception3 = new FieldValidationException("username", "Already exists");

        // Assert
        assertEquals("email", exception1.getField());
        assertEquals("Invalid email", exception1.getMessage());

        assertEquals("password", exception2.getField());
        assertEquals("Too short", exception2.getMessage());

        assertEquals("username", exception3.getField());
        assertEquals("Already exists", exception3.getMessage());
    }
}
