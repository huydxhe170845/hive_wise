package com.capstone_project.capstone_project.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserVaultRoleResponse {
    String userId; // u.id
    String email; // u.email
    String fullName; // u.name
    String userName; // u.username
    String vaultRoleName; // r.name
    String avatar; // u.avatar

    public String getInitial() {
        return (userName != null && !userName.isEmpty())
                ? userName.substring(0, 1).toUpperCase()
                : "U";
    }

}
