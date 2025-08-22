package com.capstone_project.capstone_project.model;

import com.capstone_project.capstone_project.enums.AuthProvider;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "system_role_id", nullable = false)
    SystemRole systemRole;

    @Column(name = "name")
    String name;

    @Column(name = "username")
    String username;

    @Column(name = "password")
    String password;

    @Column(name = "email")
    String email;

    @Column(name = "phone_number")
    String phoneNumber;

    @Column(name = "date_of_birth")
    LocalDate dateOfBirth;

    @Column(name = "avatar")
    String avatar;

    @Column(name = "auth_provider")
    @Enumerated(EnumType.STRING)
    AuthProvider authProvider;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @Column(name = "deactivated_at")
    LocalDateTime deactivatedAt;

    @Column(name = "is_activated")
    boolean isActivated;

    @Column(name = "is_deleted")
    boolean isDeleted;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;

    @Column(name = "google_id")
    String googleId;

    @Column(name = "google_first_name")
    String googleFirstName;

    @Column(name = "google_given_name")
    String googleGivenName;

    @Column(name = "google_family_name")
    String googleFamilyName;

    @Column(name = "is_verified_email_google")
    Boolean isVerifiedEmailGoogle;

    @Column(name = "gender")
    String gender;

    @Column(name = "position")
    String position;

    @Column(name = "department")
    String department;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

}
