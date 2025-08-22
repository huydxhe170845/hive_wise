package com.capstone_project.capstone_project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.capstone_project.capstone_project.model.KnowledgeSession;

@Repository
public interface KnowledgeSessionRepository extends JpaRepository<KnowledgeSession, Integer> {

    @Query("SELECT ks FROM KnowledgeSession ks WHERE ks.vault.id = :vaultId ORDER BY ks.startTime DESC")
    List<KnowledgeSession> findByVaultIdOrderByStartTimeDesc(@Param("vaultId") String vaultId);

    @Query("SELECT ks FROM KnowledgeSession ks WHERE ks.instructor.id = :instructorId ORDER BY ks.startTime DESC")
    List<KnowledgeSession> findByInstructorIdOrderByStartTimeDesc(@Param("instructorId") String instructorId);

    @Query("SELECT ks FROM KnowledgeSession ks WHERE ks.vault.id = :vaultId AND ks.status = :status ORDER BY ks.startTime DESC")
    List<KnowledgeSession> findByVaultIdAndStatusOrderByStartTimeDesc(@Param("vaultId") String vaultId,
            @Param("status") String status);

}