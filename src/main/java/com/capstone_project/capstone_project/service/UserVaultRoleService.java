package com.capstone_project.capstone_project.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.model.UserVaultRole;
import com.capstone_project.capstone_project.model.Vault;
import com.capstone_project.capstone_project.model.VaultRole;
import com.capstone_project.capstone_project.repository.UserRepository;
import com.capstone_project.capstone_project.repository.UserVaultRoleRepository;
import com.capstone_project.capstone_project.repository.VaultRepository;
import com.capstone_project.capstone_project.repository.VaultRoleRepository;
import com.capstone_project.capstone_project.dto.response.UserVaultRoleResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserVaultRoleService {
    UserVaultRoleRepository userVaultRoleRepository;
    VaultRepository vaultRepository;
    UserRepository userRepository;
    VaultRoleRepository vaultRoleRepository;

    public int countMembersInVault(String vaultId) {
        return userVaultRoleRepository.countByVaultId(vaultId);
    }

    public boolean isVaultOwner(String userId, String vaultId) {
        return userVaultRoleRepository.findByUserIdAndVaultId(userId, vaultId)
                .map(uvr -> "VAULT_OWNER".equals(uvr.getRole().getName()))
                .orElse(false);
    }

    public String getVaultOwnerId(String vaultId) {
        List<UserVaultRoleResponse> userRoles = userVaultRoleRepository.findUserRoleInfoByVaultId(vaultId);
        return userRoles.stream()
                .filter(ur -> "VAULT_OWNER".equals(ur.getVaultRoleName()))
                .findFirst()
                .map(UserVaultRoleResponse::getUserId)
                .orElse(null);
    }

    public String getRoleInVault(String userId, String vaultId) {
        return userVaultRoleRepository.findByUserIdAndVaultId(userId, vaultId)
                .map(uvr -> uvr.getRole().getName())
                .orElse(null);
    }

    public void addMemberToVault(String vaultId, String userId, String roleName, String currentUserId) {
        if (!isVaultOwner(currentUserId, vaultId)) {
            throw new RuntimeException("Only vault owner can add members to this vault");
        }

        // Prevent adding member with VAULT_OWNER role
        if ("VAULT_OWNER".equals(roleName)) {
            throw new RuntimeException("Cannot add member with vault owner role");
        }

        Vault vault = vaultRepository.findById(vaultId).orElseThrow(() -> new RuntimeException("Vault not found"));
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        VaultRole role = vaultRoleRepository.findByName(roleName);
        if (role == null) {
            throw new RuntimeException("Role not found: " + roleName);
        }
        if (userVaultRoleRepository.existsByUserIdAndVaultId(userId, vaultId)) {
            throw new RuntimeException("User is already a member of this vault");
        }
        UserVaultRole uvr = UserVaultRole.builder()
                .user(user)
                .vault(vault)
                .role(role)
                .build();
        userVaultRoleRepository.save(uvr);
        System.out.println("Member added successfully to database");
    }

    public void removeMemberFromVault(String vaultId, String userId, String currentUserId) {
        if (!isVaultOwner(currentUserId, vaultId)) {
            throw new RuntimeException("Only vault owner can remove members from this vault");
        }
        if (userId.equals(currentUserId)) {
            throw new RuntimeException("Vault owner cannot remove themselves from the vault");
        }
        System.out.println("Removing member - vaultId: " + vaultId + ", userId: " + userId);
        userVaultRoleRepository.deleteByUserIdAndVaultId(userId, vaultId);
        System.out.println("Member removed successfully from database");
    }

    public void leaveVault(String vaultId, String userId) {
        System.out.println("User " + userId + " leaving vault " + vaultId);
        userVaultRoleRepository.deleteByUserIdAndVaultId(userId, vaultId);
        System.out.println("User left vault successfully");
    }

    public List<Vault> getVaultsByUserId(String userId) {
        return userVaultRoleRepository.findVaultsByUserId(userId);
    }

    public List<Vault> getMyVaultsByUserId(String userId) {
        // Get vaults where user is a member (any role) and vault is not deleted
        List<Vault> userVaults = userVaultRoleRepository.findVaultsByUserId(userId);
        List<Vault> filteredVaults = userVaults.stream()
                .filter(vault -> !vault.isDeleted())
                .collect(Collectors.toList());

        for (Vault vault : userVaults) {
            // Get user's role in this vault
            String userRole = userVaultRoleRepository.findByUserIdAndVaultId(userId, vault.getId())
                    .map(uvr -> uvr.getRole().getName())
                    .orElse("UNKNOWN");

            System.out.println("Vault: " + vault.getName() + " (ID: " + vault.getId() +
                    ", isActivated: " + vault.isActivated() + ", isDeleted: " + vault.isDeleted() +
                    ", createdBy: " + vault.getCreatedByUserId() + ", userRole: " + userRole + ")");
        }

        return filteredVaults;
    }

    public List<Vault> getTrashVaultsByUserId(String userId) {
        // Get vaults where user is the owner (VAULT_OWNER role) and vault is deleted
        List<Vault> allUserVaults = userVaultRoleRepository.findVaultsByUserId(userId);
        List<Vault> trashVaults = allUserVaults.stream()
                .filter(vault -> vault.isDeleted())
                .filter(vault -> {
                    // Check if user is VAULT_OWNER for this vault
                    return userVaultRoleRepository.findByUserIdAndVaultId(userId, vault.getId())
                            .map(uvr -> "VAULT_OWNER".equals(uvr.getRole().getName()))
                            .orElse(false);
                })
                .collect(Collectors.toList());

        System.out.println("=== DEBUG getTrashVaultsByUserId ===");
        System.out.println("User ID: " + userId);
        System.out.println("Trash vaults count: " + trashVaults.size());
        for (Vault vault : trashVaults) {
            System.out.println("Trash Vault: " + vault.getName() + " (ID: " + vault.getId() +
                    ", isActivated: " + vault.isActivated() + ", isDeleted: " + vault.isDeleted() +
                    ", createdBy: " + vault.getCreatedByUserId() + ")");
        }

        return trashVaults;
    }

    public List<Vault> getAllVaultsByUserId(String userId) {
        // Get all vaults where user is a member (both owner and member)
        List<Vault> allUserVaults = userVaultRoleRepository.findVaultsByUserId(userId);

        System.out.println("=== DEBUG getAllVaultsByUserId ===");
        System.out.println("User ID: " + userId);
        System.out.println("All user vaults count: " + allUserVaults.size());
        for (Vault vault : allUserVaults) {
            System.out.println("All Vault: " + vault.getName() + " (ID: " + vault.getId() +
                    ", isActivated: " + vault.isActivated() + ", isDeleted: " + vault.isDeleted() +
                    ", createdBy: " + vault.getCreatedByUserId() + ")");
        }

        return allUserVaults;
    }

    public void updateMemberRole(String vaultId, String userId, String newRoleName, String currentUserId) {
        if (!isVaultOwner(currentUserId, vaultId)) {
            throw new RuntimeException("Only vault owner can update member roles in this vault");
        }

        if (userId.equals(currentUserId)) {
            throw new RuntimeException("Vault owner cannot change their own role");
        }

        UserVaultRole existingUvr = userVaultRoleRepository.findByUserIdAndVaultId(userId, vaultId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this vault"));

        if ("VAULT_OWNER".equals(existingUvr.getRole().getName())) {
            throw new RuntimeException("Cannot change role of vault owner");
        }

        // Prevent updating member to VAULT_OWNER role
        if ("VAULT_OWNER".equals(newRoleName)) {
            throw new RuntimeException("Cannot update member to vault owner role");
        }

        VaultRole newRole = vaultRoleRepository.findByName(newRoleName);
        if (newRole == null) {
            throw new RuntimeException("Role not found: " + newRoleName);
        }

        existingUvr.setRole(newRole);
        userVaultRoleRepository.save(existingUvr);
        System.out.println("Member role updated successfully in database");
    }

    public List<VaultRole> getAllVaultRoles() {
        return (List<VaultRole>) vaultRoleRepository.findAll();
    }

    public List<User> getExpertsInVault(String vaultId) {
        return userVaultRoleRepository.findExpertsInVault(vaultId);
    }

    public List<String> getUserIdsByVaultId(String vaultId) {
        return userVaultRoleRepository.findUserIdsByVaultId(vaultId);
    }
}