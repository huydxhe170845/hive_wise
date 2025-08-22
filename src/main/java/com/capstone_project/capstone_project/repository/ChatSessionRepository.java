package com.capstone_project.capstone_project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.capstone_project.capstone_project.model.ChatSession;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    @Query("SELECT cs FROM ChatSession cs JOIN FETCH cs.user u LEFT JOIN FETCH cs.vault v LEFT JOIN FETCH cs.messages m WHERE u.id = :userId ORDER BY cs.startedAt DESC")
    List<ChatSession> findByUserIdOrderByStartedAtDesc(@Param("userId") String userId);
}