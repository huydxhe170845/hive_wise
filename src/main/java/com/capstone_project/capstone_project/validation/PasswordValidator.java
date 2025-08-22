package com.capstone_project.capstone_project.validation;

import com.capstone_project.capstone_project.util.RegexPattern;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PasswordValidator implements ConstraintValidator<PasswordConstraint, String> {

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.trim().isEmpty()) {
            return true;
        }
        return password.matches(RegexPattern.PASSWORD);
    }
}
