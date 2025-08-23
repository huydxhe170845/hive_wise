package com.capstone_project.capstone_project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSuggestionResponse {
    private String id;
    private String username;
    private String email;
    private String avatar;
    private boolean isAlreadyMember;
    private String currentRole; // null if not a member
    private String formattedCurrentRole; // formatted role name for display
}
