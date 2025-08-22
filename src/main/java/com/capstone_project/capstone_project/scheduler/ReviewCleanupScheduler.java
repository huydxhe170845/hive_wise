package com.capstone_project.capstone_project.scheduler;

import com.capstone_project.capstone_project.service.KnowledgeItemService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReviewCleanupScheduler {

    private final KnowledgeItemService knowledgeItemService;

    @Scheduled(fixedRate = 600000)
    public void cleanupExpiredReviewLocks() {
        try {
            log.info("Starting cleanup of expired review locks");
            knowledgeItemService.cleanupExpiredReviewLocks();
            log.info("Completed cleanup of expired review locks");
        } catch (Exception e) {
            log.error("Error during review lock cleanup", e);
        }
    }
}
