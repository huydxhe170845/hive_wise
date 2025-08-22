package com.capstone_project.capstone_project.dto.request;

import com.capstone_project.capstone_project.validation.PasswordConstraint;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResetPasswordRequest {

    @NotBlank(message = "Password không được để trống")
    @PasswordConstraint
    String password;

    @NotBlank(message = "Confirm Password không được để trống")
    String confirmPassword;
}
