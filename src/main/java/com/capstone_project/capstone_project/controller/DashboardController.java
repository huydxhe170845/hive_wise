package com.capstone_project.capstone_project.controller;

import com.capstone_project.capstone_project.model.SystemRole;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.dto.response.VaultDashboardResponse;
import com.capstone_project.capstone_project.service.UserService;
import com.capstone_project.capstone_project.service.VaultService;
import com.capstone_project.capstone_project.service.KnowledgeItemService;
import com.capstone_project.capstone_project.service.KnowledgeViewService;
import com.capstone_project.capstone_project.service.KnowledgeAnalyticsService;
import com.capstone_project.capstone_project.dto.request.AddVaultRequest;
import com.capstone_project.capstone_project.exception.FieldValidationException;
import com.capstone_project.capstone_project.security.CustomUserDetails;
import com.capstone_project.capstone_project.model.Vault;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.context.SecurityContextHolder;

@Controller
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DashboardController {

    UserService userService;
    VaultService vaultService;
    KnowledgeItemService knowledgeItemService;
    KnowledgeViewService knowledgeViewService;
    KnowledgeAnalyticsService knowledgeAnalyticsService;

    @GetMapping
    public String dashboard(
            @RequestParam(value = "keyword", required = false) String keyword,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            Model model) {

        if (userDetails != null) {
            model.addAttribute("currentAdminId", userDetails.getId());
            model.addAttribute("currentAdminName",
                    userDetails.getName() != null ? userDetails.getName() : userDetails.getUsername());
            model.addAttribute("currentAdminEmail", userDetails.getEmail());
            model.addAttribute("currentAdminAvatar", userDetails.getAvatar());
            // Handle first name and last name from full name
            String fullName = userDetails.getName() != null ? userDetails.getName() : userDetails.getUsername();
            String[] nameParts = fullName.split(" ");
            String firstName = nameParts.length > 0 ? nameParts[0] : "";
            String lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

            // Ensure firstName is not empty, use first character of username if needed
            if (firstName == null || firstName.trim().isEmpty()) {
                String username = userDetails.getUsername();
                firstName = username != null && !username.trim().isEmpty() ? username.substring(0, 1).toUpperCase()
                        : "U";
            }

            model.addAttribute("currentAdminFirstName", firstName);
            model.addAttribute("currentAdminLastName", lastName);
            model.addAttribute("currentAdminSystemRole", userDetails.getSystemRoleName());
        }

        // Load initial data (first page) for display
        Page<User> userPage;
        if (keyword != null && !keyword.trim().isEmpty()) {
            userPage = userService.findByKeywordPaginated(keyword.trim(), 0, 10);
        } else {
            userPage = userService.getAllUsersPaginated(0, 10);
        }

        model.addAttribute("users", userPage.getContent());
        model.addAttribute("currentPage", 0);
        model.addAttribute("totalPages", userPage.getTotalPages());
        model.addAttribute("totalElements", userPage.getTotalElements());
        model.addAttribute("size", 10);
        model.addAttribute("keyword", keyword);
        model.addAttribute("totalAccounts", userService.getTotalAccounts());
        model.addAttribute("activeAccounts", userService.getActiveAccounts());
        model.addAttribute("inactiveAccounts", userService.getInactiveAccounts());
        model.addAttribute("pendingRequests", userService.getPendingRequests());
        List<SystemRole> allRoles = userService.getAllRoles();
        model.addAttribute("allRoles", allRoles);

        List<VaultDashboardResponse> allVaults = vaultService.getAllVaultsForDashboard();
        model.addAttribute("vaults", allVaults);
        model.addAttribute("totalVaults", vaultService.getTotalVaults());
        model.addAttribute("activeVaults", vaultService.getActiveVaults());
        model.addAttribute("totalDocuments", vaultService.getTotalDocuments());
        model.addAttribute("storageUsed", "67.8GB");

        model.addAttribute("visitsToday", userService.getTotalVisitsToday());
        model.addAttribute("visitsThisMonth", userService.getTotalVisitsThisMonth());
        model.addAttribute("averageVisitsPerDay", userService.getAverageVisitsPerDay());
        model.addAttribute("uniqueVisitorsToday", userService.getUniqueVisitorsToday());
        model.addAttribute("uniqueVisitorsThisMonth", userService.getUniqueVisitorsThisMonth());
        model.addAttribute("knowledgeCreatedToday", knowledgeItemService.getKnowledgeCreatedToday());
        model.addAttribute("knowledgeCreatedThisMonth", knowledgeItemService.getKnowledgeCreatedThisMonth());

        model.addAttribute("knowledgeViewsToday", knowledgeViewService.getTotalViewsToday());
        model.addAttribute("knowledgeViewsThisMonth", knowledgeViewService.getTotalViewsThisMonth());
        model.addAttribute("uniqueViewersToday", knowledgeViewService.getUniqueViewersToday());
        model.addAttribute("engagementRate", knowledgeViewService.getEngagementRate());
        model.addAttribute("totalInteractions", knowledgeViewService.getTotalInteractions());
        model.addAttribute("interactionsToday", knowledgeViewService.getInteractionsToday());

        model.addAttribute("knowledgeStatusDistribution", knowledgeItemService.getKnowledgeStatusDistribution());

        model.addAttribute("dailyVisitsLast7Days", userService.getDailyVisitsLast7Days());
        model.addAttribute("dailyKnowledgeViewsLast7Days", knowledgeViewService.getDailyKnowledgeViewsLast7Days());
        model.addAttribute("dailyKnowledgeCreationLast7Days",
                knowledgeItemService.getDailyKnowledgeCreationLast7Days());

        List<Long> dailyViews = knowledgeViewService.getDailyKnowledgeViewsLast7Days();
        List<Long> dailyVisits = userService.getDailyVisitsLast7Days();
        List<Double> dailyEngagementRates = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            long views = dailyViews.get(i);
            long visits = dailyVisits.get(i);
            double rate = visits > 0 ? (double) views / visits * 100 : 0.0;
            dailyEngagementRates.add(rate);
        }
        model.addAttribute("dailyEngagementRatesLast7Days", dailyEngagementRates);

        // Top performers data
        model.addAttribute("topBuilders", userService.getTopBuilders());
        model.addAttribute("topVaults", vaultService.getTopVaults());
        model.addAttribute("topKnowledge", knowledgeItemService.getTopKnowledge());

        // Add knowledge analytics data
        Map<String, Object> knowledgeAnalytics = knowledgeAnalyticsService.getKnowledgeAnalytics();
        model.addAttribute("knowledgeAnalytics", knowledgeAnalytics);

        return "dashboard";
    }

    @PostMapping("/admin/register")
    public ResponseEntity<?> registerAccount(
            @RequestParam("username") String username,
            @RequestParam("email") String email,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam("department") String department,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "dateOfBirth", required = false) String dateOfBirth,
            @RequestParam("systemRole") String systemRole,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar,
            @RequestParam(value = "isActivated", defaultValue = "false") boolean isActivated,
            @RequestParam(value = "sendWelcomeEmail", defaultValue = "false") boolean sendWelcomeEmail) {

        try {
            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Username is required"));
            }

            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Email is required"));
            }

            // Password is now optional
            if (password != null && !password.trim().isEmpty()) {
                // Validate password if provided
                if (password.length() < 8) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "Password must be at least 8 characters long"));
                }

                // Check for at least one uppercase, lowercase, number and special character
                String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&].*$";
                if (!password.matches(passwordRegex)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message",
                                    "Password must contain at least one uppercase, lowercase, number and special character"));
                }
            }

            if (systemRole == null || systemRole.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "System role is required"));
            }

            if (department == null || department.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Department is required"));
            }

            User newUser = userService.createAdminUserAccount(
                    username.trim(),
                    email.trim(),
                    password,
                    name != null ? name.trim() : null,
                    phoneNumber != null ? phoneNumber.trim() : null,
                    department != null ? department.trim() : null,
                    gender != null ? gender.trim() : null,
                    dateOfBirth != null ? dateOfBirth.trim() : null,
                    systemRole.trim(),
                    avatar,
                    isActivated,
                    false); // Don't send email in main transaction

            // Handle side effects in separate transactions
            try {
                userService.sendWelcomeEmailForUser(email.trim(), username.trim(),
                        name != null ? name.trim() : null, password, sendWelcomeEmail);
            } catch (Exception e) {
                System.err.println("Failed to send welcome email: " + e.getMessage());
            }

            try {
                userService.createAdminNotificationForUser(newUser);
            } catch (Exception e) {
                System.err.println("Failed to create admin notification: " + e.getMessage());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Account created successfully!");
            response.put("userId", newUser.getId());
            response.put("username", newUser.getUsername());
            response.put("email", newUser.getEmail());
            response.put("isActivated", newUser.isActivated());

            response.put("totalAccounts", userService.getTotalAccounts());
            response.put("activeAccounts", userService.getActiveAccounts());
            response.put("inactiveAccounts", userService.getInactiveAccounts());
            response.put("pendingRequests", userService.getPendingRequests());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));

        } catch (Exception e) {
            // Check if it's a duplicate key error
            String errorMessage = e.getMessage();
            if (errorMessage != null && errorMessage.contains("Duplicate entry")) {
                if (errorMessage.contains("users.email")) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "A user with this email address already exists"));
                } else if (errorMessage.contains("users.username")) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "A user with this username already exists"));
                }
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Internal server error: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserForEdit(@PathVariable String userId) {
        try {
            User user = userService.findById(userId);
            if (user == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "User not found"));
            }

            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("username", user.getUsername());
            userData.put("email", user.getEmail());
            userData.put("name", user.getName());
            userData.put("phoneNumber", user.getPhoneNumber());
            userData.put("department", user.getDepartment());
            userData.put("gender", user.getGender());
            userData.put("dateOfBirth", user.getDateOfBirth() != null ? user.getDateOfBirth().toString() : null);
            userData.put("roleName", user.getSystemRole() != null ? user.getSystemRole().getName() : null);
            userData.put("activated", user.isActivated());
            userData.put("avatar", user.getAvatar());

            return ResponseEntity.ok(userData);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error loading user: " + e.getMessage()));
        }
    }

    @PostMapping("/admin/toggle-user-status")
    public ResponseEntity<?> toggleUserStatus(
            @RequestParam("userId") String userId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        System.out.println(
                "Authentication check - userDetails: " + (userDetails != null ? userDetails.getUsername() : "null"));
        if (userDetails != null) {
            System.out.println("User role: " + userDetails.getAuthorities());
        }

        try {
            System.out.println("Toggle user status called for userId: " + userId);

            // Validate required fields
            if (userId == null || userId.trim().isEmpty()) {
                System.out.println("User ID is null or empty");
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "User ID is required"));
            }

            // Get existing user
            User existingUser = userService.findById(userId.trim());
            if (existingUser == null) {
                System.out.println("User not found with ID: " + userId);
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "User not found"));
            }

            System.out.println("Current user status: " + existingUser.isActivated());

            // Toggle user status
            boolean newStatus = !existingUser.isActivated();
            System.out.println("New status will be: " + newStatus);

            User updatedUser = userService.updateUserActivationStatus(userId.trim(), newStatus);
            System.out.println("User updated successfully. New status: " + updatedUser.isActivated());

            // Prepare success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User status updated successfully!");
            response.put("userId", updatedUser.getId());
            response.put("isActivated", updatedUser.isActivated());
            response.put("username", updatedUser.getUsername());
            response.put("email", updatedUser.getEmail());
            response.put("name", updatedUser.getName());

            // Update statistics
            response.put("totalAccounts", userService.getTotalAccounts());
            response.put("activeAccounts", userService.getActiveAccounts());
            response.put("inactiveAccounts", userService.getInactiveAccounts());
            response.put("pendingRequests", userService.getPendingRequests());

            System.out.println("Response prepared successfully");
            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            System.out.println("IllegalArgumentException: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            System.out.println("Exception occurred: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Internal server error: " + e.getMessage()));
        }
    }

    @PostMapping("/admin/edit")
    public ResponseEntity<?> editUserAccount(
            @RequestParam("userId") String userId,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "phoneNumber", required = false) String phoneNumber,
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "dateOfBirth", required = false) String dateOfBirth,
            @RequestParam(value = "systemRole", required = false) String systemRole,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar,
            @RequestParam(value = "isActivated", defaultValue = "false") boolean isActivated) {

        try {
            // Validate required fields
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "User ID is required"));
            }

            // Get existing user
            User existingUser = userService.findById(userId.trim());
            if (existingUser == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "User not found"));
            }

            // Check if username already exists (if different from current)
            if (username != null && !username.trim().isEmpty() &&
                    !username.trim().equals(existingUser.getUsername())) {
                if (userService.existsByUsername(username.trim())) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "Username already exists"));
                }
            }

            // Check if email already exists (if different from current)
            if (email != null && !email.trim().isEmpty() &&
                    !email.trim().equals(existingUser.getEmail())) {
                if (userService.existsByEmail(email.trim())) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "Email already exists"));
                }
            }

            // Update user account
            User updatedUser = userService.updateAdminUserAccount(
                    userId.trim(),
                    username != null ? username.trim() : null,
                    email != null ? email.trim() : null,
                    name != null ? name.trim() : null,
                    phoneNumber != null ? phoneNumber.trim() : null,
                    department != null ? department.trim() : null,
                    gender != null ? gender.trim() : null,
                    dateOfBirth != null ? dateOfBirth.trim() : null,
                    systemRole != null ? systemRole.trim() : null,
                    avatar,
                    isActivated);

            // Prepare success response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User updated successfully!");
            response.put("userId", updatedUser.getId());
            response.put("username", updatedUser.getUsername());
            response.put("email", updatedUser.getEmail());
            response.put("name", updatedUser.getName());
            response.put("phoneNumber", updatedUser.getPhoneNumber());
            response.put("department", updatedUser.getDepartment());
            response.put("gender", updatedUser.getGender());
            response.put("dateOfBirth",
                    updatedUser.getDateOfBirth() != null ? updatedUser.getDateOfBirth().toString() : null);
            response.put("isActivated", updatedUser.isActivated());
            response.put("role", updatedUser.getSystemRole() != null ? updatedUser.getSystemRole().getName() : null);
            response.put("avatar", updatedUser.getAvatar());

            // Update statistics
            response.put("totalAccounts", userService.getTotalAccounts());
            response.put("activeAccounts", userService.getActiveAccounts());
            response.put("inactiveAccounts", userService.getInactiveAccounts());
            response.put("pendingRequests", userService.getPendingRequests());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Internal server error: " + e.getMessage()));
        }
    }

    @GetMapping("/admin/users")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getUsersForVaultOwner() {
        try {
            List<User> users = userService.getAllUsers();
            List<Map<String, Object>> userList = new ArrayList<>();

            for (User user : users) {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("username", user.getUsername());
                userMap.put("name", user.getName());
                userMap.put("email", user.getEmail());
                userMap.put("avatar", user.getAvatar());
                userMap.put("roleName", user.getSystemRole() != null ? user.getSystemRole().getName() : "USER");
                userList.add(userMap);
            }

            return ResponseEntity.ok(userList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/admin/users/paginated")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getUsersPaginated(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "keyword", required = false) String keyword) {
        try {
            System.out.println("Loading users - page: " + page + ", size: " + size + ", keyword: " + keyword);

            Page<User> userPage;
            if (keyword != null && !keyword.trim().isEmpty()) {
                userPage = userService.findByKeywordPaginated(keyword.trim(), page, size);
            } else {
                userPage = userService.getAllUsersPaginated(page, size);
            }

            List<Map<String, Object>> userList = new ArrayList<>();
            for (User user : userPage.getContent()) {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("username", user.getUsername());
                userMap.put("name", user.getName());
                userMap.put("email", user.getEmail());
                userMap.put("phoneNumber", user.getPhoneNumber());
                userMap.put("avatar", user.getAvatar());
                userMap.put("isActivated", user.isActivated());
                userMap.put("authProvider", user.getAuthProvider());
                userMap.put("systemRole", user.getSystemRole() != null ? user.getSystemRole().getName() : null);
                userMap.put("createdAt", user.getCreatedAt());
                userList.add(userMap);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("users", userList);
            response.put("currentPage", page);
            response.put("totalPages", userPage.getTotalPages());
            response.put("totalElements", userPage.getTotalElements());
            response.put("size", size);
            response.put("keyword", keyword);

            System.out.println(
                    "Response - users count: " + userList.size() + ", total pages: " + userPage.getTotalPages());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error in getUsersPaginated: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/vaults")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getVaults() {
        try {
            List<VaultDashboardResponse> vaults = vaultService.getAllVaultsForDashboard();
            List<Map<String, Object>> vaultList = new ArrayList<>();

            for (VaultDashboardResponse vault : vaults) {
                Map<String, Object> vaultMap = new HashMap<>();
                vaultMap.put("id", vault.getId());
                vaultMap.put("name", vault.getName());
                vaultMap.put("ownerName", vault.getOwnerName());
                vaultMap.put("memberCount", vault.getMemberCount());
                vaultMap.put("status", vault.getStatus());
                vaultMap.put("statusBadgeClass", vault.getStatusBadgeClass());
                vaultMap.put("isActivated", vault.getIsActivated());
                vaultMap.put("isDeleted", vault.getIsDeleted());
                vaultMap.put("createdAt", vault.getCreatedAt());
                vaultMap.put("documentCount", vault.getDocumentCount());
                vaultMap.put("iconColorClass", vault.getIconColorClass());
                vaultList.add(vaultMap);
            }

            return ResponseEntity.ok(vaultList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/my-vaults")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getMyVaults(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<VaultDashboardResponse> vaults = vaultService.getVaultsByUserId(userDetails.getId());
            List<Map<String, Object>> vaultList = new ArrayList<>();

            for (VaultDashboardResponse vault : vaults) {
                Map<String, Object> vaultMap = new HashMap<>();
                vaultMap.put("id", vault.getId());
                vaultMap.put("name", vault.getName());
                vaultMap.put("ownerName", vault.getOwnerName());
                vaultMap.put("memberCount", vault.getMemberCount());
                vaultMap.put("status", vault.getStatus());
                vaultMap.put("statusBadgeClass", vault.getStatusBadgeClass());
                vaultMap.put("createdAt", vault.getCreatedAt());
                vaultMap.put("documentCount", vault.getDocumentCount());
                vaultMap.put("iconColorClass", vault.getIconColorClass());
                vaultList.add(vaultMap);
            }

            return ResponseEntity.ok(vaultList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/toggle-vault-status")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleVaultStatus(
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            // Check if user is admin
            if (!"ADMIN".equals(userDetails.getSystemRoleName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "Unauthorized access"));
            }

            Vault vault = vaultService.getVaultDetailById(vaultId);
            if (vault == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Vault not found"));
            }

            // Toggle vault status
            boolean newStatus = !vault.isActivated();
            vaultService.updateVaultStatus(vaultId, newStatus);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("newStatus", newStatus);
            response.put("statusText", newStatus ? "Active" : "Inactive");
            response.put("statusBadgeClass", newStatus ? "badge-success" : "badge-danger");
            response.put("message", "Vault status updated successfully");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error updating vault status: " + e.getMessage()));
        }
    }

    @GetMapping("/trash-vaults")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getTrashVaults(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<VaultDashboardResponse> vaults = vaultService.getTrashVaultsByUserId(userDetails.getId());
            List<Map<String, Object>> vaultList = new ArrayList<>();

            for (VaultDashboardResponse vault : vaults) {
                Map<String, Object> vaultMap = new HashMap<>();
                vaultMap.put("id", vault.getId());
                vaultMap.put("name", vault.getName());
                vaultMap.put("ownerName", vault.getOwnerName());
                vaultMap.put("memberCount", vault.getMemberCount());
                vaultMap.put("status", vault.getStatus());
                vaultMap.put("statusBadgeClass", vault.getStatusBadgeClass());
                vaultMap.put("createdAt", vault.getCreatedAt());
                vaultMap.put("documentCount", vault.getDocumentCount());
                vaultMap.put("iconColorClass", vault.getIconColorClass());
                vaultMap.put("deactivatedAt", vault.getDeactivatedAt());
                vaultList.add(vaultMap);
            }

            return ResponseEntity.ok(vaultList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/admin/restore-vault")
    public ResponseEntity<?> restoreVaultFromAdmin(
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        try {
            if (userDetails == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "User not authenticated"));
            }

            // Check if user is vault owner
            Vault vault = vaultService.getVaultDetailById(vaultId);
            if (vault == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Vault not found"));
            }

            // Only vault owner can restore their vault
            if (!vault.getCreatedByUserId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "You can only restore your own vaults"));
            }

            // Restore the vault
            vaultService.restoreVault(vaultId, userDetails.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Vault restored successfully!");

            // Update statistics
            response.put("totalVaults", vaultService.getTotalVaults());
            response.put("activeVaults", vaultService.getActiveVaults());
            response.put("totalDocuments", vaultService.getTotalDocuments());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error restoring vault: " + e.getMessage()));
        }
    }

    @PostMapping("/admin/permanently-delete-vault")
    public ResponseEntity<?> permanentlyDeleteVaultFromAdmin(
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        try {
            if (userDetails == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "User not authenticated"));
            }

            // Check if user is vault owner
            Vault vault = vaultService.getVaultDetailById(vaultId);
            if (vault == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Vault not found"));
            }

            // Only vault owner can permanently delete their vault
            if (!vault.getCreatedByUserId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "You can only permanently delete your own vaults"));
            }

            // Permanently delete the vault
            vaultService.deletePermanentVault(vaultId, userDetails.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Vault permanently deleted!");

            // Update statistics
            response.put("totalVaults", vaultService.getTotalVaults());
            response.put("activeVaults", vaultService.getActiveVaults());
            response.put("totalDocuments", vaultService.getTotalDocuments());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error permanently deleting vault: " + e.getMessage()));
        }
    }

    @PostMapping("/admin/delete-vault")
    public ResponseEntity<?> deleteVaultFromAdmin(
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        try {
            if (userDetails == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "User not authenticated"));
            }

            // Check if user is vault owner or admin
            Vault vault = vaultService.getVaultDetailById(vaultId);
            if (vault == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Vault not found"));
            }

            // Only vault owner can delete their vault
            if (!vault.getCreatedByUserId().equals(userDetails.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("success", false, "message", "You can only delete your own vaults"));
            }

            // Soft delete the vault (move to trash)
            vaultService.deleteVault(vaultId, userDetails.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Vault moved to trash successfully!");

            // Update statistics
            response.put("totalVaults", vaultService.getTotalVaults());
            response.put("activeVaults", vaultService.getActiveVaults());
            response.put("totalDocuments", vaultService.getTotalDocuments());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error deleting vault: " + e.getMessage()));
        }
    }

    @GetMapping("/test-user-creation")
    public ResponseEntity<?> testUserCreation() {
        try {
            // Test data
            String testEmail = "test" + System.currentTimeMillis() + "@example.com";
            String testUsername = "testuser" + System.currentTimeMillis();

            User newUser = userService.createAdminUserAccount(
                    testUsername,
                    testEmail,
                    "TestPass123!",
                    "Test User",
                    "1234567890",
                    "IT",
                    "Male",
                    "1990-01-01",
                    "USER",
                    null,
                    true,
                    false);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Test user created successfully",
                    "userId", newUser.getId(),
                    "email", newUser.getEmail(),
                    "username", newUser.getUsername()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Test failed: " + e.getMessage()));
        }
    }

    @PostMapping("/admin/add-vault")
    public ResponseEntity<?> addVaultFromAdmin(
            @RequestParam("name") String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("createdByUserId") String createdByUserId,
            @RequestParam("createdByEmail") String createdByEmail,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {

        System.out.println("=== Add Vault Request ===");
        System.out.println("Name: " + name);
        System.out.println("Description: " + description);
        System.out.println("CreatedByUserId: " + createdByUserId);
        System.out.println("CreatedByEmail: " + createdByEmail);
        System.out.println("Photo: " + (photo != null ? photo.getOriginalFilename() : "null"));

        try {
            if (name == null || name.trim().isEmpty()) {
                System.out.println("Error: Vault name is required");
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Vault name is required"));
            }

            if (createdByUserId == null || createdByUserId.trim().isEmpty()) {
                System.out.println("Error: Vault owner is required");
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Vault owner is required"));
            }

            if (createdByEmail == null || createdByEmail.trim().isEmpty()) {
                System.out.println("Error: Owner email is required");
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Owner email is required"));
            }

            AddVaultRequest request = AddVaultRequest.builder()
                    .name(name.trim())
                    .description(description != null ? description.trim() : "")
                    .createdByUserId(createdByUserId.trim())
                    .createdByEmail(createdByEmail.trim())
                    .photo(photo)
                    .build();

            System.out.println("Calling vaultService.addVault...");
            Vault createdVault = vaultService.addVault(request, createdByUserId);
            System.out.println("Vault created successfully!");

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Vault created successfully!");
            response.put("vaultId", createdVault.getId());
            response.put("vaultName", createdVault.getName());

            response.put("totalVaults", vaultService.getTotalVaults());
            response.put("activeVaults", vaultService.getActiveVaults());
            response.put("totalDocuments", vaultService.getTotalDocuments());

            System.out.println("Response: " + response);
            return ResponseEntity.ok(response);

        } catch (FieldValidationException e) {
            System.out.println("FieldValidationException: " + e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));

        } catch (Exception e) {
            System.out.println("Exception: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Internal server error: " + e.getMessage()));
        }
    }

    @PostMapping("/update-profile")
    @ResponseBody
    public ResponseEntity<?> updateProfile(
            @RequestParam("username") String username,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "dob", required = false) String dob,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        try {
            if (userDetails == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "User not authenticated"));
            }

            // Update user profile using existing updateUser method
            User updatedUser = userService.updateUser(
                    userDetails.getId(),
                    username, // username
                    username, // name (using username as name for now)
                    phone, // phoneNumber
                    null, // activated (keep current)
                    null, // roleId (keep current)
                    null // avatarFile (keep current)
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Profile updated successfully");
            response.put("username", updatedUser.getName());
            response.put("phone", updatedUser.getPhoneNumber());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to update profile: " + e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public String logout(HttpServletRequest request, HttpServletResponse response) {
        performLogout(request, response);
        return "redirect:/auth/log-in";
    }

    @GetMapping("/logout")
    public String logoutGet(HttpServletRequest request, HttpServletResponse response) {
        performLogout(request, response);
        return "redirect:/auth/log-in";
    }

    private void performLogout(HttpServletRequest request, HttpServletResponse response) {
        // Clear JWT token cookie
        Cookie jwtCookie = new Cookie("jwtToken", null);
        jwtCookie.setMaxAge(0);
        jwtCookie.setPath("/");
        response.addCookie(jwtCookie);

        // Clear remembered username cookie
        Cookie usernameCookie = new Cookie("rememberedUsername", null);
        usernameCookie.setMaxAge(0);
        usernameCookie.setPath("/");
        response.addCookie(usernameCookie);

        // Clear session
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        // Clear security context
        SecurityContextHolder.clearContext();
    }
}