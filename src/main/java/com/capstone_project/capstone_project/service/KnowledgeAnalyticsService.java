package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.model.*;
import com.capstone_project.capstone_project.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class KnowledgeAnalyticsService {

    KnowledgeItemRepository knowledgeItemRepository;
    KnowledgeViewRepository knowledgeViewRepository;
    RatingRepository ratingRepository;
    CommentRepository commentRepository;
    UserRepository userRepository;
    VaultRepository vaultRepository;

    public Map<String, Object> getKnowledgeAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        
         LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS);
        LocalDateTime sevenDaysAgo = now.minus(7, ChronoUnit.DAYS);

         analytics.put("engagementAnalysis", getEngagementAnalysis(thirtyDaysAgo, sevenDaysAgo));
        
         analytics.put("contentQualityAnalysis", getContentQualityAnalysis());
        
         analytics.put("userBehaviorAnalysis", getUserBehaviorAnalysis(thirtyDaysAgo));
        
         analytics.put("systemPerformanceAnalysis", getSystemPerformanceAnalysis());
        
         analytics.put("dataInsights", generateDataInsights(analytics));
        
        return analytics;
    }

    private Map<String, Object> getEngagementAnalysis(LocalDateTime thirtyDaysAgo, LocalDateTime sevenDaysAgo) {
        Map<String, Object> analysis = new HashMap<>();
        
         List<KnowledgeItem> allKnowledgeItems = knowledgeItemRepository.findByIsDeletedFalse();
        
        List<Map<String, Object>> engagementData = allKnowledgeItems.stream()
            .map(item -> {
                Map<String, Object> itemData = new HashMap<>();
                itemData.put("id", item.getId());
                itemData.put("name", item.getName());
                itemData.put("createdAt", item.getCreatedAt());
                
                 long viewCount = knowledgeViewRepository.countByKnowledgeItemId(item.getId());
                itemData.put("viewCount", viewCount);
                
                 long recentViews = knowledgeViewRepository.countByKnowledgeItemIdAndViewTimeAfter(
                    item.getId(), sevenDaysAgo);
                itemData.put("recentViews", recentViews);
                
                 Double avgRating = ratingRepository.getAverageRatingByKnowledgeItemId(item.getId());
                itemData.put("averageRating", avgRating != null ? avgRating : 0.0);
                
                 long commentCount = commentRepository.countByKnowledgeItemId(item.getId());
                itemData.put("commentCount", commentCount);
                
                 double engagementScore = calculateEngagementScore(viewCount, recentViews, avgRating, commentCount);
                itemData.put("engagementScore", engagementScore);
                
                return itemData;
            })
            .sorted((a, b) -> Double.compare((Double) b.get("engagementScore"), (Double) a.get("engagementScore")))
            .collect(Collectors.toList());
        
        analysis.put("topPerformingItems", engagementData.subList(0, Math.min(5, engagementData.size())));
        analysis.put("totalItems", engagementData.size());
        
         double avgViews = engagementData.stream()
            .mapToDouble(item -> (Long) item.get("viewCount"))
            .average()
            .orElse(0.0);
        analysis.put("averageViews", avgViews);
        
        double avgRating = engagementData.stream()
            .mapToDouble(item -> (Double) item.get("averageRating"))
            .average()
            .orElse(0.0);
        analysis.put("averageRating", avgRating);
        
        return analysis;
    }

    private Map<String, Object> getContentQualityAnalysis() {
        Map<String, Object> analysis = new HashMap<>();
        
        List<KnowledgeItem> allItems = knowledgeItemRepository.findByIsDeletedFalse();
        
         Map<String, Long> typeDistribution = allItems.stream()
            .collect(Collectors.groupingBy(
                item -> item.getType() != null ? item.getType() : "Unknown",
                Collectors.counting()
            ));
        analysis.put("typeDistribution", typeDistribution);
        
         long totalItems = allItems.size();
        long approvedItems = allItems.stream()
            .filter(item -> "APPROVED".equals(item.getApprovalStatus().name()))
            .count();
        long pendingItems = allItems.stream()
            .filter(item -> "PENDING".equals(item.getApprovalStatus().name()))
            .count();
        long rejectedItems = allItems.stream()
            .filter(item -> "REJECTED".equals(item.getApprovalStatus().name()))
            .count();
        
        analysis.put("totalItems", totalItems);
        analysis.put("approvedItems", approvedItems);
        analysis.put("pendingItems", pendingItems);
        analysis.put("rejectedItems", rejectedItems);
        analysis.put("approvalRate", totalItems > 0 ? (double) approvedItems / totalItems * 100 : 0.0);
        
         LocalDateTime now = LocalDateTime.now();
        Map<String, Long> ageDistribution = allItems.stream()
            .collect(Collectors.groupingBy(
                item -> {
                    long daysOld = ChronoUnit.DAYS.between(item.getCreatedAt(), now);
                    if (daysOld <= 7) return "1 week";
                    else if (daysOld <= 30) return "1 month";
                    else if (daysOld <= 90) return "3 months";
                    else return "Older";
                },
                Collectors.counting()
            ));
        analysis.put("ageDistribution", ageDistribution);
        
        return analysis;
    }

    private Map<String, Object> getUserBehaviorAnalysis(LocalDateTime thirtyDaysAgo) {
        Map<String, Object> analysis = new HashMap<>();
        
         List<User> allUsers = userRepository.findAll();
        
        List<Map<String, Object>> userMetrics = allUsers.stream()
            .map(user -> {
                Map<String, Object> userData = new HashMap<>();
                userData.put("id", user.getId());
                userData.put("name", user.getName());
                userData.put("username", user.getUsername());
                
                 long createdItems = knowledgeItemRepository.countByCreatedByAndIsDeletedFalse(user.getId());
                userData.put("createdItems", createdItems);
                
                 long approvedItems = knowledgeItemRepository.countByCreatedByAndApprovalStatusAndIsDeletedFalse(
                    user.getId(), com.capstone_project.capstone_project.enums.KnowledgeApprovalStatus.APPROVED);
                userData.put("approvedItems", approvedItems);
                
                 long recentContributions = knowledgeItemRepository.countByCreatedByAndCreatedAtAfterAndIsDeletedFalse(
                    user.getId(), thirtyDaysAgo);
                userData.put("recentContributions", recentContributions);
                
                 double contributionScore = calculateContributionScore(createdItems, approvedItems, recentContributions);
                userData.put("contributionScore", contributionScore);
                
                return userData;
            })
            .filter(user -> (Long) user.get("createdItems") > 0)  
            .sorted((a, b) -> Double.compare((Double) b.get("contributionScore"), (Double) a.get("contributionScore")))
            .collect(Collectors.toList());
        
        analysis.put("topContributors", userMetrics.subList(0, Math.min(5, userMetrics.size())));
        analysis.put("totalContributors", userMetrics.size());
        
        // Always ensure these properties exist, even when there are no contributors
        double avgCreatedItems = userMetrics.isEmpty() ? 0.0 : userMetrics.stream()
            .mapToDouble(user -> (Long) user.get("createdItems"))
            .average()
            .orElse(0.0);
        analysis.put("averageCreatedItems", avgCreatedItems);
        
        double avgApprovalRate = userMetrics.isEmpty() ? 0.0 : userMetrics.stream()
            .mapToDouble(user -> {
                long created = (Long) user.get("createdItems");
                long approved = (Long) user.get("approvedItems");
                return created > 0 ? (double) approved / created * 100 : 0.0;
            })
            .average()
            .orElse(0.0);
        analysis.put("averageApprovalRate", avgApprovalRate);
        
        return analysis;
    }

    private Map<String, Object> getSystemPerformanceAnalysis() {
        Map<String, Object> analysis = new HashMap<>();
        
         List<Vault> allVaults = vaultRepository.findAll();
        
        List<Map<String, Object>> vaultMetrics = allVaults.stream()
            .map(vault -> {
                Map<String, Object> vaultData = new HashMap<>();
                vaultData.put("id", vault.getId());
                vaultData.put("name", vault.getName());
                
                 long knowledgeCount = knowledgeItemRepository.countByVaultIdAndIsDeletedFalse(vault.getId());
                vaultData.put("knowledgeCount", knowledgeCount);
                
                 long totalViews = knowledgeItemRepository.findByVaultIdAndIsDeletedFalse(vault.getId())
                    .stream()
                    .mapToLong(item -> knowledgeViewRepository.countByKnowledgeItemId(item.getId()))
                    .sum();
                vaultData.put("totalViews", totalViews);
                
                 double activityScore = calculateActivityScore(knowledgeCount, totalViews);
                vaultData.put("activityScore", activityScore);
                
                return vaultData;
            })
            .sorted((a, b) -> Double.compare((Double) b.get("activityScore"), (Double) a.get("activityScore")))
            .collect(Collectors.toList());
        
        analysis.put("topVaults", vaultMetrics.subList(0, Math.min(5, vaultMetrics.size())));
        
         long totalKnowledgeItems = knowledgeItemRepository.countByIsDeletedFalse();
        long totalViews = knowledgeViewRepository.count();
        long totalRatings = ratingRepository.count();
        long totalComments = commentRepository.count();
        
        analysis.put("totalKnowledgeItems", totalKnowledgeItems);
        analysis.put("totalViews", totalViews);
        analysis.put("totalRatings", totalRatings);
        analysis.put("totalComments", totalComments);
        
         double engagementRate = totalKnowledgeItems > 0 ? 
            (double) (totalViews + totalRatings + totalComments) / totalKnowledgeItems : 0.0;
        analysis.put("engagementRate", engagementRate);
        
        return analysis;
    }

    private List<Map<String, Object>> generateDataInsights(Map<String, Object> analytics) {
        List<Map<String, Object>> recommendations = new ArrayList<>();
        
         Map<String, Object> engagementAnalysis = (Map<String, Object>) analytics.get("engagementAnalysis");
        Map<String, Object> contentQualityAnalysis = (Map<String, Object>) analytics.get("contentQualityAnalysis");
        Map<String, Object> userBehaviorAnalysis = (Map<String, Object>) analytics.get("userBehaviorAnalysis");
        Map<String, Object> systemPerformanceAnalysis = (Map<String, Object>) analytics.get("systemPerformanceAnalysis");
        
         double approvalRate = (Double) contentQualityAnalysis.get("approvalRate");
        if (approvalRate < 80.0) {
            Map<String, Object> rec = new HashMap<>();
            rec.put("category", "Content Quality");
            rec.put("priority", "High");
            rec.put("title", "Improve Content Approval Process");
            rec.put("description", "Current approval rate is " + String.format("%.1f", approvalRate) + "%. Consider implementing content guidelines and review training.");
            rec.put("impact", "High");
            recommendations.add(rec);
        }
        
         double avgViews = (Double) engagementAnalysis.get("averageViews");
        if (avgViews < 10.0) {
            Map<String, Object> rec = new HashMap<>();
            rec.put("category", "User Engagement");
            rec.put("priority", "Medium");
            rec.put("title", "Increase Content Visibility");
            rec.put("description", "Average views per content item is " + String.format("%.1f", avgViews) + ". Implement content promotion features and improve search algorithms.");
            rec.put("impact", "Medium");
            recommendations.add(rec);
        }
        
         int totalContributors = (Integer) userBehaviorAnalysis.get("totalContributors");
        if (totalContributors < 10) {
            Map<String, Object> rec = new HashMap<>();
            rec.put("category", "User Engagement");
            rec.put("priority", "High");
            rec.put("title", "Encourage More Contributors");
            rec.put("description", "Only " + totalContributors + " users are contributing content. Implement gamification and recognition programs.");
            rec.put("impact", "High");
            recommendations.add(rec);
        }
        
         Map<String, Long> ageDistribution = (Map<String, Long>) contentQualityAnalysis.get("ageDistribution");
        long oldContent = ageDistribution.getOrDefault("Older", 0L);
        long totalItems = (Long) contentQualityAnalysis.get("totalItems");
        if (totalItems > 0 && (double) oldContent / totalItems > 0.5) {
            Map<String, Object> rec = new HashMap<>();
            rec.put("category", "Content Management");
            rec.put("priority", "Medium");
            rec.put("title", "Update Outdated Content");
            rec.put("description", String.format("%.1f", (double) oldContent / totalItems * 100) + "% of content is older than 3 months. Implement content review cycles.");
            rec.put("impact", "Medium");
            recommendations.add(rec);
        }
        
         double engagementRate = (Double) systemPerformanceAnalysis.get("engagementRate");
        if (engagementRate < 5.0) {
            Map<String, Object> rec = new HashMap<>();
            rec.put("category", "System Performance");
            rec.put("priority", "High");
            rec.put("title", "Improve User Engagement");
            rec.put("description", "Overall engagement rate is " + String.format("%.1f", engagementRate) + ". Consider implementing interactive features and better content discovery.");
            rec.put("impact", "High");
            recommendations.add(rec);
        }
        
        return recommendations;
    }

    private double calculateEngagementScore(long viewCount, long recentViews, Double avgRating, long commentCount) {
        double viewScore = Math.min(viewCount / 10.0, 10.0); // Cap at 10 points
        double recentScore = Math.min(recentViews / 5.0, 5.0); // Cap at 5 points
        double ratingScore = avgRating != null ? avgRating * 2 : 0; // Max 10 points
        double commentScore = Math.min(commentCount / 2.0, 5.0); // Cap at 5 points
        
        return viewScore + recentScore + ratingScore + commentScore;
    }

    private double calculateContributionScore(long createdItems, long approvedItems, long recentContributions) {
        double creationScore = createdItems * 10; // 10 points per item
        double approvalScore = approvedItems * 15; // 15 points per approved item
        double recentScore = recentContributions * 20; // 20 points per recent contribution
        
        return creationScore + approvalScore + recentScore;
    }

    private double calculateActivityScore(long knowledgeCount, long totalViews) {
        if (knowledgeCount == 0) return 0.0;
        double viewPerItem = (double) totalViews / knowledgeCount;
        return Math.min(viewPerItem / 10.0 * 100, 100.0); // Normalize to 0-100
    }
}
