package com.capstone_project.capstone_project.dto.request;

import com.capstone_project.capstone_project.validation.EmailConstraint;
import com.capstone_project.capstone_project.validation.PasswordConstraint;
import com.capstone_project.capstone_project.validation.UsernameConstraint;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SignUpRequest {

    @NotBlank(message = "Username không được để trống")
    @UsernameConstraint(message = "Username chỉ được chứa chữ, số, dấu . _ - và từ 3 đến 20 ký tự")
    String username;


    @NotBlank(message = "Email không được để trống")
    @EmailConstraint
    String email;

    @NotBlank(message = "Password không được để trống")
    @PasswordConstraint
    String password;

    @NotBlank(message = "Confirm Password không được để trống")
    String confirmPassword;

    @NotNull(message = "Bạn phải đồng ý điều khoản")
    @AssertTrue(message = "Bạn phải đồng ý điều khoản")
            
    Boolean agreeTerms;
}
