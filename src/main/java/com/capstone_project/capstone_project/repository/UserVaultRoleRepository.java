package com.capstone_project.capstone_project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import com.capstone_project.capstone_project.dto.response.UserVaultRoleResponse;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.model.UserVaultRole;
import com.capstone_project.capstone_project.model.Vault;

public interface UserVaultRoleRepository extends CrudRepository<UserVaultRole, Integer> {
        int countByVaultId(String vaultId);

        @Query("SELECT new com.capstone_project.capstone_project.dto.response.UserVaultRoleResponse(" +
                        "u.id, u.email, u.name, u.username, r.name, u.avatar) " +
                        "FROM UserVaultRole uvr " +
                        "JOIN uvr.user u " +
                        "JOIN uvr.role r " +
                        "WHERE uvr.vault.id = :vaultId")
        List<UserVaultRoleResponse> findUserRoleInfoByVaultId(@Param("vaultId") String vaultId);

        boolean existsByUserIdAndVaultId(String userId, String vaultId);

        void deleteByUserIdAndVaultId(String userId, String vaultId);

        @Query("SELECT uvr FROM UserVaultRole uvr " +
                        "JOIN uvr.role r " +
                        "WHERE uvr.user.id = :userId AND uvr.vault.id = :vaultId")
        Optional<UserVaultRole> findByUserIdAndVaultId(@Param("userId") String userId,
                        @Param("vaultId") String vaultId);

        @Query("SELECT uvr.vault FROM UserVaultRole uvr WHERE uvr.user.id = :userId")
        List<Vault> findVaultsByUserId(@Param("userId") String userId);

        @Query(value = "SELECT u.* FROM user_vault_role ur " +
                        "JOIN users u ON ur.user_id = u.id " +
                        "JOIN vault_roles vr ON ur.vault_role_id = vr.id " +
                        "WHERE ur.vault_id = :vaultId AND vr.name = 'EXPERT'", nativeQuery = true)
        List<User> findExpertsInVault(@Param("vaultId") String vaultId);

        @Query("SELECT uvr.user.id FROM UserVaultRole uvr WHERE uvr.vault.id = :vaultId")
        List<String> findUserIdsByVaultId(@Param("vaultId") String vaultId);
}
