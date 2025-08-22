package com.capstone_project.capstone_project.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RatingDTO {
    private Integer id;
    private Integer ratingValue;
    private String userId;
    private String username;
    private String userEmail;
}
