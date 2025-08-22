package com.capstone_project.capstone_project.controller;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import com.capstone_project.capstone_project.model.Notification;
import com.capstone_project.capstone_project.security.CustomUserDetails;
import com.capstone_project.capstone_project.service.NotificationService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Controller
@RequestMapping(path = "/notification")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationController {

    NotificationService notificationService;

    // Lấy danh sách thông báo của user trong vault
    @GetMapping("/list")
    @ResponseBody
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            List<Notification> notifications = notificationService.getNotificationsByUserAndVault(
                    userDetails.getId(), vaultId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Lấy số lượng thông báo chưa đọc
    @GetMapping("/unread-count")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            int count = notificationService.getUnreadNotificationCount(userDetails.getId(), vaultId);
            Map<String, Object> response = new HashMap<>();
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Đánh dấu thông báo đã đọc
    @PostMapping("/mark-as-read")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> markAsRead(
            @RequestParam("notificationId") String notificationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            notificationService.markAsRead(notificationId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Đánh dấu thông báo chưa đọc
    @PostMapping("/mark-as-unread")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> markAsUnread(
            @RequestParam("notificationId") String notificationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            notificationService.markAsUnread(notificationId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Đánh dấu tất cả thông báo đã đọc
    @PostMapping("/mark-all-as-read")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            notificationService.markAllAsRead(userDetails.getId(), vaultId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Xóa thông báo
    @PostMapping("/delete")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> deleteNotification(
            @RequestParam("notificationId") String notificationId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            notificationService.deleteNotification(notificationId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // ==================== ADMIN NOTIFICATION ENDPOINTS ====================

    // Lấy danh sách thông báo của admin
    @GetMapping("/admin/list")
    @ResponseBody
    public ResponseEntity<List<Notification>> getAdminNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            // Kiểm tra xem user có phải là admin không
            if (!"ADMIN".equals(userDetails.getSystemRoleName())) {
                return ResponseEntity.status(403).build();
            }

            List<Notification> notifications = notificationService.getAdminNotifications(userDetails.getId());
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Lấy số lượng thông báo chưa đọc của admin
    @GetMapping("/admin/unread-count")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getAdminUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            // Kiểm tra xem user có phải là admin không
            if (!"ADMIN".equals(userDetails.getSystemRoleName())) {
                return ResponseEntity.status(403).build();
            }

            int count = notificationService.getAdminUnreadNotificationCount(userDetails.getId());
            Map<String, Object> response = new HashMap<>();
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Lấy thông báo system-wide của admin
    @GetMapping("/admin/system")
    @ResponseBody
    public ResponseEntity<List<Notification>> getAdminSystemNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            // Kiểm tra xem user có phải là admin không
            if (!"ADMIN".equals(userDetails.getSystemRoleName())) {
                return ResponseEntity.status(403).build();
            }

            List<Notification> notifications = notificationService.getAdminSystemNotifications(userDetails.getId());
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Đánh dấu tất cả thông báo của admin đã đọc
    @PostMapping("/admin/mark-all-as-read")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> markAllAdminNotificationsAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            // Kiểm tra xem user có phải là admin không
            if (!"ADMIN".equals(userDetails.getSystemRoleName())) {
                return ResponseEntity.status(403).build();
            }

            notificationService.markAllAdminNotificationsAsRead(userDetails.getId());
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
