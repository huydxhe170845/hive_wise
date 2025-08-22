package com.capstone_project.capstone_project.repository;

import com.capstone_project.capstone_project.model.KnowledgeView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface KnowledgeViewRepository extends JpaRepository<KnowledgeView, Long> {

    // Count total views today
    @Query("SELECT COUNT(kv) FROM KnowledgeView kv WHERE DATE(kv.viewTime) = CURRENT_DATE")
    long countViewsToday();

    // Count total views this month
    @Query("SELECT COUNT(kv) FROM KnowledgeView kv WHERE YEAR(kv.viewTime) = YEAR(CURRENT_DATE) AND MONTH(kv.viewTime) = MONTH(CURRENT_DATE)")
    long countViewsThisMonth();

    // Count unique viewers today
    @Query("SELECT COUNT(DISTINCT kv.userId) FROM KnowledgeView kv WHERE DATE(kv.viewTime) = CURRENT_DATE AND kv.userId IS NOT NULL")
    long countUniqueViewersToday();

    // Count views for a specific knowledge item
    @Query("SELECT COUNT(kv) FROM KnowledgeView kv WHERE kv.knowledgeItemId = :knowledgeItemId")
    long countViewsByKnowledgeItem(@Param("knowledgeItemId") String knowledgeItemId);

    // Count views between dates
    @Query("SELECT COUNT(kv) FROM KnowledgeView kv WHERE kv.viewTime BETWEEN :startDate AND :endDate")
    long countViewsBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Check if user has viewed a knowledge item today
    @Query("SELECT COUNT(kv) > 0 FROM KnowledgeView kv WHERE kv.knowledgeItemId = :knowledgeItemId AND kv.userId = :userId AND DATE(kv.viewTime) = CURRENT_DATE")
    boolean hasUserViewedToday(@Param("knowledgeItemId") String knowledgeItemId, @Param("userId") String userId);

    // Get average view duration for a knowledge item
    @Query("SELECT AVG(kv.viewDurationSeconds) FROM KnowledgeView kv WHERE kv.knowledgeItemId = :knowledgeItemId AND kv.viewDurationSeconds IS NOT NULL")
    Double getAverageViewDuration(@Param("knowledgeItemId") String knowledgeItemId);

    // Count views by specific date
    @Query("SELECT COUNT(kv) FROM KnowledgeView kv WHERE DATE(kv.viewTime) = DATE(:date)")
    long countViewsByDate(@Param("date") LocalDateTime date);

    // Additional methods for analytics
    long countByKnowledgeItemId(String knowledgeItemId);

    long countByKnowledgeItemIdAndViewTimeAfter(String knowledgeItemId, LocalDateTime viewTime);
}
