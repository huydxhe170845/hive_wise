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
public class ChangePasswordRequest {

    @NotBlank(message = "Current password không được để trống")
    @PasswordConstraint
    String currentPassword;

    @NotBlank(message = "New password không được để trống")
    @PasswordConstraint
    String newPassword;

    @NotBlank(message = "Confirm new password không được để trống")
    @PasswordConstraint
    String confirmNewPassword;

}
