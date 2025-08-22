package com.capstone_project.capstone_project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.capstone_project.capstone_project.model.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findBySessionId(Long sessionId);

    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(Long sessionId);
}