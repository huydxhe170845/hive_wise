package com.capstone_project.capstone_project.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddVaultRequest {

    @NotBlank(message = "Name không được để trống")
    String name;

    String description;

    String createdByUserId;

    String createdByEmail;

    MultipartFile photo;

}
