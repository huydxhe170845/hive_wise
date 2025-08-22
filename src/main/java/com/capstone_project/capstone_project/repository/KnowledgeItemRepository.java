package com.capstone_project.capstone_project.repository;

import com.capstone_project.capstone_project.enums.KnowledgeVisibility;
import com.capstone_project.capstone_project.enums.KnowledgeApprovalStatus;
import com.capstone_project.capstone_project.model.KnowledgeItem;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface KnowledgeItemRepository extends CrudRepository<KnowledgeItem, String> {

        List<KnowledgeItem> findByVaultIdAndIsDeletedFalse(String vaultId);

        List<KnowledgeItem> findByVaultIdAndFolderIdAndIsDeletedFalse(String vaultId, Long folderId);

        List<KnowledgeItem> findByVaultIdAndFolderIdAndCreatedByAndIsDeletedFalse(String vaultId, Integer folderId,
                        String createdBy);

        Optional<KnowledgeItem> findByIdAndIsDeletedFalse(String id);

        boolean existsByNameAndVaultIdAndIsDeletedFalse(String name, String vaultId);

        @Query("SELECT CASE WHEN COUNT(k) > 0 THEN true ELSE false END FROM KnowledgeItem k WHERE k.name = :name AND k.vaultId = :vaultId AND k.isDeleted = false AND k.id != :id")
        boolean existsByNameAndVaultIdAndIsDeletedFalseAndIdNot(@Param("name") String name,
                        @Param("vaultId") String vaultId, @Param("id") String id);

        List<KnowledgeItem> findByVaultIdAndFolderIdAndCreatedByAndVisibilityAndIsDeletedFalse(
                        String vaultId, Integer folderId, String createdBy, KnowledgeVisibility visibility);

        List<KnowledgeItem> findByVaultIdAndCreatedByAndVisibilityAndIsDeletedFalse(
                        String vaultId, String createdBy, KnowledgeVisibility visibility);

        List<KnowledgeItem> findByCreatedByAndVaultIdAndIsDeletedTrue(String userId, String vaultId);

        List<KnowledgeItem> findByCreatedByAndVaultIdAndVisibilityAndIsDeletedFalse(
                        String userId, String vaultId, KnowledgeVisibility visibility);

        Optional<KnowledgeItem> findByIdAndIsDeletedTrue(String id);

        List<KnowledgeItem> findByCreatedBy(String userId);

        List<KnowledgeItem> findByVaultIdAndApprovalStatusAndIsDeletedFalse(
                        String vaultId, KnowledgeApprovalStatus approvalStatus);

        List<KnowledgeItem> findByVaultIdAndFolderIdAndApprovalStatusAndIsDeletedFalse(
                        String vaultId, Integer folderId, KnowledgeApprovalStatus approvalStatus);

        List<KnowledgeItem> findByVaultIdAndCreatedByAndApprovalStatusAndIsDeletedFalseOrderByApprovedAtDesc(
                        String vaultId, String createdBy, KnowledgeApprovalStatus approvalStatus);

        List<KnowledgeItem> findByVaultIdAndCreatedByAndVisibilityAndApprovalStatusAndIsDeletedFalse(
                        String vaultId, String createdBy, KnowledgeVisibility visibility,
                        KnowledgeApprovalStatus approvalStatus);

        List<KnowledgeItem> findByVaultIdAndCreatedByAndApprovalStatusAndIsDeletedFalse(
                        String vaultId, String createdBy, KnowledgeApprovalStatus approvalStatus);

        List<KnowledgeItem> findByVaultIdAndVisibilityAndApprovalStatusAndIsDeletedFalse(
                        String vaultId, KnowledgeVisibility visibility, KnowledgeApprovalStatus approvalStatus);

        List<KnowledgeItem> findByVaultIdAndFolderIdAndCreatedByAndVisibilityAndApprovalStatusAndIsDeletedFalse(
                        String vaultId, Integer folderId, String createdBy, KnowledgeVisibility visibility,
                        KnowledgeApprovalStatus approvalStatus);

        List<KnowledgeItem> findByVaultIdAndFolderIdAndVisibilityAndApprovalStatusAndIsDeletedFalse(
                        String vaultId, Integer folderId, KnowledgeVisibility visibility,
                        KnowledgeApprovalStatus approvalStatus);

        List<KnowledgeItem> findByReviewLockExpiresAtBefore(LocalDateTime expirationTime);

        long countByIsDeletedFalse();

        long countByCreatedAtBetweenAndIsDeletedFalse(LocalDateTime startDate, LocalDateTime endDate);

        long countByApprovalStatusAndIsDeletedFalse(KnowledgeApprovalStatus approvalStatus);

        @Query("SELECT COUNT(k) FROM KnowledgeItem k WHERE DATE(k.createdAt) = DATE(:date) AND k.isDeleted = false")
        long countByCreatedAtDate(@Param("date") LocalDateTime date);

        @Query("SELECT k FROM KnowledgeItem k " +
                        "LEFT JOIN KnowledgeView kv ON k.id = kv.knowledgeItemId " +
                        "WHERE k.isDeleted = false AND k.approvalStatus = com.capstone_project.capstone_project.enums.KnowledgeApprovalStatus.APPROVED "
                        +
                        "GROUP BY k.id, k.name, k.description, k.createdBy " +
                        "ORDER BY COUNT(kv.id) DESC")
        List<KnowledgeItem> findTopKnowledgeByViewCount();

        @Query("SELECT COUNT(k) FROM KnowledgeItem k WHERE k.createdBy = :userId AND k.isDeleted = false AND k.approvalStatus = com.capstone_project.capstone_project.enums.KnowledgeApprovalStatus.APPROVED")
        long countByCreatedByAndApproved(@Param("userId") String userId);

        // Additional methods for analytics
        List<KnowledgeItem> findByIsDeletedFalse();

        long countByCreatedByAndIsDeletedFalse(String createdBy);

        long countByCreatedByAndApprovalStatusAndIsDeletedFalse(String createdBy,
                        KnowledgeApprovalStatus approvalStatus);

        long countByCreatedByAndCreatedAtAfterAndIsDeletedFalse(String createdBy, LocalDateTime createdAt);

        long countByVaultIdAndIsDeletedFalse(String vaultId);

}