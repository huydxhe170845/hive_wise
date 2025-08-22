package com.capstone_project.capstone_project.repository;

import com.capstone_project.capstone_project.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Integer> {

    Optional<Rating> findByKnowledgeItemIdAndUserId(String knowledgeItemId, String userId);

    @Query("SELECT AVG(r.ratingValue) FROM Rating r WHERE r.knowledgeItemId = :knowledgeItemId")
    Double getAverageRatingByKnowledgeItemId(@Param("knowledgeItemId") String knowledgeItemId);

    @Query("SELECT COUNT(r) FROM Rating r WHERE r.knowledgeItemId = :knowledgeItemId")
    long countByKnowledgeItemId(@Param("knowledgeItemId") String knowledgeItemId);

    @Query("SELECT COUNT(r) FROM Rating r WHERE r.knowledgeItemId = :knowledgeItemId AND r.ratingValue = :ratingValue")
    long countByKnowledgeItemIdAndRatingValue(@Param("knowledgeItemId") String knowledgeItemId,
            @Param("ratingValue") Integer ratingValue);
}
