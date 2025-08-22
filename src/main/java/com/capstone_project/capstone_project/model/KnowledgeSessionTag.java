package com.capstone_project.capstone_project.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "knowledge_session_tags")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class KnowledgeSessionTag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "knowledge_session_id", insertable = false, updatable = false)
    int knowledgeSessionId;

    @Column(name = "tag_id", insertable = false, updatable = false)
    Long tagId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "knowledge_session_id", nullable = false)
    KnowledgeSession knowledgeSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tag_id", nullable = false)
    Tag tag;
}
