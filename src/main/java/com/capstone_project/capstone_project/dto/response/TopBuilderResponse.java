package com.capstone_project.capstone_project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopBuilderResponse {
    private String userId;
    private String username;
    private String name;
    private String avatar;
    private long approvedKnowledgeCount;
    private double contributionScore;
}
