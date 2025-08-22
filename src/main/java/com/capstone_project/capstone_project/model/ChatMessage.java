package com.capstone_project.capstone_project.model;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "chat_message")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    @JoinColumn(name = "session_id")
    ChatSession session;

    @Column(name = "sender")
    String sender;

    @Column(name = "message", columnDefinition = "TEXT")
    String message;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
