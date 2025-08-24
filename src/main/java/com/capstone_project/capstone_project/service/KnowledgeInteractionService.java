package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.dto.CommentDTO;
import com.capstone_project.capstone_project.dto.KnowledgeInteractionDTO;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class KnowledgeInteractionService {

    CommentService commentService;
    RatingService ratingService;

    public KnowledgeInteractionDTO getKnowledgeInteractions(String knowledgeItemId, String userId) {
        List<CommentDTO> comments = commentService.getCommentsForKnowledge(knowledgeItemId);
        long totalComments = commentService.getCommentCount(knowledgeItemId);

        Double averageRating = ratingService.getAverageRating(knowledgeItemId);
        long totalRatings = ratingService.getRatingCount(knowledgeItemId);
        Integer userRating = ratingService.getUserRating(knowledgeItemId, userId);
        List<KnowledgeInteractionDTO.RatingStatsDTO> ratingStats = ratingService.getRatingStats(knowledgeItemId);

        return KnowledgeInteractionDTO.builder()
                .comments(comments)
                .totalComments(totalComments)
                .averageRating(averageRating)
                .totalRatings(totalRatings)
                .userRating(userRating)
                .ratingStats(ratingStats)
                .build();
    }

    public CommentDTO addComment(String knowledgeItemId, String userId, String content, Integer parentCommentId) {
        return commentService.addComment(knowledgeItemId, userId, content, parentCommentId);
    }

    public CommentDTO updateComment(Integer commentId, String userId, String newContent) {
        return commentService.updateComment(commentId, userId, newContent);
    }

    public void deleteComment(Integer commentId, String userId) {
        commentService.deleteComment(commentId, userId);
    }

    public void addOrUpdateRating(String knowledgeItemId, String userId, Integer ratingValue) {
        ratingService.addOrUpdateRating(knowledgeItemId, userId, ratingValue);
    }

    public void removeRating(String knowledgeItemId, String userId) {
        ratingService.removeRating(knowledgeItemId, userId);
    }
}
