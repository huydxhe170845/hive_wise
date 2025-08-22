package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.enums.KnowledgeVisibility;
import com.capstone_project.capstone_project.enums.KnowledgeApprovalStatus;
import com.capstone_project.capstone_project.model.Folder;
import com.capstone_project.capstone_project.model.KnowledgeItem;
import com.capstone_project.capstone_project.model.KnowledgeItemTag;
import com.capstone_project.capstone_project.model.Tag;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.dto.response.TopKnowledgeResponse;
import com.capstone_project.capstone_project.repository.FolderRepository;
import com.capstone_project.capstone_project.repository.KnowledgeItemRepository;
import com.capstone_project.capstone_project.repository.KnowledgeItemTagRepository;
import com.capstone_project.capstone_project.repository.UserRepository;
import com.capstone_project.capstone_project.repository.VaultRepository;
import com.capstone_project.capstone_project.repository.KnowledgeViewRepository;
import com.capstone_project.capstone_project.repository.CommentRepository;
import com.capstone_project.capstone_project.repository.RatingRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class KnowledgeItemService {

    KnowledgeItemRepository knowledgeItemRepository;
    UserVaultRoleService userVaultRoleService;
    FolderService folderService;
    FolderRepository folderRepository;
    AssistantService assistantService;
    TagService tagService;
    KnowledgeItemTagRepository knowledgeItemTagRepository;
    NotificationService notificationService;
    UserService userService;
    UserRepository userRepository;
    VaultRepository vaultRepository;
    KnowledgeViewRepository knowledgeViewRepository;
    CommentRepository commentRepository;
    RatingRepository ratingRepository;

    public KnowledgeItem createKnowledgeItem(String vaultId, Integer folderId, String name,
            String description, String content, String createdBy) {
        if (knowledgeItemRepository.existsByNameAndVaultIdAndIsDeletedFalse(name, vaultId)) {
            throw new RuntimeException("Đã tồn tại knowledge item với tên này trong vault");
        }
        Folder folder = folderRepository.findById(folderId.longValue())
                .orElseThrow(() -> new RuntimeException("Folder not found with id: " + folderId));
        KnowledgeVisibility visibility;
        String role = userVaultRoleService.getRoleInVault(createdBy, vaultId);
        if ("BUILDER".equalsIgnoreCase(role)) {
            visibility = KnowledgeVisibility.PRIVATE;
        } else if ("VAULT_OWNER".equalsIgnoreCase(role) || "EXPERT".equalsIgnoreCase(role)) {
            boolean isPublic = false;
            try {
                isPublic = folderService.isPublicFolder(folderId);
            } catch (Exception e) {
                isPublic = false;
            }
            visibility = isPublic ? KnowledgeVisibility.OFFICIAL : KnowledgeVisibility.PRIVATE;
        } else {
            visibility = KnowledgeVisibility.PRIVATE;
        }

        KnowledgeApprovalStatus approvalStatus;
        if ("VAULT_OWNER".equalsIgnoreCase(role) || "EXPERT".equalsIgnoreCase(role)) {
            boolean isPublic = false;
            try {
                isPublic = folderService.isPublicFolder(folderId);
            } catch (Exception e) {
                isPublic = false;
            }
            approvalStatus = isPublic ? KnowledgeApprovalStatus.APPROVED : KnowledgeApprovalStatus.DRAFT;
        } else {
            approvalStatus = KnowledgeApprovalStatus.DRAFT;
        }
        KnowledgeItem knowledgeItem = KnowledgeItem.builder()
                .vaultId(vaultId)
                .folder(folder)
                .name(name)
                .description(description)
                .content(content)
                .status("DRAFT")
                .type("ARTICLE")
                .visibility(visibility)
                .approvalStatus(approvalStatus)
                .createdBy(createdBy)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .build();

        KnowledgeItem savedItem = knowledgeItemRepository.save(knowledgeItem);

        notificationService.createNewKnowledgeNotification(savedItem);

        return savedItem;
    }

    public KnowledgeItem createKnowledgeItemWithTags(String vaultId, Integer folderId, String name,
            String description, String content, String createdBy, List<String> tagNames) {
        KnowledgeItem knowledgeItem = createKnowledgeItem(vaultId, folderId, name, description, content, createdBy);

        if (tagNames != null && !tagNames.isEmpty()) {
            List<Tag> tags = tagService.findOrCreateTags(tagNames);

            for (Tag tag : tags) {
                KnowledgeItemTag knowledgeItemTag = KnowledgeItemTag.builder()
                        .knowledgeItem(knowledgeItem)
                        .tag(tag)
                        .build();
                knowledgeItemTagRepository.save(knowledgeItemTag);
            }
        }

        // Save to Qdrant if knowledge is approved immediately (for Expert/Vault Owner
        // creating in official folders)
        if (knowledgeItem.getApprovalStatus() == KnowledgeApprovalStatus.APPROVED) {
            try {
                assistantService.saveKnowledgeToQdrant(knowledgeItem);
                System.out.println("Successfully saved auto-approved knowledge to Qdrant: " + knowledgeItem.getName());
            } catch (Exception e) {
                System.err.println("Error saving auto-approved knowledge to Qdrant: " + e.getMessage());
            }
        }

        return knowledgeItem;
    }

    public List<KnowledgeItem> getKnowledgeItemsByVaultId(String vaultId) {
        return knowledgeItemRepository.findByVaultIdAndIsDeletedFalse(vaultId);
    }

    public List<KnowledgeItem> getKnowledgeItemsByVaultIdAndFolderId(String vaultId, Integer folderId) {
        return knowledgeItemRepository.findByVaultIdAndFolderIdAndIsDeletedFalse(vaultId, folderId.longValue());
    }

    public Optional<KnowledgeItem> getKnowledgeItemById(String id) {
        return knowledgeItemRepository.findByIdAndIsDeletedFalse(id);
    }

    public List<KnowledgeItem> getPrivateFolderKnowledgeItems(String vaultId, Integer folderId, String createdBy) {
        return knowledgeItemRepository.findByVaultIdAndFolderIdAndCreatedByAndVisibilityAndIsDeletedFalse(
                vaultId, folderId, createdBy, KnowledgeVisibility.PRIVATE);
    }

    public List<KnowledgeItem> getPrivateKnowledgeItems(String vaultId, String createdBy) {
        return knowledgeItemRepository.findByVaultIdAndCreatedByAndVisibilityAndIsDeletedFalse(
                vaultId, createdBy, KnowledgeVisibility.PRIVATE);
    }

    public List<KnowledgeItem> getDraftKnowledgeItems(String vaultId, String createdBy) {
        return knowledgeItemRepository.findByVaultIdAndCreatedByAndVisibilityAndApprovalStatusAndIsDeletedFalse(
                vaultId, createdBy, KnowledgeVisibility.PRIVATE, KnowledgeApprovalStatus.DRAFT);
    }

    public List<KnowledgeItem> getDraftKnowledgeItemsByFolder(String vaultId, String createdBy, Integer folderId) {
        return knowledgeItemRepository
                .findByVaultIdAndFolderIdAndCreatedByAndVisibilityAndApprovalStatusAndIsDeletedFalse(
                        vaultId, folderId, createdBy, KnowledgeVisibility.PRIVATE, KnowledgeApprovalStatus.DRAFT);
    }

    public List<KnowledgeItem> getOfficialFolderKnowledgeItems(String vaultId, Integer folderId, String createdBy) {
        return knowledgeItemRepository.findByVaultIdAndFolderIdAndCreatedByAndVisibilityAndIsDeletedFalse(
                vaultId, folderId, createdBy, KnowledgeVisibility.OFFICIAL);
    }

    public List<KnowledgeItem> getOfficialKnowledgeItems(String vaultId, String createdBy) {
        return knowledgeItemRepository.findByVaultIdAndCreatedByAndVisibilityAndIsDeletedFalse(
                vaultId, createdBy, KnowledgeVisibility.OFFICIAL);
    }

    // Get all approved official knowledge for Official Knowledge section
    public List<KnowledgeItem> getAllApprovedOfficialKnowledgeItems(String vaultId) {
        return knowledgeItemRepository.findByVaultIdAndApprovalStatusAndIsDeletedFalse(
                vaultId, KnowledgeApprovalStatus.APPROVED);
    }

    // Get all approved official knowledge in a specific folder
    public List<KnowledgeItem> getAllApprovedOfficialKnowledgeItemsByFolder(String vaultId, Integer folderId) {
        return knowledgeItemRepository.findByVaultIdAndFolderIdAndApprovalStatusAndIsDeletedFalse(
                vaultId, folderId, KnowledgeApprovalStatus.APPROVED);
    }

    public KnowledgeItem updateKnowledgeItem(String id, String name, String description,
            String content, String updatedBy) {
        KnowledgeItem knowledgeItem = knowledgeItemRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy knowledge item"));

        // Only check for duplicate name if the name is being changed
        if (name != null && !name.trim().equals(knowledgeItem.getName())) {
            boolean nameExists = knowledgeItemRepository.existsByNameAndVaultIdAndIsDeletedFalse(name,
                    knowledgeItem.getVaultId());
            if (nameExists) {
                throw new RuntimeException("Đã tồn tại knowledge item với tên này trong vault");
            }
        }

        knowledgeItem.setName(name);
        knowledgeItem.setDescription(description);
        knowledgeItem.setContent(content);
        knowledgeItem.setUpdatedBy(updatedBy);
        knowledgeItem.setUpdatedAt(LocalDateTime.now());

        return knowledgeItemRepository.save(knowledgeItem);
    }

    public void deleteKnowledgeItem(String id, String deletedBy) {
        KnowledgeItem knowledgeItem = knowledgeItemRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy knowledge item"));

        knowledgeItem.setIsDeleted(true);
        knowledgeItem.setDeletedBy(deletedBy);
        knowledgeItem.setDeletedAt(LocalDateTime.now());

        knowledgeItemRepository.save(knowledgeItem);
    }

    public List<KnowledgeItem> getTrashFolderByCreateByAndVaultId(String userId, String vaultId) {
        return knowledgeItemRepository.findByCreatedByAndVaultIdAndIsDeletedTrue(userId, vaultId);
    }

    public KnowledgeItem restoreKnowledgeItem(String id, String restoredBy) {
        KnowledgeItem knowledgeItem = knowledgeItemRepository.findByIdAndIsDeletedTrue(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy knowledge item trong thùng rác"));
        knowledgeItem.setIsDeleted(false);
        knowledgeItem.setUpdatedAt(LocalDateTime.now());
        knowledgeItem.setUpdatedBy(restoredBy);
        return knowledgeItemRepository.save(knowledgeItem);
    }

    public void deletePermanentKnowledgeItem(String id, String deletedBy, String vaultId) {
        KnowledgeItem knowledgeItem = knowledgeItemRepository.findByIdAndIsDeletedTrue(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy knowledge item trong thùng rác"));

        // Check permission based on visibility and role
        if (knowledgeItem.getVisibility() == KnowledgeVisibility.PRIVATE) {
            // For private knowledge, only creator can delete permanently
            if (!knowledgeItem.getCreatedBy().equals(deletedBy)) {
                throw new RuntimeException("Bạn chỉ có thể xóa vĩnh viễn knowledge PRIVATE do chính mình tạo");
            }
        } else if (knowledgeItem.getVisibility() == KnowledgeVisibility.OFFICIAL) {
            // For official knowledge, only VAULT_OWNER and EXPERT can delete permanently
            String role = userVaultRoleService.getRoleInVault(deletedBy, vaultId);
            if (!"VAULT_OWNER".equalsIgnoreCase(role) && !"EXPERT".equalsIgnoreCase(role)) {
                throw new RuntimeException("Chỉ có VAULT_OWNER và EXPERT mới có thể xóa vĩnh viễn knowledge OFFICIAL");
            }
        }

        knowledgeItemRepository.delete(knowledgeItem);
    }

    public List<KnowledgeItem> getAllKnowledgeByUser(String userId) {
        return knowledgeItemRepository.findByCreatedBy(userId);
    }

    public KnowledgeItem submitForApproval(String knowledgeId, String submittedBy, String vaultId) {
        KnowledgeItem knowledgeItem = knowledgeItemRepository.findByIdAndIsDeletedFalse(knowledgeId)
                .orElseThrow(() -> new RuntimeException("Knowledge item not found"));
        String role = userVaultRoleService.getRoleInVault(submittedBy, vaultId);
        if (!"BUILDER".equalsIgnoreCase(role) && !"VAULT_OWNER".equalsIgnoreCase(role)
                && !"EXPERT".equalsIgnoreCase(role)) {
            throw new RuntimeException("You don't have permission to submit knowledge for approval");
        }

        if (!knowledgeItem.getCreatedBy().equals(submittedBy)) {
            throw new RuntimeException("You can only submit your own knowledge for approval");
        }

        if (knowledgeItem.getApprovalStatus() != KnowledgeApprovalStatus.DRAFT) {
            throw new RuntimeException("Only draft knowledge can be submitted for approval");
        }

        knowledgeItem.setApprovalStatus(KnowledgeApprovalStatus.PENDING_APPROVAL);
        knowledgeItem.setUpdatedBy(submittedBy);
        knowledgeItem.setUpdatedAt(LocalDateTime.now());

        KnowledgeItem savedItem = knowledgeItemRepository.save(knowledgeItem);

        // Tạo thông báo cho Expert và Vault Owner
        notificationService.createKnowledgeSubmittedNotification(savedItem);

        return savedItem;
    }

    public KnowledgeItem approveKnowledge(String knowledgeId, String approvedBy, String vaultId) {
        KnowledgeItem knowledgeItem = knowledgeItemRepository.findByIdAndIsDeletedFalse(knowledgeId)
                .orElseThrow(() -> new RuntimeException("Knowledge item not found"));

        String role = userVaultRoleService.getRoleInVault(approvedBy, vaultId);
        if (!"VAULT_OWNER".equalsIgnoreCase(role) && !"EXPERT".equalsIgnoreCase(role)) {
            throw new RuntimeException("Only vault owners and experts can approve knowledge");
        }

        if (knowledgeItem.getApprovalStatus() != KnowledgeApprovalStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Only pending knowledge can be approved");
        }

        // Start reviewing lock to prevent conflicts
        startReviewingKnowledge(knowledgeId, approvedBy, vaultId);

        knowledgeItem.setApprovalStatus(KnowledgeApprovalStatus.APPROVED);
        knowledgeItem.setApprovedBy(approvedBy);
        knowledgeItem.setApprovedAt(LocalDateTime.now());
        knowledgeItem.setUpdatedBy(approvedBy);
        knowledgeItem.setUpdatedAt(LocalDateTime.now());

        // Clear review tracking after approval
        knowledgeItem.setReviewingBy(null);
        knowledgeItem.setReviewingStartedAt(null);
        knowledgeItem.setReviewLockExpiresAt(null);

        KnowledgeItem savedItem = knowledgeItemRepository.save(knowledgeItem);

        try {
            assistantService.saveKnowledgeToQdrant(savedItem);
            System.out.println("Successfully saved approved knowledge to Qdrant: " + savedItem.getName());
        } catch (Exception e) {
            System.err.println("Error saving approved knowledge to Qdrant: " + e.getMessage());
        }

        // Tạo thông báo cho người tạo knowledge
        notificationService.createKnowledgeApprovedNotification(savedItem, approvedBy);

        return savedItem;
    }

    public KnowledgeItem rejectKnowledge(String knowledgeId, String rejectedBy, String vaultId,
            String rejectionReason) {
        KnowledgeItem knowledgeItem = knowledgeItemRepository.findByIdAndIsDeletedFalse(knowledgeId)
                .orElseThrow(() -> new RuntimeException("Knowledge item not found"));
        String role = userVaultRoleService.getRoleInVault(rejectedBy, vaultId);
        if (!"VAULT_OWNER".equalsIgnoreCase(role) && !"EXPERT".equalsIgnoreCase(role) &&
                !rejectedBy.equals(knowledgeItem.getCreatedBy())) { // Allow owner to withdraw
            throw new RuntimeException("Only vault owners, experts, and knowledge owner can reject/withdraw knowledge");
        }
        if (knowledgeItem.getApprovalStatus() != KnowledgeApprovalStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Only pending knowledge can be rejected");
        }

        if (!"BUILDER".equalsIgnoreCase(role)) {
            startReviewingKnowledge(knowledgeId, rejectedBy, vaultId);
        }

        knowledgeItem.setApprovalStatus(KnowledgeApprovalStatus.REJECTED);
        knowledgeItem.setRejectedBy(rejectedBy);
        knowledgeItem.setRejectedAt(LocalDateTime.now());
        knowledgeItem.setRejectionReason(rejectionReason);
        knowledgeItem.setUpdatedBy(rejectedBy);
        knowledgeItem.setUpdatedAt(LocalDateTime.now());

        // Clear review tracking after rejection
        knowledgeItem.setReviewingBy(null);
        knowledgeItem.setReviewingStartedAt(null);
        knowledgeItem.setReviewLockExpiresAt(null);

        KnowledgeItem savedItem = knowledgeItemRepository.save(knowledgeItem);

        // Tạo thông báo cho người tạo knowledge
        notificationService.createKnowledgeRejectedNotification(savedItem, rejectedBy, rejectionReason);

        return savedItem;
    }

    public KnowledgeItem withdrawKnowledge(String knowledgeId, String withdrawnBy, String vaultId,
            String reason) {
        KnowledgeItem knowledgeItem = knowledgeItemRepository.findByIdAndIsDeletedFalse(knowledgeId)
                .orElseThrow(() -> new RuntimeException("Knowledge item not found"));

        if (!withdrawnBy.equals(knowledgeItem.getCreatedBy())) {
            throw new RuntimeException("Only knowledge owner can withdraw knowledge");
        }

        if (knowledgeItem.getApprovalStatus() != KnowledgeApprovalStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Only pending knowledge can be withdrawn");
        }

        knowledgeItem.setApprovalStatus(KnowledgeApprovalStatus.DRAFT);
        knowledgeItem.setRejectedBy(withdrawnBy);
        knowledgeItem.setRejectedAt(LocalDateTime.now());
        knowledgeItem.setRejectionReason(reason);
        knowledgeItem.setUpdatedBy(withdrawnBy);
        knowledgeItem.setUpdatedAt(LocalDateTime.now());

        // Clear review tracking after withdrawal
        knowledgeItem.setReviewingBy(null);
        knowledgeItem.setReviewingStartedAt(null);
        knowledgeItem.setReviewLockExpiresAt(null);

        return knowledgeItemRepository.save(knowledgeItem);
    }

    public KnowledgeItem approveKnowledgeWithFolder(String knowledgeId, String approvedBy, String vaultId,
            Integer targetFolderId) {
        KnowledgeItem knowledgeItem = knowledgeItemRepository.findByIdAndIsDeletedFalse(knowledgeId)
                .orElseThrow(() -> new RuntimeException("Knowledge item not found"));

        String role = userVaultRoleService.getRoleInVault(approvedBy, vaultId);
        if (!"VAULT_OWNER".equalsIgnoreCase(role) && !"EXPERT".equalsIgnoreCase(role)) {
            throw new RuntimeException("Only vault owners and experts can approve knowledge");
        }

        if (knowledgeItem.getApprovalStatus() != KnowledgeApprovalStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Only pending knowledge can be approved");
        }

        Folder targetFolder = folderRepository.findById(targetFolderId.longValue())
                .orElseThrow(() -> new RuntimeException("Target folder not found"));

        if (!targetFolder.getIsPublic()) {
            throw new RuntimeException("Target folder must be a public folder in Official Knowledge");
        }

        knowledgeItem.setApprovalStatus(KnowledgeApprovalStatus.APPROVED);
        knowledgeItem.setFolder(targetFolder);
        knowledgeItem.setApprovedBy(approvedBy);
        knowledgeItem.setApprovedAt(LocalDateTime.now());
        knowledgeItem.setUpdatedBy(approvedBy);
        knowledgeItem.setUpdatedAt(LocalDateTime.now());

        KnowledgeItem savedItem = knowledgeItemRepository.save(knowledgeItem);

        try {
            assistantService.saveKnowledgeToQdrant(savedItem);
            System.out.println("Successfully saved approved knowledge to Qdrant: " + savedItem.getName());
        } catch (Exception e) {
            System.err.println("Error saving approved knowledge to Qdrant: " + e.getMessage());
        }

        notificationService.createKnowledgeApprovedNotification(savedItem, approvedBy);

        return savedItem;
    }

    public List<KnowledgeItem> getPendingApprovalKnowledge(String vaultId) {
        return knowledgeItemRepository.findByVaultIdAndApprovalStatusAndIsDeletedFalse(
                vaultId, KnowledgeApprovalStatus.PENDING_APPROVAL);
    }

    public List<KnowledgeItem> getPendingApprovalKnowledgeByUser(String vaultId, String userId) {
        return knowledgeItemRepository.findByVaultIdAndCreatedByAndApprovalStatusAndIsDeletedFalse(
                vaultId, userId, KnowledgeApprovalStatus.PENDING_APPROVAL);
    }

    public List<KnowledgeItem> getApprovedKnowledge(String vaultId) {
        return knowledgeItemRepository.findByVaultIdAndApprovalStatusAndIsDeletedFalse(
                vaultId, KnowledgeApprovalStatus.APPROVED);
    }

    public List<KnowledgeItem> getApprovedKnowledgeByUser(String vaultId, String userId) {
        return knowledgeItemRepository.findByVaultIdAndCreatedByAndApprovalStatusAndIsDeletedFalseOrderByApprovedAtDesc(
                vaultId, userId, KnowledgeApprovalStatus.APPROVED);
    }

    public List<KnowledgeItem> getApprovedPrivateKnowledgeByUser(String vaultId, String userId) {
        return knowledgeItemRepository.findByVaultIdAndCreatedByAndVisibilityAndApprovalStatusAndIsDeletedFalse(
                vaultId, userId, KnowledgeVisibility.PRIVATE, KnowledgeApprovalStatus.APPROVED);
    }

    public List<KnowledgeItem> getApprovedOfficialKnowledge(String vaultId) {
        return knowledgeItemRepository.findByVaultIdAndApprovalStatusAndIsDeletedFalse(
                vaultId, KnowledgeApprovalStatus.APPROVED);
    }

    public List<KnowledgeItem> getApprovedPrivateKnowledgeByUserAndFolder(String vaultId, String userId,
            Integer folderId) {
        return knowledgeItemRepository
                .findByVaultIdAndFolderIdAndCreatedByAndVisibilityAndApprovalStatusAndIsDeletedFalse(
                        vaultId, folderId, userId, KnowledgeVisibility.PRIVATE, KnowledgeApprovalStatus.APPROVED);
    }

    public List<KnowledgeItem> getApprovedOfficialKnowledgeByFolder(String vaultId, Integer folderId) {
        return knowledgeItemRepository.findByVaultIdAndFolderIdAndVisibilityAndApprovalStatusAndIsDeletedFalse(
                vaultId, folderId, KnowledgeVisibility.OFFICIAL, KnowledgeApprovalStatus.APPROVED);
    }

    public List<KnowledgeItem> getRejectedKnowledge(String vaultId) {
        return knowledgeItemRepository.findByVaultIdAndApprovalStatusAndIsDeletedFalse(
                vaultId, KnowledgeApprovalStatus.REJECTED);
    }

    public List<KnowledgeItem> getRejectedKnowledgeByUser(String vaultId, String userId) {
        return knowledgeItemRepository.findByVaultIdAndCreatedByAndApprovalStatusAndIsDeletedFalse(
                vaultId, userId, KnowledgeApprovalStatus.REJECTED);
    }

    public List<KnowledgeItem> getRejectedKnowledgeByFolder(String vaultId, Integer folderId) {
        return knowledgeItemRepository.findByVaultIdAndFolderIdAndApprovalStatusAndIsDeletedFalse(
                vaultId, folderId, KnowledgeApprovalStatus.REJECTED);
    }

    // ================== REVIEW TRACKING FUNCTIONALITY ==================

    /**
     * Start reviewing a knowledge item
     * 
     * @param knowledgeId Knowledge item ID
     * @param reviewerId  User ID who starts reviewing
     * @param vaultId     Vault ID for permission check
     * @return true if review lock acquired successfully
     */
    public boolean startReviewingKnowledge(String knowledgeId, String reviewerId, String vaultId) {
        KnowledgeItem knowledgeItem = knowledgeItemRepository.findByIdAndIsDeletedFalse(knowledgeId)
                .orElseThrow(() -> new RuntimeException("Knowledge item not found"));

        String role = userVaultRoleService.getRoleInVault(reviewerId, vaultId);
        if (!"VAULT_OWNER".equalsIgnoreCase(role) && !"EXPERT".equalsIgnoreCase(role)) {
            throw new RuntimeException("Only vault owners and experts can review knowledge");
        }

        if (knowledgeItem.getApprovalStatus() != KnowledgeApprovalStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Only pending approval knowledge can be reviewed");
        }

        if (isKnowledgeBeingReviewed(knowledgeItem) && !reviewerId.equals(knowledgeItem.getReviewingBy())) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        knowledgeItem.setReviewingBy(reviewerId);
        knowledgeItem.setReviewingStartedAt(now);
        knowledgeItem.setReviewLockExpiresAt(now.plusMinutes(30));

        knowledgeItemRepository.save(knowledgeItem);
        return true;
    }

    public void stopReviewingKnowledge(String knowledgeId, String reviewerId) {
        KnowledgeItem knowledgeItem = knowledgeItemRepository.findByIdAndIsDeletedFalse(knowledgeId)
                .orElseThrow(() -> new RuntimeException("Knowledge item not found"));

        if (reviewerId.equals(knowledgeItem.getReviewingBy())) {
            knowledgeItem.setReviewingBy(null);
            knowledgeItem.setReviewingStartedAt(null);
            knowledgeItem.setReviewLockExpiresAt(null);
            knowledgeItemRepository.save(knowledgeItem);
        }
    }

    public boolean isKnowledgeBeingReviewed(KnowledgeItem knowledgeItem) {
        if (knowledgeItem.getReviewingBy() == null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        if (knowledgeItem.getReviewLockExpiresAt() != null &&
                now.isAfter(knowledgeItem.getReviewLockExpiresAt())) {
            knowledgeItem.setReviewingBy(null);
            knowledgeItem.setReviewingStartedAt(null);
            knowledgeItem.setReviewLockExpiresAt(null);
            knowledgeItemRepository.save(knowledgeItem);
            return false;
        }

        return true;
    }

    public boolean canWithdrawKnowledge(String knowledgeId, String userId) {
        KnowledgeItem knowledgeItem = knowledgeItemRepository.findByIdAndIsDeletedFalse(knowledgeId)
                .orElseThrow(() -> new RuntimeException("Knowledge item not found"));

        if (!userId.equals(knowledgeItem.getCreatedBy())) {
            return false;
        }

        if (knowledgeItem.getApprovalStatus() != KnowledgeApprovalStatus.PENDING_APPROVAL) {
            return false;
        }

        return !isKnowledgeBeingReviewed(knowledgeItem) || userId.equals(knowledgeItem.getReviewingBy());
    }

    public Map<String, Object> getReviewerInfo(String knowledgeId) {
        KnowledgeItem knowledgeItem = knowledgeItemRepository.findByIdAndIsDeletedFalse(knowledgeId)
                .orElseThrow(() -> new RuntimeException("Knowledge item not found"));

        Map<String, Object> reviewInfo = new HashMap<>();

        if (isKnowledgeBeingReviewed(knowledgeItem)) {
            reviewInfo.put("isBeingReviewed", true);
            reviewInfo.put("reviewerId", knowledgeItem.getReviewingBy());
            reviewInfo.put("reviewStartTime", knowledgeItem.getReviewingStartedAt());
            reviewInfo.put("reviewExpiresAt", knowledgeItem.getReviewLockExpiresAt());

            try {
                User reviewer = userService.findById(knowledgeItem.getReviewingBy());
                if (reviewer != null) {
                    reviewInfo.put("reviewerName", reviewer.getName());
                }
            } catch (Exception e) {
            }
        } else {
            reviewInfo.put("isBeingReviewed", false);
        }

        return reviewInfo;
    }

    public void cleanupExpiredReviewLocks() {
        LocalDateTime now = LocalDateTime.now();
        List<KnowledgeItem> expiredLocks = knowledgeItemRepository.findByReviewLockExpiresAtBefore(now);

        for (KnowledgeItem item : expiredLocks) {
            item.setReviewingBy(null);
            item.setReviewingStartedAt(null);
            item.setReviewLockExpiresAt(null);
            knowledgeItemRepository.save(item);
        }
    }

    // ================== MOVE KNOWLEDGE FUNCTIONALITY ==================

    public KnowledgeItem moveKnowledge(String knowledgeId, Integer targetFolderId, String userId, String vaultId) {
        KnowledgeItem knowledgeItem = knowledgeItemRepository.findByIdAndIsDeletedFalse(knowledgeId)
                .orElseThrow(() -> new RuntimeException("Knowledge item not found"));

        String role = userVaultRoleService.getRoleInVault(userId, vaultId);

        Folder targetFolder = folderRepository.findById(Long.valueOf(targetFolderId))
                .orElseThrow(() -> new RuntimeException("Target folder not found"));

        validateMovePermissions(knowledgeItem, targetFolder, userId, role);

        updateKnowledgeForMove(knowledgeItem, targetFolder, userId);

        return knowledgeItemRepository.save(knowledgeItem);
    }

    private void validateMovePermissions(KnowledgeItem knowledge, Folder targetFolder, String userId, String userRole) {
        boolean isTargetPublic = Boolean.TRUE.equals(targetFolder.getIsPublic());
        boolean isKnowledgeDraft = knowledge.getApprovalStatus() == KnowledgeApprovalStatus.DRAFT;
        boolean isKnowledgeApproved = knowledge.getApprovalStatus() == KnowledgeApprovalStatus.APPROVED;
        boolean isKnowledgeOwner = knowledge.getCreatedBy().equals(userId);

        if (isKnowledgeDraft && !isTargetPublic) {
            if (!isKnowledgeOwner) {
                throw new RuntimeException("Bạn chỉ có thể di chuyển draft knowledge do bạn tạo");
            }
            if (!("BUILDER".equalsIgnoreCase(userRole) || "EXPERT".equalsIgnoreCase(userRole)
                    || "VAULT_OWNER".equalsIgnoreCase(userRole))) {
                throw new RuntimeException("Bạn không có quyền di chuyển knowledge này");
            }
            return;
        }

        if (isKnowledgeApproved && isTargetPublic) {
            if (!("EXPERT".equalsIgnoreCase(userRole) || "VAULT_OWNER".equalsIgnoreCase(userRole))) {
                throw new RuntimeException(
                        "Chỉ Expert và Vault Owner mới có thể di chuyển approved knowledge vào thư mục official");
            }
            return;
        }

        if (isKnowledgeDraft && isTargetPublic) {
            throw new RuntimeException(
                    "Không thể di chuyển draft knowledge vào thư mục official. Hãy submit for approval trước");
        }

        if (isKnowledgeApproved && !isTargetPublic) {
            throw new RuntimeException("Không thể di chuyển approved knowledge vào thư mục private");
        }

        if (knowledge.getApprovalStatus() == KnowledgeApprovalStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Không thể di chuyển knowledge đang chờ duyệt");
        }

        throw new RuntimeException("Không thể di chuyển knowledge này");
    }

    private void updateKnowledgeForMove(KnowledgeItem knowledge, Folder targetFolder, String userId) {
        boolean isTargetPublic = Boolean.TRUE.equals(targetFolder.getIsPublic());

        knowledge.setFolder(targetFolder);

        if (isTargetPublic) {
            knowledge.setVisibility(KnowledgeVisibility.OFFICIAL);
        } else {
            knowledge.setVisibility(KnowledgeVisibility.PRIVATE);
        }

        knowledge.setUpdatedBy(userId);
        knowledge.setUpdatedAt(LocalDateTime.now());
    }

    public long getKnowledgeCreatedToday() {
        LocalDateTime startOfDay = LocalDateTime.now().toLocalDate().atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        return knowledgeItemRepository.countByCreatedAtBetweenAndIsDeletedFalse(startOfDay, endOfDay);
    }

    public long getKnowledgeCreatedThisMonth() {
        LocalDateTime startOfMonth = LocalDateTime.now().toLocalDate().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);
        return knowledgeItemRepository.countByCreatedAtBetweenAndIsDeletedFalse(startOfMonth, endOfMonth);
    }

    public long getTotalKnowledgeItems() {
        return knowledgeItemRepository.countByIsDeletedFalse();
    }

    public List<Long> getDailyKnowledgeCreationLast7Days() {
        List<Long> dailyCreation = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 6; i >= 0; i--) {
            LocalDateTime date = now.minusDays(i);
            long created = knowledgeItemRepository.countByCreatedAtDate(date);
            dailyCreation.add(created);
        }

        return dailyCreation;
    }

    public Map<String, Long> getKnowledgeStatusDistribution() {
        Map<String, Long> distribution = new HashMap<>();

        distribution.put("DRAFT",
                knowledgeItemRepository.countByApprovalStatusAndIsDeletedFalse(KnowledgeApprovalStatus.DRAFT));
        distribution.put("PENDING_APPROVAL", knowledgeItemRepository
                .countByApprovalStatusAndIsDeletedFalse(KnowledgeApprovalStatus.PENDING_APPROVAL));
        distribution.put("APPROVED",
                knowledgeItemRepository.countByApprovalStatusAndIsDeletedFalse(KnowledgeApprovalStatus.APPROVED));
        distribution.put("REJECTED",
                knowledgeItemRepository.countByApprovalStatusAndIsDeletedFalse(KnowledgeApprovalStatus.REJECTED));

        return distribution;
    }

    public List<TopKnowledgeResponse> getTopKnowledge() {
        List<KnowledgeItem> topKnowledge = knowledgeItemRepository.findTopKnowledgeByViewCount();

        return topKnowledge.stream()
                .limit(5)
                .map(knowledge -> {
                    // Get actual view count from KnowledgeView
                    long viewCount = knowledgeViewRepository.countViewsByKnowledgeItem(knowledge.getId());

                    // Get actual comment count
                    long commentCount = commentRepository.countByKnowledgeItemId(knowledge.getId());

                    // Get actual average rating
                    Double averageRating = ratingRepository.getAverageRatingByKnowledgeItemId(knowledge.getId());
                    double rating = averageRating != null ? averageRating : 0.0;

                    // Calculate engagement score (improved algorithm)
                    double engagementScore = (viewCount * 1.0) + (commentCount * 5.0) + (rating * 2.0);

                    // Get creator name
                    String createdByName = "Unknown";
                    if (knowledge.getCreatedBy() != null) {
                        User creator = userRepository.findById(knowledge.getCreatedBy()).orElse(null);
                        if (creator != null) {
                            createdByName = creator.getName() != null ? creator.getName() : creator.getUsername();
                        }
                    }

                    // Get vault name
                    String vaultName = "";
                    if (knowledge.getVaultId() != null) {
                        var vault = vaultRepository.findById(knowledge.getVaultId()).orElse(null);
                        if (vault != null) {
                            vaultName = vault.getName();
                        }
                    }

                    return TopKnowledgeResponse.builder()
                            .knowledgeId(knowledge.getId())
                            .name(knowledge.getName())
                            .createdByName(createdByName)
                            .viewCount(viewCount)
                            .commentCount(commentCount)
                            .averageRating(rating)
                            .engagementScore(engagementScore)
                            .vaultName(vaultName)
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());
    }

}