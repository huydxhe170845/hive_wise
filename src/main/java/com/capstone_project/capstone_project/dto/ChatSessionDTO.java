package com.capstone_project.capstone_project.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatSessionDTO {
    private Long id;
    private String knowledgeSource;
    private LocalDateTime startedAt;
    private String vaultName;
    private String userName;
    private String firstQuestion;
}
