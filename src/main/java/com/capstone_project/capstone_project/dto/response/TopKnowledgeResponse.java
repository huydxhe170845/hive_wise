package com.capstone_project.capstone_project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopKnowledgeResponse {
    private String knowledgeId;
    private String name;
    private String createdByName;
    private long viewCount;
    private long commentCount;
    private double averageRating;
    private double engagementScore;
    private String vaultName;
}
