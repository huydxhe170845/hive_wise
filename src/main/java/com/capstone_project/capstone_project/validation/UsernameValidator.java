package com.capstone_project.capstone_project.validation;

import com.capstone_project.capstone_project.util.RegexPattern;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class UsernameValidator implements ConstraintValidator<UsernameConstraint, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return true;
        }
        return value.matches(RegexPattern.USERNAME);
    }
}

