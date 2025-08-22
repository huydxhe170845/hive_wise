package com.capstone_project.capstone_project.model;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "chat_session")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "messages" })
public class ChatSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    User user;

    @ManyToOne
    @JoinColumn(name = "vault_id")
    Vault vault;

    @Column(name = "knowledge_source")
    String knowledgeSource;

    @Column(name = "started_at")
    LocalDateTime startedAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL)
    List<ChatMessage> messages;

    @PrePersist
    protected void onCreate() {
        this.startedAt = LocalDateTime.now();
    }
}
