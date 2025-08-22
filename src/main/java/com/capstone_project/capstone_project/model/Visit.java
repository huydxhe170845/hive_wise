package com.capstone_project.capstone_project.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "visits")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Visit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    Long id;

    @Column(name = "user_id")
    String userId;

    @Column(name = "session_id")
    String sessionId;

    @Column(name = "ip_address")
    String ipAddress;

    @Column(name = "user_agent")
    String userAgent;

    @Column(name = "page_url")
    String pageUrl;

    @Column(name = "visit_time")
    LocalDateTime visitTime;

    @Column(name = "is_login")
    Boolean isLogin;

    @PrePersist
    protected void onCreate() {
        if (this.visitTime == null) {
            this.visitTime = LocalDateTime.now();
        }
        if (this.isLogin == null) {
            this.isLogin = false;
        }
    }
}
