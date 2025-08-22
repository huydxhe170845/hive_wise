package com.capstone_project.capstone_project.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDTO {
    private String id;
    private String username;
    private String email;
    private String phoneNumber;
    private boolean activated;
    private String roleName;
    private Integer roleId;
    private String avatar;
}