package com.capstone_project.capstone_project.validation;

import com.capstone_project.capstone_project.util.RegexPattern;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class EmailValidator implements ConstraintValidator<EmailConstraint, String> {

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        if (email == null || email.trim().isEmpty()) {
            return true; // Để @NotBlank xử lý lỗi trống
        }
        return email.matches(RegexPattern.EMAIL);
    }
}
