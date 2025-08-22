package com.capstone_project.capstone_project.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommentDTO {
    private Integer id;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean isEdited;
    private Integer parentCommentId;

    // User information
    private String userId;
    private String username;
    private String userEmail;
    private String userAvatar;

    // Nested replies
    private List<CommentDTO> replies;
}
