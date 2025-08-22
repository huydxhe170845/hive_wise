package com.capstone_project.capstone_project.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class KnowledgeInteractionDTO {
    // Comments
    private List<CommentDTO> comments;
    private long totalComments;

    // Ratings
    private Double averageRating;
    private long totalRatings;
    private Integer userRating; // Current user's rating
    private List<RatingStatsDTO> ratingStats; // Rating distribution

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RatingStatsDTO {
        private Integer starValue;
        private long count;
        private double percentage;
    }
}
