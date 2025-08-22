package com.capstone_project.capstone_project.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class KnowledgeSessionDTO {
    private String id;
    private String title;
    private String location; // Thêm trường location
    private String description;
    private LocalDateTime startTime;
    private int duration;
    private String instructorName;
    private String meetingLink;
    private List<String> tags;
    // Thêm các trường cần thiết khác, KHÔNG include entity Vault
}
