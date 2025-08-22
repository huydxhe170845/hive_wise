package com.capstone_project.capstone_project.exception;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
@AllArgsConstructor
public class FieldValidationException extends RuntimeException {
    String field;

    public FieldValidationException(String field, String message) {
        super(message);
        this.field = field;
    }

}
