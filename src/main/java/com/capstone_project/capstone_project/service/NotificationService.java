package com.capstone_project.capstone_project.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.capstone_project.capstone_project.model.Notification;
import com.capstone_project.capstone_project.model.KnowledgeItem;
import com.capstone_project.capstone_project.model.KnowledgeSession;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.model.Vault;
import com.capstone_project.capstone_project.enums.NotificationType;
import com.capstone_project.capstone_project.repository.NotificationRepository;
import com.capstone_project.capstone_project.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@Transactional
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationService {

    NotificationRepository notificationRepository;
    UserVaultRoleService userVaultRoleService;
    UserRepository userRepository;

    // Tạo thông báo khi knowledge được approve
    public void createKnowledgeApprovedNotification(KnowledgeItem knowledge, String approvedBy) {
        User approver = userRepository.findById(approvedBy).orElse(null);
        String message = String.format("Kiến thức '%s' của bạn đã được phê duyệt bởi %s",
                knowledge.getName(),
                approver.getName() != null ? approver.getName() : approver.getUsername());

        Notification notification = Notification.builder()
                .vaultId(knowledge.getVaultId())
                .recipientId(knowledge.getCreatedBy())
                .senderId(approvedBy)
                .title("Kiến thức đã được phê duyệt")
                .message(message)
                .type(NotificationType.KNOWLEDGE_APPROVED)
                .relatedEntityId(knowledge.getId())
                .relatedEntityType("KNOWLEDGE")
                .build();

        notificationRepository.save(notification);
    }

    // Tạo thông báo khi knowledge bị reject
    public void createKnowledgeRejectedNotification(KnowledgeItem knowledge, String rejectedBy, String reason) {
        User rejector = userRepository.findById(rejectedBy).orElse(null);
        String message = String.format("Kiến thức '%s' của bạn đã bị từ chối bởi %s",
                knowledge.getName(),
                rejector.getName() != null ? rejector.getName() : rejector.getUsername());

        if (reason != null && !reason.trim().isEmpty()) {
            message += ". Lý do: " + reason;
        }

        Notification notification = Notification.builder()
                .vaultId(knowledge.getVaultId())
                .recipientId(knowledge.getCreatedBy())
                .senderId(rejectedBy)
                .title("Kiến thức bị từ chối")
                .message(message)
                .type(NotificationType.KNOWLEDGE_REJECTED)
                .relatedEntityId(knowledge.getId())
                .relatedEntityType("KNOWLEDGE")
                .build();

        notificationRepository.save(notification);
    }

    // Tạo thông báo khi có knowledge mới được tạo bởi expert/vault owner
    public void createNewKnowledgeNotification(KnowledgeItem knowledge) {
        User creator = userRepository.findById(knowledge.getCreatedBy()).orElse(null);
        String creatorRole = userVaultRoleService.getRoleInVault(knowledge.getCreatedBy(), knowledge.getVaultId());

        // Chỉ thông báo khi Expert hoặc Vault Owner tạo knowledge approved
        if (("EXPERT".equalsIgnoreCase(creatorRole) || "VAULT_OWNER".equalsIgnoreCase(creatorRole))
                && knowledge.getApprovalStatus().name().equals("APPROVED")) {

            // Gửi thông báo cho tất cả members trong vault (trừ người tạo)
            List<String> vaultMembers = userVaultRoleService.getUserIdsByVaultId(knowledge.getVaultId());

            for (String memberId : vaultMembers) {
                if (!memberId.equals(knowledge.getCreatedBy())) {
                    String message = String.format("Có kiến thức mới '%s' được tạo bởi %s (%s)",
                            knowledge.getName(),
                            creator.getName() != null ? creator.getName() : creator.getUsername(),
                            creatorRole.equals("EXPERT") ? "Chuyên gia" : "Chủ vault");

                    Notification notification = Notification.builder()
                            .vaultId(knowledge.getVaultId())
                            .recipientId(memberId)
                            .senderId(knowledge.getCreatedBy())
                            .title("Kiến thức mới")
                            .message(message)
                            .type(NotificationType.NEW_KNOWLEDGE_CREATED)
                            .relatedEntityId(knowledge.getId())
                            .relatedEntityType("KNOWLEDGE")
                            .build();

                    notificationRepository.save(notification);
                }
            }
        }
    }

    // Tạo thông báo khi có knowledge được submit để approve
    public void createKnowledgeSubmittedNotification(KnowledgeItem knowledge) {
        User submitter = userRepository.findById(knowledge.getCreatedBy()).orElse(null);

        // Gửi thông báo cho Expert và Vault Owner
        List<String> vaultMembers = userVaultRoleService.getUserIdsByVaultId(knowledge.getVaultId());

        for (String memberId : vaultMembers) {
            String role = userVaultRoleService.getRoleInVault(memberId, knowledge.getVaultId());
            if ("EXPERT".equalsIgnoreCase(role) || "VAULT_OWNER".equalsIgnoreCase(role)) {
                String message = String.format("Có kiến thức mới '%s' cần phê duyệt từ %s",
                        knowledge.getName(),
                        submitter.getName() != null ? submitter.getName() : submitter.getUsername());

                Notification notification = Notification.builder()
                        .vaultId(knowledge.getVaultId())
                        .recipientId(memberId)
                        .senderId(knowledge.getCreatedBy())
                        .title("Kiến thức cần phê duyệt")
                        .message(message)
                        .type(NotificationType.KNOWLEDGE_SUBMITTED)
                        .relatedEntityId(knowledge.getId())
                        .relatedEntityType("KNOWLEDGE")
                        .build();

                notificationRepository.save(notification);
            }
        }
    }

    // Tạo thông báo khi có session mới
    public void createSessionCreatedNotification(KnowledgeSession session) {
        User creator = userRepository.findById(session.getCreatedBy()).orElse(null);

        // Gửi thông báo cho tất cả members trong vault (trừ người tạo)
        List<String> vaultMembers = userVaultRoleService.getUserIdsByVaultId(session.getVault().getId());

        for (String memberId : vaultMembers) {
            if (!memberId.equals(session.getCreatedBy())) {
                String message = String.format("Có phiên học mới '%s' được tạo bởi %s vào %s",
                        session.getTitle(),
                        creator.getName() != null ? creator.getName() : creator.getUsername(),
                        session.getStartTime().toString());

                Notification notification = Notification.builder()
                        .vaultId(session.getVault().getId())
                        .recipientId(memberId)
                        .senderId(session.getCreatedBy())
                        .title("Phiên học mới")
                        .message(message)
                        .type(NotificationType.SESSION_CREATED)
                        .relatedEntityId(String.valueOf(session.getId()))
                        .relatedEntityType("SESSION")
                        .build();

                notificationRepository.save(notification);
            }
        }
    }

    // Lấy danh sách thông báo của user trong vault
    public List<Notification> getNotificationsByUserAndVault(String userId, String vaultId) {
        return notificationRepository.findByRecipientIdAndVaultIdOrderByCreatedAtDesc(userId, vaultId);
    }

    // Lấy thông báo chưa đọc
    public List<Notification> getUnreadNotifications(String userId, String vaultId) {
        return notificationRepository.findByRecipientIdAndVaultIdAndIsReadFalseOrderByCreatedAtDesc(userId, vaultId);
    }

    // Đếm số thông báo chưa đọc
    public int getUnreadNotificationCount(String userId, String vaultId) {
        return notificationRepository.countByRecipientIdAndVaultIdAndIsReadFalse(userId, vaultId);
    }

    // Đánh dấu thông báo đã đọc
    public void markAsRead(String notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.markAsRead();
            notificationRepository.save(notification);
        }
    }

    // Đánh dấu thông báo chưa đọc
    public void markAsUnread(String notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.markAsUnread();
            notificationRepository.save(notification);
        }
    }

    // Đánh dấu tất cả thông báo đã đọc
    public void markAllAsRead(String userId, String vaultId) {
        List<Notification> unreadNotifications = getUnreadNotifications(userId, vaultId);
        for (Notification notification : unreadNotifications) {
            notification.markAsRead();
            notificationRepository.save(notification);
        }
    }

    // Xóa thông báo
    public void deleteNotification(String notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    // ==================== ADMIN NOTIFICATIONS ====================

    // Tạo thông báo cho admin khi có user mới đăng ký
    public void createAdminNewUserNotification(User newUser) {
        List<String> adminIds = userRepository.findBySystemRoleName("ADMIN")
                .stream()
                .map(User::getId)
                .toList();

        for (String adminId : adminIds) {
            String message = String.format("Người dùng mới '%s' (%s) đã đăng ký tài khoản",
                    newUser.getName() != null ? newUser.getName() : newUser.getUsername(),
                    newUser.getEmail());

            Notification notification = Notification.builder()
                    .recipientId(adminId)
                    .senderId(newUser.getId())
                    .title("Người dùng mới đăng ký")
                    .message(message)
                    .type(NotificationType.ADMIN_NEW_USER_REGISTERED)
                    .relatedEntityId(newUser.getId())
                    .relatedEntityType("USER")
                    .vaultId(null) // Admin notifications don't need vault_id
                    .build();

            notificationRepository.save(notification);
        }
    }

    // Tạo thông báo cho admin khi user được kích hoạt/vô hiệu hóa
    public void createAdminUserStatusNotification(User user, boolean isActivated) {
        List<String> adminIds = userRepository.findBySystemRoleName("ADMIN")
                .stream()
                .map(User::getId)
                .toList();

        for (String adminId : adminIds) {
            String status = isActivated ? "kích hoạt" : "vô hiệu hóa";
            String message = String.format("Tài khoản của '%s' (%s) đã được %s",
                    user.getName() != null ? user.getName() : user.getUsername(),
                    user.getEmail(),
                    status);

            Notification notification = Notification.builder()
                    .recipientId(adminId)
                    .senderId(user.getId())
                    .title(isActivated ? "Tài khoản được kích hoạt" : "Tài khoản bị vô hiệu hóa")
                    .message(message)
                    .type(isActivated ? NotificationType.ADMIN_USER_ACCOUNT_ACTIVATED
                            : NotificationType.ADMIN_USER_ACCOUNT_DEACTIVATED)
                    .relatedEntityId(user.getId())
                    .relatedEntityType("USER")
                    .vaultId(null) // Admin notifications don't need vault_id
                    .build();

            notificationRepository.save(notification);
        }
    }

    // Tạo thông báo cho admin khi có vault mới được tạo
    public void createAdminNewVaultNotification(Vault vault) {
        List<String> adminIds = userRepository.findBySystemRoleName("ADMIN")
                .stream()
                .map(User::getId)
                .toList();
        User creator = userRepository.findById(vault.getCreatedByUserId()).orElse(null);

        for (String adminId : adminIds) {
            String message = String.format("Vault mới '%s' đã được tạo bởi %s",
                    vault.getName(),
                    creator != null ? (creator.getName() != null ? creator.getName() : creator.getUsername())
                            : "Unknown User");

            Notification notification = Notification.builder()
                    .recipientId(adminId)
                    .senderId(vault.getCreatedByUserId())
                    .title("Vault mới được tạo")
                    .message(message)
                    .type(NotificationType.ADMIN_NEW_VAULT_CREATED)
                    .relatedEntityId(vault.getId())
                    .relatedEntityType("VAULT")
                    .vaultId(vault.getId())
                    .build();

            notificationRepository.save(notification);
        }
    }

    // Tạo thông báo cho admin khi vault bị xóa
    public void createAdminVaultDeletedNotification(Vault vault) {
        List<String> adminIds = userRepository.findBySystemRoleName("ADMIN")
                .stream()
                .map(User::getId)
                .toList();

        for (String adminId : adminIds) {
            String message = String.format("Vault '%s' đã bị xóa bởi chủ sở hữu",
                    vault.getName());

            Notification notification = Notification.builder()
                    .recipientId(adminId)
                    .senderId(vault.getCreatedByUserId())
                    .title("Vault đã bị xóa")
                    .message(message)
                    .type(NotificationType.ADMIN_VAULT_DELETED)
                    .relatedEntityId(vault.getId())
                    .relatedEntityType("VAULT")
                    .vaultId(vault.getId())
                    .build();

            notificationRepository.save(notification);
        }
    }

    // Tạo thông báo thống kê hệ thống hàng ngày cho admin
    public void createAdminSystemStatisticsNotification(Map<String, Object> statistics) {
        List<String> adminIds = userRepository.findBySystemRoleName("ADMIN")
                .stream()
                .map(User::getId)
                .toList();

        for (String adminId : adminIds) {
            String message = String.format(
                    "Thống kê hệ thống ngày %s: %d người dùng mới, %d vault mới, %d knowledge mới",
                    LocalDateTime.now().toLocalDate(),
                    (Integer) statistics.getOrDefault("newUsers", 0),
                    (Integer) statistics.getOrDefault("newVaults", 0),
                    (Integer) statistics.getOrDefault("newKnowledge", 0));

            Notification notification = Notification.builder()
                    .recipientId(adminId)
                    .title("Thống kê hệ thống hàng ngày")
                    .message(message)
                    .type(NotificationType.ADMIN_SYSTEM_STATISTICS)
                    .relatedEntityType("SYSTEM")
                    .vaultId(null) // Admin notifications don't need vault_id
                    .build();

            notificationRepository.save(notification);
        }
    }

    // Tạo thông báo cảnh báo hoạt động cao cho admin
    public void createAdminHighActivityAlertNotification(String activityType, int count) {
        List<String> adminIds = userRepository.findBySystemRoleName("ADMIN")
                .stream()
                .map(User::getId)
                .toList();

        for (String adminId : adminIds) {
            String message = String.format("Cảnh báo: Hoạt động %s cao bất thường (%d trong 1 giờ qua)",
                    activityType, count);

            Notification notification = Notification.builder()
                    .recipientId(adminId)
                    .title("Cảnh báo hoạt động cao")
                    .message(message)
                    .type(NotificationType.ADMIN_HIGH_ACTIVITY_ALERT)
                    .relatedEntityType("SYSTEM")
                    .vaultId(null) // Admin notifications don't need vault_id
                    .build();

            notificationRepository.save(notification);
        }
    }

    // Tạo thông báo bảo mật cho admin
    public void createAdminSecurityAlertNotification(String alertType, String details) {
        List<String> adminIds = userRepository.findBySystemRoleName("ADMIN")
                .stream()
                .map(User::getId)
                .toList();

        for (String adminId : adminIds) {
            String message = String.format("Cảnh báo bảo mật: %s - %s", alertType, details);

            Notification notification = Notification.builder()
                    .recipientId(adminId)
                    .title("Cảnh báo bảo mật")
                    .message(message)
                    .type(NotificationType.ADMIN_SECURITY_ALERT)
                    .relatedEntityType("SECURITY")
                    .vaultId(null) // Admin notifications don't need vault_id
                    .build();

            notificationRepository.save(notification);
        }
    }

    // ==================== ADMIN NOTIFICATION QUERIES ====================

    // Lấy tất cả thông báo của admin (bao gồm cả system-wide và vault-specific)
    public List<Notification> getAdminNotifications(String adminId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(adminId);
    }

    // Lấy thông báo chưa đọc của admin
    public List<Notification> getAdminUnreadNotifications(String adminId) {
        return notificationRepository.findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(adminId);
    }

    // Đếm số thông báo chưa đọc của admin
    public int getAdminUnreadNotificationCount(String adminId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(adminId);
    }

    // Lấy thông báo system-wide của admin
    public List<Notification> getAdminSystemNotifications(String adminId) {
        return notificationRepository.findByRecipientIdAndVaultIdIsNullOrderByCreatedAtDesc(adminId);
    }

    // Lấy thông báo system-wide chưa đọc của admin
    public List<Notification> getAdminSystemUnreadNotifications(String adminId) {
        return notificationRepository.findByRecipientIdAndVaultIdIsNullAndIsReadFalseOrderByCreatedAtDesc(adminId);
    }

    // Đếm số thông báo system-wide chưa đọc của admin
    public int getAdminSystemUnreadNotificationCount(String adminId) {
        return notificationRepository.countByRecipientIdAndVaultIdIsNullAndIsReadFalse(adminId);
    }

    // Đánh dấu tất cả thông báo của admin đã đọc
    public void markAllAdminNotificationsAsRead(String adminId) {
        List<Notification> unreadNotifications = getAdminUnreadNotifications(adminId);
        for (Notification notification : unreadNotifications) {
            notification.markAsRead();
            notificationRepository.save(notification);
        }
    }
}
