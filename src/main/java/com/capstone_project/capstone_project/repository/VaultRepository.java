package com.capstone_project.capstone_project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.capstone_project.capstone_project.model.Vault;

public interface VaultRepository extends JpaRepository<Vault, String> {
    List<Vault> findByCreatedByUserId(String createdByUserId);

    boolean existsByNameAndCreatedByUserId(String name, String createdByUserId);

    long countByIsActivated(boolean isActivated);

    List<Vault> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);

    @Query("SELECT v FROM Vault v WHERE v.isActivated = true ORDER BY v.createdAt DESC")
    List<Vault> findActiveVaultsOrderByCreatedAtDesc();

    @Query("SELECT COUNT(v) FROM Vault v WHERE v.isActivated = :isActivated")
    long countVaultsByActivationStatus(@Param("isActivated") boolean isActivated);

    @Query("SELECT v FROM Vault v ORDER BY v.createdAt DESC")
    List<Vault> findAllVaultsOrderByCreatedAtDesc();

    @Query("SELECT v FROM Vault v WHERE v.isActivated = false ORDER BY v.createdAt DESC")
    List<Vault> findInactiveVaultsOrderByCreatedAtDesc();

    @Query("SELECT v FROM Vault v " +
            "LEFT JOIN KnowledgeItem k ON v.id = k.vaultId AND k.isDeleted = false AND k.approvalStatus = com.capstone_project.capstone_project.enums.KnowledgeApprovalStatus.APPROVED "
            +
            "WHERE v.isActivated = true " +
            "GROUP BY v.id, v.name, v.description, v.createdByUserId " +
            "ORDER BY COUNT(k.id) DESC")
    List<Vault> findTopVaultsByKnowledgeCount();

    List<Vault> findByCreatedByUserIdAndIsActivatedFalse(String createdByUserId);

    // Soft delete related queries
    @Query("SELECT v FROM Vault v WHERE v.isDeleted = false")
    List<Vault> findAllNotDeleted();

    @Query("SELECT v FROM Vault v WHERE v.isDeleted = true")
    List<Vault> findAllDeleted();

    @Query("SELECT v FROM Vault v WHERE v.createdByUserId = :userId AND v.isDeleted = false")
    List<Vault> findByCreatedByUserIdAndNotDeleted(@Param("userId") String userId);

    @Query("SELECT v FROM Vault v WHERE v.createdByUserId = :userId AND v.isDeleted = true")
    List<Vault> findByCreatedByUserIdAndDeleted(@Param("userId") String userId);

    @Query("SELECT v FROM Vault v WHERE v.isDeleted = false AND v.isActivated = :isActivated")
    List<Vault> findByActivationStatusAndNotDeleted(@Param("isActivated") boolean isActivated);

    @Query("SELECT COUNT(v) FROM Vault v WHERE v.isDeleted = false")
    long countNotDeletedVaults();

    @Query("SELECT COUNT(v) FROM Vault v WHERE v.isDeleted = true")
    long countDeletedVaults();

}
