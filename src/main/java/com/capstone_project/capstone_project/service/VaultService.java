package com.capstone_project.capstone_project.service;

import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;
import java.io.IOException;
import java.time.LocalDateTime;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.capstone_project.capstone_project.dto.request.AddVaultRequest;
import com.capstone_project.capstone_project.dto.request.UpdateVaultRequest;
import com.capstone_project.capstone_project.dto.response.UserVaultRoleResponse;
import com.capstone_project.capstone_project.dto.response.VaultDashboardResponse;
import com.capstone_project.capstone_project.dto.response.TopVaultResponse;
import com.capstone_project.capstone_project.enums.KnowledgeVisibility;
import com.capstone_project.capstone_project.exception.FieldValidationException;
import com.capstone_project.capstone_project.model.KnowledgeItem;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.model.UserVaultRole;
import com.capstone_project.capstone_project.model.Vault;
import com.capstone_project.capstone_project.model.VaultRole;
import com.capstone_project.capstone_project.repository.KnowledgeItemRepository;
import com.capstone_project.capstone_project.repository.UserRepository;
import com.capstone_project.capstone_project.repository.UserVaultRoleRepository;
import com.capstone_project.capstone_project.repository.VaultRepository;
import com.capstone_project.capstone_project.repository.VaultRoleRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@Transactional
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VaultService {

    VaultRepository vaultRepository;
    UserRepository userRepository;
    VaultRoleRepository vaultRoleRepository;
    UserVaultRoleRepository userVaultRoleRepository;
    KnowledgeItemRepository knowledgeItemRepository;
    NotificationService notificationService;

    public Vault addVault(AddVaultRequest request, String userId) {
        System.out.println("=== VaultService.addVault ===");
        System.out.println("Request name: " + request.getName());
        System.out.println("Request createdByUserId: " + request.getCreatedByUserId());
        System.out.println("Parameter userId: " + userId);

        // Check if vault name already exists for the specified user
        String targetUserId = request.getCreatedByUserId() != null ? request.getCreatedByUserId() : userId;
        System.out.println("Target userId: " + targetUserId);

        if (vaultRepository.existsByNameAndCreatedByUserId(request.getName(), targetUserId)) {
            System.out.println("Error: Vault name already exists");
            throw new FieldValidationException("name", "Vault with this name already exists in your list");
        }

        String photoUrl = "/images/vault/vault_df.webp";
        if (request.getPhoto() != null && !request.getPhoto().isEmpty()) {
            try {
                photoUrl = saveVaultPhoto(request.getPhoto());
                System.out.println("Photo saved: " + photoUrl);
            } catch (IOException e) {
                System.err.println("Error saving vault photo: " + e.getMessage());
            }
        }

        Vault vault = Vault.builder()
                .name(request.getName())
                .description(request.getDescription())
                .photoUrl(photoUrl)
                .createdByUserId(request.getCreatedByUserId())
                .createdByEmail(request.getCreatedByEmail())
                .isActivated(true)
                .build();

        System.out.println("Saving vault...");
        Vault savedVault = vaultRepository.save(vault);
        System.out.println("Vault saved with ID: " + savedVault.getId());

        // Create admin notification for new vault
        try {
            notificationService.createAdminNewVaultNotification(savedVault);
        } catch (Exception e) {
            // Log error but don't fail the vault creation
            System.err.println("Failed to create admin notification: " + e.getMessage());
        }

        // Use the specified user as vault owner, or fall back to the current user
        System.out.println("Finding user with ID: " + targetUserId);
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        System.out.println("User found: " + user.getUsername());

        VaultRole ownerRole = vaultRoleRepository.findByName("VAULT_OWNER");
        if (ownerRole == null) {
            System.out.println("Error: Vault owner role not found");
            throw new RuntimeException("System error: Vault owner role not found");
        }
        System.out.println("Owner role found: " + ownerRole.getName());

        UserVaultRole userVaultRole = UserVaultRole.builder()
                .user(user)
                .vault(vault)
                .role(ownerRole)
                .build();

        System.out.println("Saving user vault role...");
        userVaultRoleRepository.save(userVaultRole);
        System.out.println("User vault role saved successfully!");

        return savedVault;
    }

    private String saveVaultPhoto(MultipartFile photo) throws IOException {
        Path uploadDir = Paths.get("target/classes/static/images/vault");
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }

        Path srcUploadDir = Paths.get("src/main/resources/static/images/vault");
        if (!Files.exists(srcUploadDir)) {
            Files.createDirectories(srcUploadDir);
        }

        String originalFilename = photo.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = "vault_" + UUID.randomUUID().toString() + extension;

        Path runtimeFilePath = uploadDir.resolve(filename);
        Files.copy(photo.getInputStream(), runtimeFilePath, StandardCopyOption.REPLACE_EXISTING);

        Path srcFilePath = srcUploadDir.resolve(filename);
        Files.copy(runtimeFilePath, srcFilePath, StandardCopyOption.REPLACE_EXISTING);

        return "/images/vault/" + filename;
    }

    public Vault updateVault(UpdateVaultRequest request, String userId, String vaultId, String userRole) {
        Vault vault = vaultRepository.findById(vaultId)
                .orElseThrow(() -> new RuntimeException("Vault not found"));

        // Check if user is vault owner or admin
        boolean isVaultOwner = vault.getCreatedByUserId().equals(userId);
        boolean isAdmin = "ADMIN".equals(userRole);

        if (!isVaultOwner && !isAdmin) {
            throw new RuntimeException("You are not authorized to update this vault");
        }

        // Check if the new name conflicts with other vaults (excluding current vault)
        if (!request.getName().equals(vault.getName())) {
            // Check if vault name already exists for the same user (excluding current
            // vault)
            Vault existingVault = vaultRepository.findByNameAndCreatedByUserId(request.getName(),
                    vault.getCreatedByUserId());
            if (existingVault != null && !existingVault.getId().equals(vaultId)) {
                throw new FieldValidationException("name", "Vault with this name already exists in your list");
            }
        }

        if (request.getPhoto() != null && !request.getPhoto().isEmpty()) {
            try {
                String newPhotoUrl = saveVaultPhoto(request.getPhoto());
                vault.setPhotoUrl(newPhotoUrl);
            } catch (IOException e) {
                System.err.println("Error saving vault photo during update: " + e.getMessage());
            }
        }

        vault.setName(request.getName());
        vault.setDescription(request.getDescription());
        vaultRepository.save(vault);
        return vault;
    }

    public List<Vault> getAllVaultsByOwner(String userId) {
        return vaultRepository.findByCreatedByUserId(userId);
    }

    public List<VaultDashboardResponse> getVaultsByUserId(String userId) {
        // Get all vaults where user is a member (owner or member) and not deleted
        List<Vault> userVaults = userVaultRoleRepository.findVaultsByUserId(userId);
        return userVaults.stream()
                .filter(vault -> !vault.isDeleted())
                .map(this::convertToVaultDashboardResponse)
                .collect(Collectors.toList());
    }

    public VaultDashboardResponse getLatestVaultByUserId(String userId) {
        // Get all vaults where user is a member (owner or member) and not deleted
        List<Vault> userVaults = userVaultRoleRepository.findVaultsByUserId(userId);
        return userVaults.stream()
                .filter(vault -> !vault.isDeleted())
                .max((v1, v2) -> v1.getCreatedAt().compareTo(v2.getCreatedAt()))
                .map(this::convertToVaultDashboardResponse)
                .orElse(null);
    }

    public List<VaultDashboardResponse> getTrashVaultsByUserId(String userId) {
        // Get all deleted vaults where user is the owner
        List<Vault> trashVaults = vaultRepository.findByCreatedByUserIdAndDeleted(userId);
        return trashVaults.stream()
                .map(this::convertToVaultDashboardResponse)
                .collect(Collectors.toList());
    }

    public List<KnowledgeItem> getKnowledgeItemsByVaultId(String vaultId, Integer folderId, String createdBy) {
        return knowledgeItemRepository.findByVaultIdAndFolderIdAndCreatedByAndVisibilityAndIsDeletedFalse(vaultId,
                folderId, createdBy, KnowledgeVisibility.OFFICIAL);
    }

    public Vault getVaultDetailById(String vaultId) {
        Vault vault = vaultRepository.findById(vaultId).orElse(null);
        if (vault == null) {
            throw new IllegalArgumentException("Vault not found with ID");
        }
        return vault;
    }

    public void deleteVault(String vaultId, String userId) {
        Vault vault = vaultRepository.findById(vaultId)
                .orElseThrow(() -> new RuntimeException("Vault not found"));
        if (!vault.getCreatedByUserId().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this vault");
        }
        vault.softDelete();
        vaultRepository.save(vault);
    }

    public void reactivateVault(String vaultId, String userId) {
        Vault vault = vaultRepository.findById(vaultId)
                .orElseThrow(() -> new RuntimeException("Vault not found"));
        if (!vault.getCreatedByUserId().equals(userId)) {
            throw new RuntimeException("You are not authorized to reactivate this vault");
        }
        vault.setActivated(true);
        vault.setDeactivatedAt(null);
        vaultRepository.save(vault);
    }

    public void restoreVault(String vaultId, String userId) {
        Vault vault = vaultRepository.findById(vaultId)
                .orElseThrow(() -> new RuntimeException("Vault not found"));
        if (!vault.getCreatedByUserId().equals(userId)) {
            throw new RuntimeException("You are not authorized to restore this vault");
        }
        vault.restore();
        vaultRepository.save(vault);
    }

    public void deletePermanentVault(String vaultId, String userId) {
        Vault vault = vaultRepository.findById(vaultId)
                .orElseThrow(() -> new RuntimeException("Vault not found"));
        if (!vault.getCreatedByUserId().equals(userId)) {
            throw new RuntimeException("You are not authorized to delete this vault");
        }
        vaultRepository.delete(vault);
    }

    public List<UserVaultRoleResponse> getUsersWithRolesByVaultId(String vaultId) {
        System.out.println("=== Getting users with roles for vault: " + vaultId + " ===");

        List<UserVaultRoleResponse> members = userVaultRoleRepository.findUserRoleInfoByVaultId(vaultId);
        System.out.println("Found " + members.size() + " members for vault " + vaultId);

        for (UserVaultRoleResponse member : members) {
            System.out.println("- Member: " + member.getUserName() + " (ID: " + member.getUserId() +
                    ", Email: " + member.getEmail() + ", Role: " + member.getVaultRoleName() + ")");
        }

        return members;
    }

    public List<Vault> getAllVaults() {
        return vaultRepository.findAllNotDeleted();
    }

    public long getTotalVaults() {
        return vaultRepository.countNotDeletedVaults();
    }

    public long getActiveVaults() {
        return vaultRepository.countByIsActivated(true);
    }

    public long getInactiveVaults() {
        return vaultRepository.countByIsActivated(false);
    }

    public long getDeletedVaults() {
        return vaultRepository.countDeletedVaults();
    }

    public long getTotalDocuments() {
        return knowledgeItemRepository.count();
    }

    public List<Vault> findVaultsByKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllVaults();
        }
        return vaultRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                keyword.trim(), keyword.trim());
    }

    public List<VaultDashboardResponse> getAllVaultsForDashboard() {
        List<Vault> vaults = getAllVaults();
        return vaults.stream().map(this::convertToVaultDashboardResponse).collect(Collectors.toList());
    }

    private VaultDashboardResponse convertToVaultDashboardResponse(Vault vault) {
        int actualMemberCount = userVaultRoleRepository.countByVaultId(vault.getId());

        List<KnowledgeItem> knowledgeItems = knowledgeItemRepository.findByVaultIdAndIsDeletedFalse(vault.getId());
        int actualKnowledgeItemCount = knowledgeItems.size();

        String status;
        if (vault.isDeleted()) {
            status = "Deleted";
        } else {
            status = vault.isActivated() ? "Active" : "Inactive";
        }

        return VaultDashboardResponse.builder()
                .id(vault.getId())
                .name(vault.getName())
                .ownerEmail(vault.getCreatedByEmail())
                .ownerName(extractNameFromEmail(vault.getCreatedByEmail()))
                .memberCount(actualMemberCount)
                .documentCount(actualKnowledgeItemCount)
                .status(status)
                .isActivated(vault.isActivated()) // For backward compatibility
                .isDeleted(vault.isDeleted())
                .createdAt(vault.getCreatedAt())
                .deactivatedAt(vault.getDeactivatedAt())
                .deletedAt(vault.getDeletedAt())
                .memberAvatars(Arrays.asList())
                .build();
    }

    private String extractNameFromEmail(String email) {
        if (email == null || !email.contains("@"))
            return "Unknown";
        String localPart = email.substring(0, email.indexOf("@"));
        return localPart.replace(".", " ").replace("_", " ");
    }

    public void updateVaultStatus(String vaultId, boolean isActivated) {
        Vault vault = vaultRepository.findById(vaultId)
                .orElseThrow(() -> new IllegalArgumentException("Vault not found with ID: " + vaultId));

        vault.setActivated(isActivated);
        if (!isActivated) {
            vault.setDeactivatedAt(LocalDateTime.now());
        } else {
            vault.setDeactivatedAt(null);
        }
        vaultRepository.save(vault);
    }

    public List<TopVaultResponse> getTopVaults() {
        List<Vault> topVaults = vaultRepository.findTopVaultsByKnowledgeCount();

        return topVaults.stream()
                .limit(5)
                .map(vault -> {
                    long knowledgeCount = knowledgeItemRepository.findByVaultIdAndIsDeletedFalse(vault.getId()).size();
                    // Simple activity score calculation (you can make this more sophisticated)
                    double activityScore = Math.min(100.0, knowledgeCount * 2.5);

                    // Get owner name from user or email
                    String ownerName = "Unknown";
                    if (vault.getCreatedByUserId() != null) {
                        User user = userRepository.findById(vault.getCreatedByUserId()).orElse(null);
                        if (user != null) {
                            ownerName = user.getName() != null ? user.getName() : user.getUsername();
                        }
                    } else if (vault.getCreatedByEmail() != null) {
                        ownerName = extractNameFromEmail(vault.getCreatedByEmail());
                    }

                    return TopVaultResponse.builder()
                            .vaultId(vault.getId())
                            .name(vault.getName())
                            .ownerName(ownerName)
                            .iconColorClass(getVaultIconColorClass(vault))
                            .knowledgeCount(knowledgeCount)
                            .totalViews(0L) // TODO: Calculate actual views
                            .activityScore(activityScore)
                            .memberCount(0) // TODO: Calculate actual member count
                            .build();
                })
                .collect(Collectors.toList());
    }

    private String getVaultIconColorClass(Vault vault) {
        // Simple color assignment based on vault name hash
        int hash = vault.getName().hashCode();
        String[] colors = { "text-primary", "text-success", "text-info", "text-warning", "text-danger" };
        return colors[Math.abs(hash) % colors.length];
    }

}
