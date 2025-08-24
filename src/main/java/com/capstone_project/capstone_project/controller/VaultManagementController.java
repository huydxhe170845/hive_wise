package com.capstone_project.capstone_project.controller;

import com.capstone_project.capstone_project.dto.request.AddPasswordRequest;
import com.capstone_project.capstone_project.dto.request.AddVaultRequest;
import com.capstone_project.capstone_project.dto.request.ChangePasswordRequest;
import com.capstone_project.capstone_project.dto.request.UpdateProfileRequest;
import com.capstone_project.capstone_project.dto.request.UpdateVaultRequest;
import com.capstone_project.capstone_project.dto.response.UserVaultRoleResponse;
import com.capstone_project.capstone_project.dto.response.UserSuggestionResponse;
import com.capstone_project.capstone_project.exception.FieldValidationException;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.model.Vault;
import com.capstone_project.capstone_project.security.CustomUserDetails;
import com.capstone_project.capstone_project.service.UserService;
import com.capstone_project.capstone_project.service.UserVaultRoleService;
import com.capstone_project.capstone_project.service.VaultService;
import com.capstone_project.capstone_project.repository.KnowledgeItemRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.stream.Collectors;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.bind.annotation.PostMapping;
import com.capstone_project.capstone_project.model.VaultRole;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.http.HttpStatus;
import com.capstone_project.capstone_project.model.UserVaultRole;
import com.capstone_project.capstone_project.dto.response.VaultDashboardResponse;

@Controller
@RequestMapping(path = "/vault-management")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VaultManagementController {
    VaultService vaultService;
    UserVaultRoleService userVaultRoleService;
    UserService userService;
    KnowledgeItemRepository knowledgeItemRepository;

    @GetMapping
    public String vaultManagement(Model model, @AuthenticationPrincipal CustomUserDetails userDetails) {
        prepareVaultManagementPage(model, userDetails, false);
        model.addAttribute("showCardList", true);
        return "vault-management";
    }

    @GetMapping("/edit-vault/general")
    public String editVaultGeneral(@RequestParam("id") String id,
            Model model, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Vault vault = vaultService.getVaultDetailById(id);
        if (vault == null) {
            return "redirect:/error";
        }

        // Check if user is vault owner or admin
        boolean isVaultOwner = userVaultRoleService.isVaultOwner(userDetails.getId(), id);
        boolean isAdmin = "ADMIN".equals(userDetails.getSystemRoleName());

        // Only allow access if user is vault owner or admin
        if (!isVaultOwner && !isAdmin) {
            return "redirect:/error";
        }

        UpdateVaultRequest updateVaultRequest = UpdateVaultRequest.builder()
                .name(vault.getName())
                .description(vault.getDescription())
                .build();
        model.addAttribute("updateVaultRequest", updateVaultRequest);
        model.addAttribute("vault", vault);
        model.addAttribute("user", userDetails);
        model.addAttribute("addPasswordRequest", new AddPasswordRequest());
        model.addAttribute("changePasswordRequest", new ChangePasswordRequest());
        model.addAttribute("updateProfileRequest", new UpdateProfileRequest());
        model.addAttribute("updateProfileRequest", new UpdateProfileRequest());
        model.addAttribute("isVaultOwner", isVaultOwner);
        model.addAttribute("isAdmin", isAdmin);
        model.addAttribute("canEditVault", isVaultOwner || isAdmin);
        return "edit-vault";
    }

    @GetMapping("/edit-vault/member")
    public String editVaultMember(Model model, @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("id") String vaultId) {
        Vault vault = vaultService.getVaultDetailById(vaultId);
        if (vault == null) {
            return "redirect:/error";
        }

        // Check if user is vault owner or admin
        boolean isVaultOwner = userVaultRoleService.isVaultOwner(userDetails.getId(), vaultId);
        boolean isAdmin = "ADMIN".equals(userDetails.getSystemRoleName());

        // Only allow access if user is vault owner or admin
        if (!isVaultOwner && !isAdmin) {
            return "redirect:/error";
        }

        model.addAttribute("user", userDetails);
        model.addAttribute("vault", vault);
        model.addAttribute("vaultId", vaultId);
        model.addAttribute("userVaultRoleService", userVaultRoleService);
        model.addAttribute("addPasswordRequest", new AddPasswordRequest());
        model.addAttribute("changePasswordRequest", new ChangePasswordRequest());
        model.addAttribute("updateProfileRequest", new UpdateProfileRequest());
        model.addAttribute("updateProfileRequest", new UpdateProfileRequest());
        List<UserVaultRoleResponse> members = vaultService.getUsersWithRolesByVaultId(vaultId);
        model.addAttribute("members", members);

        // Add all available vault roles for dropdown
        List<VaultRole> allVaultRoles = userVaultRoleService.getAllVaultRoles();
        model.addAttribute("allVaultRoles", allVaultRoles);

        // Add flags for UI control
        model.addAttribute("isVaultOwner", isVaultOwner);
        model.addAttribute("isAdmin", isAdmin);
        model.addAttribute("canManageMembers", isVaultOwner || isAdmin);

        return "manage-vault-member";
    }

    @GetMapping("/edit-vault/notification")
    public String editVaultNotification(Model model, @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("id") String vaultId) {
        Vault vault = vaultService.getVaultDetailById(vaultId);
        if (vault == null) {
            return "redirect:/error";
        }

        // Check if user is vault owner or admin
        boolean isVaultOwner = userVaultRoleService.isVaultOwner(userDetails.getId(), vaultId);
        boolean isAdmin = "ADMIN".equals(userDetails.getSystemRoleName());

        // Only allow access if user is vault owner or admin
        if (!isVaultOwner && !isAdmin) {
            return "redirect:/error";
        }

        model.addAttribute("user", userDetails);
        model.addAttribute("vault", vault);
        model.addAttribute("vaultId", vaultId);
        model.addAttribute("addPasswordRequest", new AddPasswordRequest());
        model.addAttribute("changePasswordRequest", new ChangePasswordRequest());
        model.addAttribute("updateProfileRequest", new UpdateProfileRequest());
        model.addAttribute("updateProfileRequest", new UpdateProfileRequest());
        model.addAttribute("isVaultOwner", isVaultOwner);
        model.addAttribute("isAdmin", isAdmin);
        model.addAttribute("canManageNotifications", isVaultOwner || isAdmin);
        return "manage-vault-notification";
    }

    @PostMapping("/add-vault")
    public String addVault(@Valid @ModelAttribute("addVaultRequest") AddVaultRequest request,
            BindingResult bindingResult,
            Model model,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            org.springframework.web.servlet.mvc.support.RedirectAttributes redirectAttributes,
            @RequestHeader(value = "X-Requested-With", required = false) String requestedWith) {

        // Check if this is an AJAX request
        if ("XMLHttpRequest".equals(requestedWith)) {
            // This should be handled by the AJAX endpoint
            return "redirect:/vault-management";
        }

        if (bindingResult.hasErrors()) {
            model.addAttribute("org.springframework.validation.BindingResult.addVaultRequest", bindingResult);
            model.addAttribute("showAddVaultForm", true);
            model.addAttribute("showCardList", false);
            model.addAttribute("addVaultRequest", request);
            model.addAttribute("user", userDetails);
            model.addAttribute("addPasswordRequest", new AddPasswordRequest());
            model.addAttribute("changePasswordRequest", new ChangePasswordRequest());
            model.addAttribute("updateProfileRequest", new UpdateProfileRequest());
            return "vault-management";
        }
        try {
            vaultService.addVault(request, userDetails.getId());
        } catch (FieldValidationException ex) {
            bindingResult.rejectValue(ex.getField(), "", ex.getMessage());
            model.addAttribute("addVaultRequest", request);
            model.addAttribute("org.springframework.validation.BindingResult.addVaultRequest", bindingResult);
            model.addAttribute("showAddVaultForm", true);
            model.addAttribute("showCardList", false);
            prepareVaultManagementPage(model, userDetails, true);
            return "vault-management";
        } catch (RuntimeException e) {
            model.addAttribute("error", "An error occurred while adding the vault: " + e.getMessage());
            model.addAttribute("showAddVaultForm", true);
            model.addAttribute("showCardList", false);
            prepareVaultManagementPage(model, userDetails, true);
            return "vault-management";
        } catch (Exception e) {
            model.addAttribute("error", e.getMessage());
            model.addAttribute("showAddVaultForm", true);
            model.addAttribute("showCardList", false);
            prepareVaultManagementPage(model, userDetails, true);
            return "vault-management";
        }
        prepareVaultManagementPage(model, userDetails, false);
        model.addAttribute("showCardList", true);
        model.addAttribute("showAddVaultForm", false);
        redirectAttributes.addFlashAttribute("successAddVaultMessage", "Vault added successfully!");
        return "redirect:/vault-management";
    }

    @PostMapping("/add-vault-ajax")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> addVaultAjax(
            @Valid @ModelAttribute("addVaultRequest") AddVaultRequest request,
            BindingResult bindingResult,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Map<String, Object> response = new HashMap<>();

        if (bindingResult.hasErrors()) {
            response.put("success", false);
            response.put("message", "Validation failed");

            Map<String, String> errors = new HashMap<>();
            bindingResult.getFieldErrors().forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
            response.put("errors", errors);

            return ResponseEntity.badRequest().body(response);
        }

        try {
            // Set user details if not already set
            if (request.getCreatedByUserId() == null) {
                request.setCreatedByUserId(userDetails.getId());
            }
            if (request.getCreatedByEmail() == null) {
                request.setCreatedByEmail(userDetails.getEmail());
            }

            Vault createdVault = vaultService.addVault(request, userDetails.getId());

            response.put("success", true);
            response.put("message", "Vault created successfully!");
            response.put("vaultId", createdVault.getId());
            response.put("vaultName", createdVault.getName());

            return ResponseEntity.ok(response);

        } catch (FieldValidationException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            Map<String, String> errors = new HashMap<>();
            errors.put(e.getField(), e.getMessage());
            response.put("errors", errors);
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to create vault: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/get-latest-vault")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getLatestVault(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Get the most recently created vault for this user
            VaultDashboardResponse latestVault = vaultService.getLatestVaultByUserId(userDetails.getId());

            if (latestVault == null) {
                response.put("success", false);
                response.put("message", "No vault found");
                return ResponseEntity.ok(response);
            }

            // Convert to map format for JSON response
            Map<String, Object> vaultInfo = new HashMap<>();
            vaultInfo.put("id", latestVault.getId());
            vaultInfo.put("name", latestVault.getName());
            vaultInfo.put("description", ""); // VaultDashboardResponse doesn't have description
            vaultInfo.put("status", latestVault.getStatus());
            vaultInfo.put("createdAt", latestVault.getCreatedAt());
            vaultInfo.put("photoUrl", "/images/vault/vault_df.webp"); // Default photo
            vaultInfo.put("ownerName", latestVault.getOwnerName());
            vaultInfo.put("ownerEmail", latestVault.getOwnerEmail());
            vaultInfo.put("memberCount", latestVault.getMemberCount());
            vaultInfo.put("documentCount", latestVault.getDocumentCount());
            vaultInfo.put("isActivated", latestVault.getIsActivated());
            vaultInfo.put("isDeleted", latestVault.getIsDeleted());

            response.put("success", true);
            response.put("vault", vaultInfo);
            response.put("message", "Latest vault retrieved successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to get latest vault: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/update-vault")
    public String updateVault(@Valid @ModelAttribute("updateVaultRequest") UpdateVaultRequest request,
            BindingResult bindingResult,
            Model model,
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            org.springframework.web.servlet.mvc.support.RedirectAttributes redirectAttributes) {

        System.out.println("=== UPDATE VAULT ENDPOINT CALLED ===");
        System.out.println("Vault ID: " + vaultId);
        System.out.println("Request name: " + request.getName());
        System.out.println("Request description: " + request.getDescription());
        System.out.println("User ID: " + userDetails.getId());
        System.out.println("User role: " + userDetails.getSystemRoleName());
        Vault vault = vaultService.getVaultDetailById(vaultId);
        if (vault == null) {
            return "redirect:/error";
        }

        // Check if user is vault owner or admin
        boolean isVaultOwner = userVaultRoleService.isVaultOwner(userDetails.getId(), vaultId);
        boolean isAdmin = "ADMIN".equals(userDetails.getSystemRoleName());

        // Only allow access if user is vault owner or admin
        if (!isVaultOwner && !isAdmin) {
            redirectAttributes.addFlashAttribute("error", "You don't have permission to update this vault");
            return "redirect:/error";
        }
        if (bindingResult.hasErrors()) {
            model.addAttribute("org.springframework.validation.BindingResult.updateVaultRequest", bindingResult);
            model.addAttribute("updateVaultRequest", request);
            model.addAttribute("user", userDetails);
            model.addAttribute("vault", vault);
            model.addAttribute("addPasswordRequest", new AddPasswordRequest());
            model.addAttribute("changePasswordRequest", new ChangePasswordRequest());
            model.addAttribute("updateProfileRequest", new UpdateProfileRequest());
            return "edit-vault";
        }
        try {
            vaultService.updateVault(request, userDetails.getId(), vaultId, userDetails.getSystemRoleName());
        } catch (FieldValidationException ex) {
            bindingResult.rejectValue(ex.getField(), "", ex.getMessage());
            model.addAttribute("vault", vault);
            model.addAttribute("updateVaultRequest", request);
            model.addAttribute("user", userDetails);
            model.addAttribute("addPasswordRequest", new AddPasswordRequest());
            model.addAttribute("changePasswordRequest", new ChangePasswordRequest());
            model.addAttribute("updateProfileRequest", new UpdateProfileRequest());
            model.addAttribute("org.springframework.validation.BindingResult.updateVaultRequest", bindingResult);
            return "edit-vault";
        } catch (Exception e) {
            model.addAttribute("error", e.getMessage());
            model.addAttribute("user", userDetails);
            model.addAttribute("updateVaultRequest", request);
            model.addAttribute("addPasswordRequest", new AddPasswordRequest());
            model.addAttribute("changePasswordRequest", new ChangePasswordRequest());
            model.addAttribute("updateProfileRequest", new UpdateProfileRequest());
            model.addAttribute("vault", vault);
            return "edit-vault";
        }
        System.out.println("=== VAULT UPDATE SUCCESSFUL ===");
        redirectAttributes.addFlashAttribute("successUpdateVaultMessage", "Vault updated successfully!");
        return "redirect:/vault-management/edit-vault/general?id=" + vaultId;
    }

    @PostMapping("/update-vault-ajax")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> updateVaultAjax(
            @Valid @ModelAttribute("updateVaultRequest") UpdateVaultRequest request,
            BindingResult bindingResult,
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Map<String, Object> response = new HashMap<>();

        System.out.println("=== UPDATE VAULT AJAX ENDPOINT CALLED ===");
        System.out.println("Vault ID: " + vaultId);
        System.out.println("Request name: " + request.getName());
        System.out.println("Request description: " + request.getDescription());

        Vault vault = vaultService.getVaultDetailById(vaultId);
        if (vault == null) {
            response.put("success", false);
            response.put("message", "Vault not found");
            return ResponseEntity.badRequest().body(response);
        }

        // Check if user is vault owner or admin
        boolean isVaultOwner = userVaultRoleService.isVaultOwner(userDetails.getId(), vaultId);
        boolean isAdmin = "ADMIN".equals(userDetails.getSystemRoleName());

        // Only allow access if user is vault owner or admin
        if (!isVaultOwner && !isAdmin) {
            response.put("success", false);
            response.put("message", "You don't have permission to update this vault");
            return ResponseEntity.badRequest().body(response);
        }

        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            bindingResult.getFieldErrors().forEach(error -> {
                errors.put(error.getField(), error.getDefaultMessage());
            });
            response.put("success", false);
            response.put("errors", errors);
            response.put("message", "Validation failed");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            vaultService.updateVault(request, userDetails.getId(), vaultId, userDetails.getSystemRoleName());
            response.put("success", true);
            response.put("message", "Vault updated successfully!");
            return ResponseEntity.ok(response);
        } catch (FieldValidationException ex) {
            Map<String, String> errors = new HashMap<>();
            errors.put(ex.getField(), ex.getMessage());
            response.put("success", false);
            response.put("errors", errors);
            response.put("message", "Validation failed");
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/delete-vault")
    public String deleteVault(@RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            org.springframework.web.servlet.mvc.support.RedirectAttributes redirectAttributes) {
        try {
            vaultService.deleteVault(vaultId, userDetails.getId());
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error",
                    "An error occurred while deleting the vault: " + e.getMessage());
            return "redirect:/vault-management";
        }
        redirectAttributes.addFlashAttribute("successDeleteVaultMessage", "Vault deleted successfully!");
        return "redirect:/vault-management";
    }

    @PostMapping("/restore-vault")
    public String restoreVault(@RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            org.springframework.web.servlet.mvc.support.RedirectAttributes redirectAttributes) {
        try {
            vaultService.restoreVault(vaultId, userDetails.getId());
            redirectAttributes.addFlashAttribute("successMessage", "Vault restored successfully!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage",
                    "An error occurred while restoring the vault: " + e.getMessage());
        }
        return "redirect:/vault-management";
    }

    @PostMapping("/delete-vault-permanently")
    public String deleteVaultPermanently(@RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            org.springframework.web.servlet.mvc.support.RedirectAttributes redirectAttributes) {
        try {
            vaultService.deletePermanentVault(vaultId, userDetails.getId());
            redirectAttributes.addFlashAttribute("successMessage", "Vault deleted permanently!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage",
                    "An error occurred while permanently deleting the vault: " + e.getMessage());
        }
        return "redirect:/vault-management";
    }

    private void prepareVaultManagementPage(Model model, CustomUserDetails userDetails, boolean keepAddVaultRequest) {
        // Get all vaults where user is a member (for My Vaults)
        var allUserVaults = userVaultRoleService.getAllVaultsByUserId(userDetails.getId());

        // Get vaults where user is owner and deleted (for Trash)
        var ownerDeletedVaults = userVaultRoleService.getTrashVaultsByUserId(userDetails.getId());

        // Separate into My Vaults (not deleted) and Trash (owner + deleted)
        var myVaults = allUserVaults.stream()
                .filter(vault -> !vault.isDeleted())
                .collect(Collectors.toList());

        var trashVaults = ownerDeletedVaults;

        // Debug: Print vault information
        System.out.println("=== DEBUG VAULT DISPLAY ===");
        System.out.println("All User Vaults count: " + allUserVaults.size());
        System.out.println("My Vaults count: " + myVaults.size());
        for (var vault : myVaults) {
            System.out.println("My Vault: " + vault.getName() + " (ID: " + vault.getId() +
                    ", isActivated: " + vault.isActivated() + ", isDeleted: " + vault.isDeleted() +
                    ", createdBy: " + vault.getCreatedByUserId() + ")");
        }

        System.out.println("Trash Vaults count: " + trashVaults.size());
        for (var vault : trashVaults) {
            System.out.println("Trash Vault: " + vault.getName() + " (ID: " + vault.getId() +
                    ", isActivated: " + vault.isActivated() + ", isDeleted: " + vault.isDeleted() +
                    ", createdBy: " + vault.getCreatedByUserId() + ")");
        }

        // Combine all vaults for display (My Vaults + Trash)
        var allVaults = new ArrayList<>(myVaults);
        allVaults.addAll(trashVaults);
        model.addAttribute("vaults", allVaults);

        // Add separate lists for reference
        model.addAttribute("myVaults", myVaults);
        model.addAttribute("trashVaults", trashVaults);

        Map<String, Integer> vaultMemberCounts = new HashMap<>();
        Map<String, Long> vaultKnowledgeCounts = new HashMap<>();

        // Calculate member and knowledge counts for all vaults (my vaults + trash)
        for (var vault : allVaults) {
            int memberCount = userVaultRoleService.countMembersInVault(vault.getId());
            vaultMemberCounts.put(vault.getId(), memberCount);

            long knowledgeCount = knowledgeItemRepository.countByVaultIdAndIsDeletedFalse(vault.getId());
            vaultKnowledgeCounts.put(vault.getId(), knowledgeCount);
        }
        model.addAttribute("vaultMemberCounts", vaultMemberCounts);
        model.addAttribute("vaultKnowledgeCounts", vaultKnowledgeCounts);

        int totalVaults = myVaults.size();
        int activeVaults = (int) myVaults.stream().filter(vault -> vault.isActivated()).count();
        int inactiveVaults = totalVaults - activeVaults;
        int deletedVaults = trashVaults.size();

        model.addAttribute("totalVaults", totalVaults);
        model.addAttribute("activeVaults", activeVaults);
        model.addAttribute("inactiveVaults", inactiveVaults);
        model.addAttribute("deletedVaults", deletedVaults);

        model.addAttribute("addPasswordRequest", new AddPasswordRequest());
        model.addAttribute("changePasswordRequest", new ChangePasswordRequest());
        model.addAttribute("updateProfileRequest", new UpdateProfileRequest());
        model.addAttribute("updateProfileRequest", new UpdateProfileRequest());
        if (!keepAddVaultRequest) {
            model.addAttribute("addVaultRequest", AddVaultRequest.builder()
                    .createdByUserId(userDetails.getId())
                    .createdByEmail(userDetails.getEmail())
                    .build());
        }
        model.addAttribute("user", userDetails);
    }

    @PostMapping("/search-user")
    public String searchUser(@RequestParam("keyword") String keyword,
            @RequestParam(value = "vaultId", required = false) String vaultId,
            Model model) {
        System.out.println("=== Search User Request ===");
        System.out.println("Keyword: " + keyword);
        System.out.println("VaultId: " + vaultId);

        if (vaultId != null && !vaultId.trim().isEmpty()) {
            // Use enhanced search with membership status for vault member addition
            List<UserSuggestionResponse> matchedUsers = userService.findUsersWithMembershipStatus(keyword, vaultId);
            System.out.println("Matched users count: " + matchedUsers.size());

            for (UserSuggestionResponse user : matchedUsers) {
                System.out.println(
                        "- User: " + user.getUsername() + " (ID: " + user.getId() + ", Email: " + user.getEmail() +
                                ", IsMember: " + user.isAlreadyMember() + ", Role: " + user.getCurrentRole() + ")");
            }

            model.addAttribute("matchedUsers", matchedUsers);
        } else {
            // Use regular search for other purposes
            List<User> matchedUsers = userService.findByKeyword(keyword);
            System.out.println("Matched users count: " + matchedUsers.size());

            for (User user : matchedUsers) {
                System.out.println(
                        "- User: " + user.getUsername() + " (ID: " + user.getId() + ", Email: " + user.getEmail()
                                + ")");
            }

            model.addAttribute("matchedUsers", matchedUsers);
        }

        return "fragments/user-suggestion :: suggestionList";
    }

    @PostMapping("/edit-vault/add-member")
    public String addMemberToVault(
            @RequestParam("vaultId") String vaultId,
            @RequestParam("userId") String userId,
            @RequestParam("role") String roleName,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            // Check if user is vault owner or admin
            boolean isVaultOwner = userVaultRoleService.isVaultOwner(userDetails.getId(), vaultId);
            boolean isAdmin = "ADMIN".equals(userDetails.getSystemRoleName());

            if (!isVaultOwner && !isAdmin) {
                redirectAttributes.addFlashAttribute("toastMessage",
                        "You don't have permission to add members to this vault");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-management/edit-vault/member?id=" + vaultId;
            }

            // Validation
            if (vaultId == null || vaultId.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("toastMessage", "Vault ID is required");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-management/edit-vault/member?id=" + vaultId;
            }

            if (userId == null || userId.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("toastMessage", "User ID is required");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-management/edit-vault/member?id=" + vaultId;
            }

            if (roleName == null || roleName.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("toastMessage", "Role is required");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-management/edit-vault/member?id=" + vaultId;
            }

            System.out.println("Controller: Adding member - vaultId: " + vaultId + ", userId: " + userId
                    + ", roleName: " + roleName);

            userVaultRoleService.addMemberToVault(vaultId, userId, roleName, userDetails.getId(),
                    userDetails.getSystemRoleName());
            redirectAttributes.addFlashAttribute("toastMessage", "Member added successfully!");
            redirectAttributes.addFlashAttribute("toastType", "success");
        } catch (Exception e) {
            System.err.println("Error adding member: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("toastMessage", "Failed to add member: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
        }
        return "redirect:/vault-management/edit-vault/member?id=" + vaultId;
    }

    @PostMapping("/edit-vault/remove-member")
    public String removeMemberFromVault(
            @RequestParam("vaultId") String vaultId,
            @RequestParam("userId") String userId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            // Check if user is vault owner or admin
            boolean isVaultOwner = userVaultRoleService.isVaultOwner(userDetails.getId(), vaultId);
            boolean isAdmin = "ADMIN".equals(userDetails.getSystemRoleName());

            if (!isVaultOwner && !isAdmin) {
                redirectAttributes.addFlashAttribute("toastMessage",
                        "You don't have permission to remove members from this vault");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-management/edit-vault/member?id=" + vaultId;
            }

            userVaultRoleService.removeMemberFromVault(vaultId, userId, userDetails.getId(),
                    userDetails.getSystemRoleName());
            redirectAttributes.addFlashAttribute("toastMessage", "Member removed successfully!");
            redirectAttributes.addFlashAttribute("toastType", "success");
        } catch (Exception e) {
            System.err.println("Error removing member: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("toastMessage", "Failed to remove member: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
        }
        return "redirect:/vault-management/edit-vault/member?id=" + vaultId;
    }

    @PostMapping("/leave-vault")
    public String leaveVault(@RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            userVaultRoleService.leaveVault(vaultId, userDetails.getId());
            redirectAttributes.addFlashAttribute("successLeaveVaultMessage", "You have left the vault successfully!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Failed to leave the vault: " + e.getMessage());
        }
        return "redirect:/vault-management";
    }

    @PostMapping("/edit-vault/update-member-role")
    public String updateMemberRole(
            @RequestParam("vaultId") String vaultId,
            @RequestParam("userId") String userId,
            @RequestParam("newRole") String newRoleName,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            // Check if user is vault owner or admin
            boolean isVaultOwner = userVaultRoleService.isVaultOwner(userDetails.getId(), vaultId);
            boolean isAdmin = "ADMIN".equals(userDetails.getSystemRoleName());

            if (!isVaultOwner && !isAdmin) {
                redirectAttributes.addFlashAttribute("toastMessage",
                        "You don't have permission to update member roles in this vault");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-management/edit-vault/member?id=" + vaultId;
            }

            // Validation
            if (vaultId == null || vaultId.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("toastMessage", "Vault ID is required");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-management/edit-vault/member?id=" + vaultId;
            }

            if (userId == null || userId.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("toastMessage", "User ID is required");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-management/edit-vault/member?id=" + vaultId;
            }

            if (newRoleName == null || newRoleName.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("toastMessage", "New role is required");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-management/edit-vault/member?id=" + vaultId;
            }

            System.out.println("Controller: Updating member role - vaultId: " + vaultId + ", userId: " + userId
                    + ", newRoleName: " + newRoleName);

            userVaultRoleService.updateMemberRole(vaultId, userId, newRoleName, userDetails.getId(),
                    userDetails.getSystemRoleName());
            redirectAttributes.addFlashAttribute("toastMessage", "Member role updated successfully!");
            redirectAttributes.addFlashAttribute("toastType", "success");
        } catch (Exception e) {
            System.err.println("Error updating member role: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("toastMessage", "Failed to update member role: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
        }
        return "redirect:/vault-management/edit-vault/member?id=" + vaultId;
    }

    @PostMapping("/upload-avatar")
    public Object uploadAvatar(@RequestParam("avatar") MultipartFile avatarFile,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestHeader(value = "Accept", required = false) String acceptHeader,
            RedirectAttributes redirectAttributes) {
        try {
            User updatedUser = userService.updateUserAvatar(userDetails.getId(), avatarFile);

            if (acceptHeader != null && acceptHeader.contains("application/json")) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Avatar updated successfully!");
                response.put("avatarUrl", updatedUser.getAvatar());
                response.put("timestamp", System.currentTimeMillis());
                return ResponseEntity.ok().body(response);
            } else {
                redirectAttributes.addFlashAttribute("successMessage", "Avatar updated successfully!");
                return "redirect:/vault-management";
            }
        } catch (Exception e) {
            if (acceptHeader != null && acceptHeader.contains("application/json")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Failed to update avatar: " + e.getMessage()));
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Failed to update avatar: " + e.getMessage());
                return "redirect:/vault-management";
            }
        }
    }

    @PostMapping("/delete-account")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteAccount(
            @RequestParam("email") String confirmationEmail,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest request,
            HttpServletResponse response) {
        Map<String, Object> responseMap = new HashMap<>();

        try {
            if (!userDetails.getEmail().equals(confirmationEmail)) {
                responseMap.put("success", false);
                responseMap.put("error", "Email confirmation does not match your account email");
                return ResponseEntity.badRequest().body(responseMap);
            }

            userService.softDeleteUserAccount(userDetails.getId(), confirmationEmail);

            clearUserSession(request, response);

            responseMap.put("success", true);
            responseMap.put("message", "Account deleted successfully");
            responseMap.put("redirectUrl", "/auth/log-out");
            return ResponseEntity.ok(responseMap);

        } catch (IllegalArgumentException e) {
            responseMap.put("success", false);
            responseMap.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(responseMap);
        } catch (IllegalStateException e) {
            responseMap.put("success", false);
            responseMap.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(responseMap);
        } catch (Exception e) {
            responseMap.put("success", false);
            responseMap.put("error", "An error occurred while deleting the account: " + e.getMessage());
            return ResponseEntity.status(500).body(responseMap);
        }
    }

    @GetMapping("/delete-account-logout")
    public String deleteAccountLogout(HttpServletRequest request, HttpServletResponse response) {
        SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();
        logoutHandler.logout(request, response, SecurityContextHolder.getContext().getAuthentication());
        SecurityContextHolder.clearContext();

        return "redirect:/";
    }

    private void clearUserSession(HttpServletRequest request, HttpServletResponse response) {
        SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();
        logoutHandler.logout(request, response, SecurityContextHolder.getContext().getAuthentication());

        SecurityContextHolder.clearContext();

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                Cookie clearCookie = new Cookie(cookie.getName(), null);
                clearCookie.setPath("/");
                clearCookie.setMaxAge(0);
                clearCookie.setHttpOnly(true);
                clearCookie.setSecure(false);
                response.addCookie(clearCookie);
            }
        }

        String[] authCookieNames = { "JSESSIONID", "JWT", "jwt", "auth-token", "authToken", "remember-me" };
        for (String cookieName : authCookieNames) {
            Cookie clearCookie = new Cookie(cookieName, null);
            clearCookie.setPath("/");
            clearCookie.setMaxAge(0);
            clearCookie.setHttpOnly(true);
            clearCookie.setSecure(false);
            response.addCookie(clearCookie);
        }

        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");
    }
}
