package com.capstone_project.capstone_project.model;

import com.capstone_project.capstone_project.enums.PurposeToken;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "verification_token")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VerificationToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    Long id;

    @Column(name = "token")
    String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false, name = "user_id")
    User user;

    @Column(name = "purpose")
    @Enumerated(EnumType.STRING)
    PurposeToken purposeToken;

    @Column(name = "expiry_date")
    LocalDateTime expiryDate;
}
