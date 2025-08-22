package com.capstone_project.capstone_project.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "knowledge_views")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class KnowledgeView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    Long id;

    @Column(name = "knowledge_item_id", nullable = false)
    String knowledgeItemId;

    @Column(name = "user_id")
    String userId;

    @Column(name = "session_id")
    String sessionId;

    @Column(name = "ip_address")
    String ipAddress;

    @Column(name = "view_time", nullable = false)
    LocalDateTime viewTime;

    @Column(name = "view_duration_seconds")
    Integer viewDurationSeconds;

    @PrePersist
    protected void onCreate() {
        if (this.viewTime == null) {
            this.viewTime = LocalDateTime.now();
        }
    }
}
