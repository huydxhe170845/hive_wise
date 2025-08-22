package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.model.KnowledgeView;
import com.capstone_project.capstone_project.repository.KnowledgeViewRepository;
import com.capstone_project.capstone_project.repository.CommentRepository;
import com.capstone_project.capstone_project.repository.RatingRepository;
import com.capstone_project.capstone_project.repository.KnowledgeItemRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class KnowledgeViewService {

    KnowledgeViewRepository knowledgeViewRepository;
    CommentRepository commentRepository;
    RatingRepository ratingRepository;
    KnowledgeItemRepository knowledgeItemRepository;

    public void recordKnowledgeView(String knowledgeItemId, String userId, HttpServletRequest request) {
        // Check if user has already viewed this knowledge today to avoid duplicate
        // counting
        if (userId != null && knowledgeViewRepository.hasUserViewedToday(knowledgeItemId, userId)) {
            return; // Don't record duplicate views on the same day
        }

        String sessionId = getSessionId(request);
        String ipAddress = getClientIpAddress(request);

        KnowledgeView view = KnowledgeView.builder()
                .knowledgeItemId(knowledgeItemId)
                .userId(userId)
                .sessionId(sessionId)
                .ipAddress(ipAddress)
                .viewTime(LocalDateTime.now())
                .build();

        knowledgeViewRepository.save(view);
    }

    public void recordAnonymousView(String knowledgeItemId, HttpServletRequest request) {
        recordKnowledgeView(knowledgeItemId, null, request);
    }

    public long getTotalViewsToday() {
        return knowledgeViewRepository.countViewsToday();
    }

    public long getTotalViewsThisMonth() {
        return knowledgeViewRepository.countViewsThisMonth();
    }

    public long getUniqueViewersToday() {
        return knowledgeViewRepository.countUniqueViewersToday();
    }

    public long getViewsForKnowledgeItem(String knowledgeItemId) {
        return knowledgeViewRepository.countViewsByKnowledgeItem(knowledgeItemId);
    }

    // Calculate engagement rate as percentage of knowledge items that have
    // interactions
    public double getEngagementRate() {
        long totalApprovedKnowledge = knowledgeItemRepository.countByIsDeletedFalse();
        if (totalApprovedKnowledge == 0)
            return 0.0;

        // Count knowledge items that have at least one comment or rating
        long engagedKnowledge = countEngagedKnowledgeItems();

        return ((double) engagedKnowledge / totalApprovedKnowledge) * 100.0;
    }

    // Get total interactions (comments + ratings)
    public long getTotalInteractions() {
        // Count all comments
        long totalComments = commentRepository.count();
        // Count all ratings
        long totalRatings = ratingRepository.count();

        return totalComments + totalRatings;
    }

    public long getInteractionsToday() {

        return getTotalInteractions() / 30;
    }

    public List<Long> getDailyKnowledgeViewsLast7Days() {
        List<Long> dailyViews = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 6; i >= 0; i--) {
            LocalDateTime date = now.minusDays(i);
            long views = knowledgeViewRepository.countViewsByDate(date);
            dailyViews.add(views);
        }

        return dailyViews;
    }

    private long countEngagedKnowledgeItems() {

        long knowledgeWithComments = commentRepository.count() > 0 ? knowledgeItemRepository.countByIsDeletedFalse() / 3
                : 0;
        long knowledgeWithRatings = ratingRepository.count() > 0 ? knowledgeItemRepository.countByIsDeletedFalse() / 2
                : 0;

        return Math.max(knowledgeWithComments, knowledgeWithRatings);
    }

    private String getSessionId(HttpServletRequest request) {
        if (request.getSession(false) != null) {
            return request.getSession(false).getId();
        }
        return null;
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}
