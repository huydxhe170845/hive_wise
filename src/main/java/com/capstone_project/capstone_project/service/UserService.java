package com.capstone_project.capstone_project.service;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.capstone_project.capstone_project.model.SystemRole;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.repository.SystemRoleRepository;
import com.capstone_project.capstone_project.repository.UserRepository;
import com.capstone_project.capstone_project.repository.VerificationTokenRepository;
import com.capstone_project.capstone_project.repository.KnowledgeItemRepository;
import com.capstone_project.capstone_project.dto.response.UserDTO;
import com.capstone_project.capstone_project.dto.response.TopBuilderResponse;
import com.capstone_project.capstone_project.dto.response.UserSuggestionResponse;
import com.capstone_project.capstone_project.util.RoleFormatter;
import com.capstone_project.capstone_project.enums.AuthProvider;
import com.capstone_project.capstone_project.enums.PurposeToken;
import org.springframework.context.ApplicationContext;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.criteria.Predicate;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;
import java.nio.file.*;
import java.util.UUID;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Service
public class UserService {

    UserRepository userRepository;
    SystemRoleRepository systemRoleRepository;
    EmailService emailService;
    NotificationService notificationService;
    VerificationTokenRepository verificationTokenRepository;
    VisitService visitService;
    KnowledgeItemRepository knowledgeItemRepository;
    ApplicationContext applicationContext;

    public List<User> findByKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllUsers();
        }
        return userRepository.findByKeyword(keyword);
    }

    public Page<User> findByKeywordPaginated(String keyword, int page, int size) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllUsersPaginated(page, size);
        }
        Pageable pageable = PageRequest.of(page, size);
        return userRepository.findByKeywordPaginated(keyword, pageable);
    }

    public Page<User> getAllUsersPaginated(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return userRepository.findAll(pageable);
    }

    public List<User> findAvailableUsersForVault(String keyword, String vaultId) {
        List<User> allUsers;
        if (keyword == null || keyword.trim().isEmpty()) {
            allUsers = getAllUsers();
        } else {
            allUsers = userRepository.findByKeyword(keyword);
        }

        // Filter out vault owners and admins
        return allUsers.stream()
                .filter(user -> {
                    // Exclude users with ADMIN system role
                    if (user.getSystemRole() != null && "ADMIN".equals(user.getSystemRole().getName())) {
                        return false;
                    }

                    // Exclude the actual vault owner of this specific vault
                    if (isVaultOwner(user.getId(), vaultId)) {
                        return false;
                    }

                    return true;
                })
                .collect(Collectors.toList());
    }

    public List<UserSuggestionResponse> findUsersWithMembershipStatus(String keyword, String vaultId) {
        List<User> allUsers;
        if (keyword == null || keyword.trim().isEmpty()) {
            allUsers = getAllUsers();
        } else {
            allUsers = userRepository.findByKeyword(keyword);
        }

        UserVaultRoleService userVaultRoleService = applicationContext.getBean(UserVaultRoleService.class);

        return allUsers.stream()
                .filter(user -> {
                    // Exclude users with ADMIN system role
                    if (user.getSystemRole() != null && "ADMIN".equals(user.getSystemRole().getName())) {
                        return false;
                    }
                    return true;
                })
                .map(user -> {
                    String currentRole = userVaultRoleService.getRoleInVault(user.getId(), vaultId);
                    boolean isAlreadyMember = currentRole != null;

                    return UserSuggestionResponse.builder()
                            .id(user.getId())
                            .username(user.getUsername())
                            .email(user.getEmail())
                            .avatar(user.getAvatar())
                            .isAlreadyMember(isAlreadyMember)
                            .currentRole(currentRole)
                            .formattedCurrentRole(RoleFormatter.formatRoleName(currentRole))
                            .build();
                })
                .collect(Collectors.toList());
    }

    private boolean isVaultOwner(String userId, String vaultId) {
        try {
            UserVaultRoleService userVaultRoleService = applicationContext.getBean(UserVaultRoleService.class);
            return userVaultRoleService.isVaultOwner(userId, vaultId);
        } catch (Exception e) {
            System.out.println("Could not check vault owner for user: " + userId + " in vault: " + vaultId);
            return false;
        }
    }

    public List<User> getAllUsers() {
        return StreamSupport.stream(userRepository.findAll().spliterator(), false)
                .collect(Collectors.toList());
    }

    public long getTotalAccounts() {
        return userRepository.count();
    }

    public long getActiveAccounts() {
        return userRepository.countUsersByActivationStatus(1);
    }

    public long getInactiveAccounts() {
        return userRepository.countUsersByActivationStatus(0);
    }

    public long getPendingRequests() {
        return verificationTokenRepository.countPendingTokensByPurpose(LocalDateTime.now(), PurposeToken.ACTIVATION);
    }

    // Dashboard Analytics Methods - using real visit tracking
    public long getTotalVisitsToday() {
        return visitService.getTotalVisitsToday();
    }

    public long getTotalVisitsThisMonth() {
        return visitService.getTotalVisitsThisMonth();
    }

    public double getAverageVisitsPerDay() {
        return visitService.getAverageVisitsPerDay();
    }

    public long getUniqueVisitorsToday() {
        return visitService.getUniqueVisitorsToday();
    }

    public long getUniqueVisitorsThisMonth() {
        return visitService.getUniqueVisitorsThisMonth();
    }

    public List<Long> getDailyVisitsLast7Days() {
        return visitService.getDailyVisitsLast7Days();
    }

    public User findById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public void updateUserRole(String userId, Integer roleId) {
        User user = findById(userId);
        SystemRole newRole = systemRoleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));
        user.setSystemRole(newRole);
        userRepository.save(user);
    }

    public List<SystemRole> getAllRoles() {
        return (List<SystemRole>) systemRoleRepository.findAll();
    }

    public void updateUserStatus(String userId, boolean isActivated) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setActivated(isActivated);
        userRepository.save(user);
    }

    public UserDTO findDTOById(String id) {
        User user = findById(id);
        String roleName = (user.getSystemRole() != null) ? user.getSystemRole().getName() : "Chưa có";

        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .activated(user.isActivated())
                .roleName(roleName)
                .roleId((user.getSystemRole() != null) ? user.getSystemRole().getId() : null)
                .avatar(user.getAvatar())
                .build();
    }

    public Page<User> findPaginatedAndFiltered(String keyword, Integer roleId, Boolean status, int pageNo,
            int pageSize) {
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize);

        Specification<User> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (keyword != null && !keyword.trim().isEmpty()) {
                String keywordPattern = "%" + keyword.toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("username")), keywordPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), keywordPattern),
                        criteriaBuilder.like(root.get("phoneNumber"), "%" + keyword + "%")));
            }
            if (roleId != null) {
                predicates.add(criteriaBuilder.equal(root.get("systemRole").get("id"), roleId));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("isActivated"), status));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return userRepository.findAll(spec, pageable);
    }

    public User addUserAccount(String email, Integer roleId, boolean activated) {
        SystemRole selectedRole = systemRoleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found with ID: " + roleId));
        User newUser = User.builder()
                .email(email)
                .systemRole(selectedRole)
                .isActivated(true)
                .authProvider(AuthProvider.GOOGLE)
                .build();
        User savedUser = userRepository.save(newUser);
        if (newUser != null) {
            try {
                emailService.sendRegitrationSuccessEmail(email);
            } catch (Exception e) {
                throw new RuntimeException("Failed to send registration success email.", e);
            }
        }
        return savedUser;
    }

    public User updateUser(
            String userId,
            String username,
            String name,
            String phoneNumber,
            Boolean activated,
            Integer roleId,
            MultipartFile avatarFile) {
        User user = findById(userId);
        if (username != null && !username.equals(user.getUsername())) {
            // Kiểm tra username đã tồn tại ở user khác chưa
            User existingUser = userRepository.findByUsername(username).orElse(null);
            if (existingUser != null && !existingUser.getId().equals(userId)) {
                throw new RuntimeException("Username đã tồn tại trong hệ thống.");
            }
            user.setUsername(username);
        }
        if (name != null && !name.equals(user.getName())) {
            user.setName(name);
        }
        if (phoneNumber != null && !phoneNumber.equals(user.getPhoneNumber())) {
            user.setPhoneNumber(phoneNumber);
        }
        if (activated != null && activated != user.isActivated()) {
            user.setActivated(activated);
        }
        if (roleId != null) {
            if (user.getSystemRole() == null || !roleId.equals(user.getSystemRole().getId())) {
                SystemRole newRole = systemRoleRepository.findById(roleId)
                        .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));
                user.setSystemRole(newRole);
            }
        }
        if (avatarFile != null && !avatarFile.isEmpty()) {
            String originalFileName = avatarFile.getOriginalFilename();
            if (originalFileName != null) {
                originalFileName = StringUtils.cleanPath(originalFileName);
                String fileExtension = "";
                try {
                    fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
                } catch (Exception e) {
                }
                String newFileName = UUID.randomUUID().toString() + fileExtension;
                Path uploadDir = Paths.get("src/main/resources/static/images/upload").toAbsolutePath().normalize();
                try {
                    Files.createDirectories(uploadDir);
                    Path targetLocation = uploadDir.resolve(newFileName);
                    Files.copy(avatarFile.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
                    user.setAvatar("/images/upload/" + newFileName);
                } catch (Exception ex) {
                    throw new RuntimeException("Lưu file thất bại.", ex);
                }
            }
        }

        return userRepository.save(user);
    }

    // Check if username exists
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    // Check if email exists
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    // Create admin user account (for dashboard registration)
    @Transactional(rollbackFor = Exception.class)
    public User createAdminUserAccount(
            String username,
            String email,
            String password,
            String name,
            String phoneNumber,
            String department,
            String gender,
            String dateOfBirth,
            String systemRoleName,
            MultipartFile avatar,
            boolean isActivated,
            boolean sendWelcomeEmail) {

        // Check if user with this email already exists (case-insensitive)
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("A user with this email address already exists: " + email);
        }

        // Check if user with this username already exists (case-insensitive)
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("A user with this username already exists: " + username);
        }

        // Additional check: try to find existing user by email or username to prevent
        // race conditions
        Optional<User> existingUser = userRepository.findByUsernameOrEmail(username, email);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            if (user.getEmail().equalsIgnoreCase(email)) {
                throw new IllegalArgumentException("A user with this email address already exists: " + email);
            } else if (user.getUsername().equalsIgnoreCase(username)) {
                throw new IllegalArgumentException("A user with this username already exists: " + username);
            }
        }

        // Validate password (now optional)
        if (password != null && !password.trim().isEmpty()) {
            if (password.length() < 8) {
                throw new IllegalArgumentException("Password must be at least 8 characters long");
            }

            // Check for at least one uppercase, lowercase, number and special character
            String passwordRegex = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&].*$";
            if (!password.matches(passwordRegex)) {
                throw new IllegalArgumentException(
                        "Password must contain at least one uppercase, lowercase, number and special character");
            }
        }

        // Validate department (now mandatory)
        if (department == null || department.trim().isEmpty()) {
            throw new IllegalArgumentException("Department is required");
        }

        // Find system role by name
        SystemRole systemRole;
        Integer roleId = switch (systemRoleName.toUpperCase()) {
            case "ADMIN" -> 1;
            case "USER" -> 2;
            default -> 2; // Default to USER
        };
        systemRole = systemRoleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("System role not found: " + systemRoleName));

        // Encode password if provided
        String encodedPassword = null;
        if (password != null && !password.trim().isEmpty()) {
            encodedPassword = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(10)
                    .encode(password);
        }

        // Parse date of birth if provided
        LocalDate parsedDateOfBirth = null;
        if (dateOfBirth != null && !dateOfBirth.trim().isEmpty()) {
            try {
                parsedDateOfBirth = LocalDate.parse(dateOfBirth);
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid date of birth format. Please use YYYY-MM-DD format.");
            }
        }

        // Build user
        User.UserBuilder userBuilder = User.builder()
                .username(username)
                .email(email)
                .name(name)
                .phoneNumber(phoneNumber)
                .department(department)
                .gender(gender)
                .dateOfBirth(parsedDateOfBirth)
                .systemRole(systemRole)
                .isActivated(isActivated)
                .authProvider(AuthProvider.GOOGLE)
                .createdAt(LocalDateTime.now());

        // Set password only if provided
        if (encodedPassword != null) {
            userBuilder.password(encodedPassword);
        }

        // Handle avatar upload if provided
        if (avatar != null && !avatar.isEmpty()) {
            try {
                String avatarPath = saveAvatarFile(avatar);
                userBuilder.avatar(avatarPath);
            } catch (Exception e) {
                throw new RuntimeException("Failed to save avatar file: " + e.getMessage(), e);
            }
        }

        User newUser = userBuilder.build();

        // Final check before saving to prevent race conditions
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("A user with this email address already exists: " + email);
        }
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("A user with this username already exists: " + username);
        }

        try {
            User savedUser = userRepository.save(newUser);
            return savedUser;
        } catch (Exception e) {
            // If save fails, check if it's due to duplicate key
            if (e.getMessage() != null && e.getMessage().contains("Duplicate entry")) {
                if (e.getMessage().contains("users.email")) {
                    throw new IllegalArgumentException("A user with this email address already exists: " + email);
                } else if (e.getMessage().contains("users.username")) {
                    throw new IllegalArgumentException("A user with this username already exists: " + username);
                }
            }
            throw e; // Re-throw if it's not a duplicate key error
        }
    }

    // Send welcome email (separate method to avoid transaction issues)
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void sendWelcomeEmailForUser(String email, String username, String name, String password,
            boolean sendWelcomeEmail) {
        if (sendWelcomeEmail) {
            try {
                if (password != null && !password.trim().isEmpty()) {
                    // Send email with password if password is provided
                    emailService.sendWelcomeEmailWithPassword(email, username, name, password);
                } else {
                    // Send regular welcome email if no password
                    emailService.sendWelcomeEmail(email, username, name);
                }
            } catch (Exception e) {
                // Log error but don't fail the registration
                System.err.println("Failed to send welcome email: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }

    // Create admin notification (separate method to avoid transaction issues)
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void createAdminNotificationForUser(User user) {
        try {
            notificationService.createAdminNewUserNotification(user);
        } catch (Exception e) {
            // Log error but don't fail the user creation
            System.err.println("Failed to create admin notification: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Update admin user account (for dashboard editing)
    public User updateAdminUserAccount(
            String userId,
            String username,
            String email,
            String name,
            String phoneNumber,
            String department,
            String gender,
            String dateOfBirth,
            String systemRoleName,
            MultipartFile avatar,
            boolean isActivated) {

        // Get existing user
        User existingUser = findById(userId);
        if (existingUser == null) {
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }

        // Update fields only if they are provided
        if (username != null && !username.isEmpty()) {
            existingUser.setUsername(username);
        }

        if (email != null && !email.isEmpty()) {
            existingUser.setEmail(email);
        }

        if (name != null) {
            existingUser.setName(name.isEmpty() ? null : name);
        }

        if (phoneNumber != null) {
            existingUser.setPhoneNumber(phoneNumber.isEmpty() ? null : phoneNumber);
        }

        if (department != null) {
            existingUser.setDepartment(department.isEmpty() ? null : department);
        }

        if (gender != null) {
            existingUser.setGender(gender.isEmpty() ? null : gender);
        }

        if (dateOfBirth != null && !dateOfBirth.trim().isEmpty()) {
            try {
                LocalDate parsedDateOfBirth = LocalDate.parse(dateOfBirth);
                existingUser.setDateOfBirth(parsedDateOfBirth);
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid date of birth format. Please use YYYY-MM-DD format.");
            }
        }

        // Update system role if provided
        if (systemRoleName != null && !systemRoleName.isEmpty()) {
            Integer roleId = switch (systemRoleName.toUpperCase()) {
                case "ADMIN" -> 1;
                case "USER" -> 2;
                default -> 2; // Default to USER
            };
            SystemRole systemRole = systemRoleRepository.findById(roleId)
                    .orElseThrow(() -> new IllegalArgumentException("System role not found: " + systemRoleName));
            existingUser.setSystemRole(systemRole);
        }

        // Update activation status
        existingUser.setActivated(isActivated);

        // Handle avatar upload if provided
        if (avatar != null && !avatar.isEmpty()) {
            try {
                String avatarPath = saveAvatarFile(avatar);
                existingUser.setAvatar(avatarPath);
            } catch (Exception e) {
                throw new RuntimeException("Failed to save avatar file: " + e.getMessage(), e);
            }
        }

        // Update timestamp
        existingUser.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(existingUser);
    }

    // Update user activation status only
    public User updateUserActivationStatus(String userId, boolean isActivated) {
        System.out.println("UserService.updateUserActivationStatus called with userId: " + userId + ", isActivated: "
                + isActivated);

        User existingUser = findById(userId);
        if (existingUser == null) {
            System.out.println("User not found in UserService");
            throw new IllegalArgumentException("User not found with ID: " + userId);
        }

        System.out.println(
                "Found user: " + existingUser.getUsername() + ", current status: " + existingUser.isActivated());

        existingUser.setActivated(isActivated);
        existingUser.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(existingUser);
        System.out.println("User saved successfully. New status: " + savedUser.isActivated());

        return savedUser;
    }

    private String saveAvatarFile(MultipartFile avatar) throws Exception {
        String originalFileName = avatar.getOriginalFilename();
        if (originalFileName == null || originalFileName.trim().isEmpty()) {
            throw new IllegalArgumentException("Invalid file name");
        }

        originalFileName = StringUtils.cleanPath(originalFileName);
        String fileExtension = "";

        try {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid file extension");
        }

        String lowerExtension = fileExtension.toLowerCase();
        if (!lowerExtension.equals(".jpg") && !lowerExtension.equals(".jpeg") &&
                !lowerExtension.equals(".png") && !lowerExtension.equals(".gif")) {
            throw new IllegalArgumentException("Only JPG, PNG, and GIF files are allowed");
        }

        String newFileName = UUID.randomUUID().toString() + fileExtension;
        Path uploadDir = Paths.get("src/main/resources/static/images/avatar/").toAbsolutePath().normalize();

        try {
            Files.createDirectories(uploadDir);
            Path targetLocation = uploadDir.resolve(newFileName);
            Files.copy(avatar.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return "/images/avatar/" + newFileName;
        } catch (Exception e) {
            throw new Exception("Failed to save file: " + e.getMessage(), e);
        }
    }

    // Update user avatar
    public User updateUserAvatar(String userId, MultipartFile avatarFile) {
        User user = findById(userId);

        if (avatarFile != null && !avatarFile.isEmpty()) {
            try {
                String avatarPath = saveAvatarFile(avatarFile);
                user.setAvatar(avatarPath);
                user.setUpdatedAt(LocalDateTime.now());
                return userRepository.save(user);
            } catch (Exception e) {
                throw new RuntimeException("Failed to update avatar: " + e.getMessage(), e);
            }
        } else {
            throw new IllegalArgumentException("Avatar file is required");
        }
    }

    // Soft delete user account and all related data
    public void softDeleteUserAccount(String userId, String confirmationEmail) {
        User user = findById(userId);

        // Verify email matches
        if (!user.getEmail().equals(confirmationEmail)) {
            throw new IllegalArgumentException("Email confirmation does not match user email");
        }

        // Check if user is already deleted
        if (user.isDeleted()) {
            throw new IllegalStateException("User account is already deleted");
        }

        // Perform soft delete
        user.setDeleted(true);
        user.setDeletedAt(LocalDateTime.now());
        user.setActivated(false);
        user.setDeactivatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        // Clear sensitive information but keep for audit purposes
        // You might want to anonymize some data here
        // user.setPhoneNumber(null);
        // user.setAvatar(null);

        userRepository.save(user);

        // Note: Related vault roles and other data should be handled by cascade or
        // separately
        // This depends on your business requirements
        // For now, we'll let the existing vault role relationships remain for audit
        // purposes
        // But the user won't be able to login anymore due to isActivated = false

        System.out.println("User account soft deleted: " + user.getEmail() + " at " + LocalDateTime.now());
    }

    public List<TopBuilderResponse> getTopBuilders() {
        List<User> topBuilders = userRepository.findTopBuildersByApprovedKnowledge();
        return topBuilders.stream()
                .limit(5)
                .map(user -> {
                    // Count approved knowledge items for this user
                    long approvedCount = knowledgeItemRepository.countByCreatedByAndApproved(user.getId());

                    return TopBuilderResponse.builder()
                            .userId(user.getId())
                            .username(user.getUsername())
                            .name(user.getName())
                            .avatar(user.getAvatar())
                            .approvedKnowledgeCount(approvedCount)
                            .contributionScore(approvedCount * 10.0) // Simple scoring
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());
    }

}