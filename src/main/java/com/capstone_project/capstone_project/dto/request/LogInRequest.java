package com.capstone_project.capstone_project.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LogInRequest {

    @NotBlank(message = "Username không được để trống")
    String username;

    @NotBlank(message = "Password không được để trống")
    String password;

    boolean rememberMe;
}
