package com.capstone_project.capstone_project.enums;

public enum NotificationType {
    KNOWLEDGE_APPROVED("Knowledge Approved", "Kiến thức của bạn đã được phê duyệt"),
    KNOWLEDGE_REJECTED("Knowledge Rejected", "Kiến thức của bạn đã bị từ chối"),
    NEW_KNOWLEDGE_CREATED("New Knowledge Created", "Có kiến thức mới được tạo"),
    KNOWLEDGE_SUBMITTED("Knowledge Submitted", "Có kiến thức cần phê duyệt"),
    SESSION_CREATED("Session Created", "Có phiên học mới được tạo"),
    SESSION_UPDATED("Session Updated", "Phiên học đã được cập nhật"),
    SESSION_CANCELLED("Session Cancelled", "Phiên học đã bị hủy"),
    VAULT_MEMBER_ADDED("Member Added", "Có thành viên mới tham gia vault"),
    VAULT_ROLE_CHANGED("Role Changed", "Vai trò của bạn trong vault đã thay đổi"),

    // Admin notifications - System level
    ADMIN_NEW_USER_REGISTERED("New User Registered", "Có người dùng mới đăng ký"),
    ADMIN_USER_ACCOUNT_ACTIVATED("User Account Activated", "Tài khoản người dùng đã được kích hoạt"),
    ADMIN_USER_ACCOUNT_DEACTIVATED("User Account Deactivated", "Tài khoản người dùng đã bị vô hiệu hóa"),
    ADMIN_NEW_VAULT_CREATED("New Vault Created", "Có vault mới được tạo"),
    ADMIN_VAULT_DELETED("Vault Deleted", "Vault đã bị xóa"),
    ADMIN_SYSTEM_STATISTICS("System Statistics", "Thống kê hệ thống hàng ngày"),
    ADMIN_HIGH_ACTIVITY_ALERT("High Activity Alert", "Cảnh báo hoạt động cao"),
    ADMIN_SECURITY_ALERT("Security Alert", "Cảnh báo bảo mật"),
    ADMIN_SYSTEM_MAINTENANCE("System Maintenance", "Bảo trì hệ thống");

    private final String title;
    private final String description;

    NotificationType(String title, String description) {
        this.title = title;
        this.description = description;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }
}
