package com.capstone_project.capstone_project.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = PasswordValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface PasswordConstraint {
    String message() default "8+ chars: use lower, upper, number, or special.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
