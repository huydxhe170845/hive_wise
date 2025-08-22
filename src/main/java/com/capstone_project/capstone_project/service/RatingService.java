package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.dto.RatingDTO;
import com.capstone_project.capstone_project.dto.KnowledgeInteractionDTO;
import com.capstone_project.capstone_project.model.Rating;
import com.capstone_project.capstone_project.model.KnowledgeItem;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.repository.RatingRepository;
import com.capstone_project.capstone_project.repository.KnowledgeItemRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RatingService {

    RatingRepository ratingRepository;
    KnowledgeItemRepository knowledgeItemRepository;
    UserService userService;

    public RatingDTO addOrUpdateRating(String knowledgeItemId, String userId, Integer ratingValue) {
        // Validate rating value (1-5)
        if (ratingValue < 1 || ratingValue > 5) {
            throw new IllegalArgumentException("Rating value must be between 1 and 5");
        }

        // Validate knowledge item exists
        Optional<KnowledgeItem> knowledgeItem = knowledgeItemRepository.findById(knowledgeItemId);
        if (knowledgeItem.isEmpty()) {
            throw new IllegalArgumentException("Knowledge item not found");
        }

        // Validate user exists
        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        // Check if user already rated this knowledge
        Optional<Rating> existingRating = ratingRepository.findByKnowledgeItemIdAndUserId(knowledgeItemId, userId);

        Rating rating;
        if (existingRating.isPresent()) {
            // Update existing rating
            rating = existingRating.get();
            rating.setRatingValue(ratingValue);
            rating.setUpdatedAt(LocalDateTime.now());
        } else {
            // Create new rating
            rating = Rating.builder()
                    .knowledgeItem(knowledgeItem.get())
                    .user(user)
                    .ratingValue(ratingValue)
                    .createdAt(LocalDateTime.now())
                    .build();
        }

        Rating savedRating = ratingRepository.save(rating);
        return convertToDTO(savedRating);
    }

    public void removeRating(String knowledgeItemId, String userId) {
        Optional<Rating> existingRating = ratingRepository.findByKnowledgeItemIdAndUserId(knowledgeItemId, userId);
        if (existingRating.isPresent()) {
            ratingRepository.delete(existingRating.get());
        }
    }

    public Double getAverageRating(String knowledgeItemId) {
        return ratingRepository.getAverageRatingByKnowledgeItemId(knowledgeItemId);
    }

    public Integer getUserRating(String knowledgeItemId, String userId) {
        Optional<Rating> rating = ratingRepository.findByKnowledgeItemIdAndUserId(knowledgeItemId, userId);
        return rating.map(Rating::getRatingValue).orElse(null);
    }

    public long getRatingCount(String knowledgeItemId) {
        return ratingRepository.countByKnowledgeItemId(knowledgeItemId);
    }

    public List<KnowledgeInteractionDTO.RatingStatsDTO> getRatingStats(String knowledgeItemId) {
        List<KnowledgeInteractionDTO.RatingStatsDTO> stats = new ArrayList<>();
        long totalRatings = getRatingCount(knowledgeItemId);

        for (int star = 1; star <= 5; star++) {
            long count = ratingRepository.countByKnowledgeItemIdAndRatingValue(knowledgeItemId, star);
            double percentage = totalRatings > 0 ? (double) count / totalRatings * 100 : 0;

            stats.add(KnowledgeInteractionDTO.RatingStatsDTO.builder()
                    .starValue(star)
                    .count(count)
                    .percentage(Math.round(percentage * 10.0) / 10.0) // Round to 1 decimal place
                    .build());
        }

        return stats;
    }

    private RatingDTO convertToDTO(Rating rating) {
        return RatingDTO.builder()
                .id(rating.getId())
                .ratingValue(rating.getRatingValue())
                .userId(rating.getUser().getId())
                .username(rating.getUser().getUsername())
                .userEmail(rating.getUser().getEmail())
                .build();
    }
}
