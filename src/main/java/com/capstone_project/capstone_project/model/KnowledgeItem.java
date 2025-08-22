package com.capstone_project.capstone_project.model;

import java.time.LocalDateTime;
import java.util.List;

import com.capstone_project.capstone_project.enums.KnowledgeVisibility;
import com.capstone_project.capstone_project.enums.KnowledgeApprovalStatus;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "knowledge_item")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class KnowledgeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    String id;

    @Column(name = "vault_id")
    String vaultId;

    @Column(name = "name")
    String name;

    @Column(name = "description")
    String description;

    @Column(name = "content")
    String content;

    @Column(name = "status")
    String status;

    @Column(name = "type")
    String type;

    @Column(name = "visibility")
    @Enumerated(EnumType.STRING)
    KnowledgeVisibility visibility;

    @Column(name = "approval_status")
    @Enumerated(EnumType.STRING)
    KnowledgeApprovalStatus approvalStatus;

    @Column(name = "approved_by")
    String approvedBy;

    @Column(name = "approved_at")
    LocalDateTime approvedAt;

    @Column(name = "rejected_by")
    String rejectedBy;

    @Column(name = "rejected_at")
    LocalDateTime rejectedAt;

    @Column(name = "rejection_reason")
    String rejectionReason;

    @Column(name = "reviewing_by")
    String reviewingBy;

    @Column(name = "reviewing_started_at")
    LocalDateTime reviewingStartedAt;

    @Column(name = "review_lock_expires_at")
    LocalDateTime reviewLockExpiresAt;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @Column(name = "created_by")
    String createdBy;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @Column(name = "updated_by")
    String updatedBy;

    @Column(name = "is_deleted")
    Boolean isDeleted;

    @Column(name = "deleted_by")
    String deletedBy;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id", nullable = true)
    Folder folder;

    @OneToMany(mappedBy = "knowledgeItem", cascade = CascadeType.ALL, orphanRemoval = true)
    List<KnowledgeItemTag> knowledgeItemTags;

    @OneToMany(mappedBy = "knowledgeItem", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Comment> comments;

    @OneToMany(mappedBy = "knowledgeItem", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Rating> ratings;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}