package com.capstone_project.capstone_project.dto.request;

import com.capstone_project.capstone_project.validation.EmailConstraint;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ForgotPasswordRequest {

    @NotBlank(message = "Email không được để trống")
    @EmailConstraint
    String email;
}
