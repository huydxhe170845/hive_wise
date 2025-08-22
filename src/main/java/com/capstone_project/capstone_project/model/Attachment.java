package com.capstone_project.capstone_project.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "attachments")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Attachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    // This field is a read-only mapping of the foreign key.
    @Column(name = "knowledge_item_id", insertable = false, updatable = false)
    Integer knowledgeItemId;

    @Column(name = "file_name")
    String fileName;

    @Column(name = "file_path")
    String filePath;

    @Column(name = "file_type")
    String fileType;

    @Column(name = "file_size")
    Long fileSize;

    // This field is also a read-only mapping of the foreign key.
    @Column(name = "upload_by", insertable = false, updatable = false)
    String uploadBy;

    @Column(name = "upload_at")
    LocalDateTime uploadAt;

    // This relationship field will control the 'knowledge_item_id' column.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "knowledge_item_id", nullable = false)
    KnowledgeItem knowledgeItem;

    // This relationship field will control the 'upload_by' column.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "upload_by", nullable = false)
    User user;

    @PrePersist
    protected void onCreate() {
        if (this.uploadAt == null) {
            this.uploadAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.uploadAt = LocalDateTime.now();
    }
}