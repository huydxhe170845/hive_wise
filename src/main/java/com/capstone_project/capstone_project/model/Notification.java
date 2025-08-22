package com.capstone_project.capstone_project.model;

import java.time.LocalDateTime;

import com.capstone_project.capstone_project.enums.NotificationType;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "notifications")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    String id;

    @Column(name = "vault_id", nullable = true)
    String vaultId;

    @Column(name = "recipient_id")
    String recipientId;

    @Column(name = "sender_id")
    String senderId;

    @Column(name = "title")
    String title;

    @Column(name = "message")
    String message;

    @Column(name = "type")
    @Enumerated(EnumType.STRING)
    NotificationType type;

    @Column(name = "related_entity_id")
    String relatedEntityId; // ID của knowledge item, session, etc.

    @Column(name = "related_entity_type")
    String relatedEntityType; // "KNOWLEDGE", "SESSION", etc.

    @Column(name = "is_read")
    @Builder.Default
    Boolean isRead = false;

    @Column(name = "created_at")
    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "read_at")
    LocalDateTime readAt;

    // Helper methods
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }

    public void markAsUnread() {
        this.isRead = false;
        this.readAt = null;
    }
}
