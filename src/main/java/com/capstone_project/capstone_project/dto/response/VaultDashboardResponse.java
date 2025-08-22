package com.capstone_project.capstone_project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VaultDashboardResponse {
    private String id;
    private String name;
    private String ownerEmail;
    private String ownerName;
    private int memberCount;
    private int documentCount;
    private String size;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime deactivatedAt;
    private LocalDateTime deletedAt;
    private String iconColor;
    private List<String> memberAvatars;
    private Boolean isActivated; // For backward compatibility
    private Boolean isDeleted;

    public String getStatusBadgeClass() {
        if (isDeleted != null && isDeleted) {
            return "badge-dark";
        }

        if (status == null)
            return "badge-secondary";

        switch (status.toLowerCase()) {
            case "active":
                return "badge-success";
            case "inactive":
                return "badge-danger";
            case "pending":
                return "badge-warning";
            default:
                return "badge-secondary";
        }
    }

    public String getIconColorClass() {
        if (iconColor == null)
            return "text-primary";
        return iconColor;
    }
}
