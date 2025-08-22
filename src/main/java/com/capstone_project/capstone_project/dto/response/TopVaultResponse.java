package com.capstone_project.capstone_project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopVaultResponse {
    private String vaultId;
    private String name;
    private String ownerName;
    private String iconColorClass;
    private long knowledgeCount;
    private long totalViews;
    private double activityScore;
    private int memberCount;
}
