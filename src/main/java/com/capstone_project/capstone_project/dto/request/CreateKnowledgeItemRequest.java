package com.capstone_project.capstone_project.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateKnowledgeItemRequest {
    private String vaultId;
    private Integer folderId;
    private String name;
    private String description;
    private String content;
}