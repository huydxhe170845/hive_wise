package com.capstone_project.capstone_project.repository;

import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.enums.KnowledgeApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String>, JpaSpecificationExecutor<User> {
        boolean existsByEmail(String email);

        boolean existsByEmailIgnoreCase(String email);

        Optional<User> findById(String id);

        boolean existsByUsername(String username);

        boolean existsByUsernameIgnoreCase(String username);

        Optional<User> findByUsernameOrEmail(String username, String email);

        @Query("SELECT u FROM User u JOIN FETCH u.systemRole WHERE u.username = :username OR u.email = :email")
        Optional<User> findByUsernameOrEmailWithRole(@Param("username") String username, @Param("email") String email);

        Optional<User> findByEmail(String email);

        Optional<User> findByUsername(String username);

        @Query("SELECT u FROM User u WHERE " +
                        "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "u.phoneNumber LIKE CONCAT('%', :keyword, '%')")
        List<User> findByKeyword(@Param("keyword") String keyword);

        @Query("SELECT u FROM User u WHERE " +
                        "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "u.phoneNumber LIKE CONCAT('%', :keyword, '%')")
        Page<User> findByKeywordPaginated(@Param("keyword") String keyword, Pageable pageable);

        long count();

        @Query(value = "SELECT count(*) FROM users WHERE is_activated = :status", nativeQuery = true)
        long countUsersByActivationStatus(@Param("status") int status);

        List<User> findByUsernameContainingIgnoreCase(String keyword);

        List<User> findByEmailContainingIgnoreCase(String keyword);

        @Query("SELECT u FROM User u " +
                        "JOIN KnowledgeItem k ON u.id = k.createdBy " +
                        "WHERE k.approvalStatus = com.capstone_project.capstone_project.enums.KnowledgeApprovalStatus.APPROVED AND k.isDeleted = false "
                        +
                        "GROUP BY u.id, u.username, u.name, u.email, u.avatar " +
                        "ORDER BY COUNT(k.id) DESC")
        List<User> findTopBuildersByApprovedKnowledge();

        @Query("SELECT u FROM User u JOIN u.systemRole sr WHERE sr.name = :systemRoleName")
        List<User> findBySystemRoleName(@Param("systemRoleName") String systemRoleName);
}
