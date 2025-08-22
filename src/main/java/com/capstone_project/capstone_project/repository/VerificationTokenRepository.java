package com.capstone_project.capstone_project.repository;

import com.capstone_project.capstone_project.enums.PurposeToken;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.model.VerificationToken;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface VerificationTokenRepository extends CrudRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByToken(String token);

    void deleteByUserAndPurposeToken(User user, PurposeToken purposeToken);

    Optional<VerificationToken> findByTokenAndUserAndPurposeToken(String token, User user, PurposeToken purposeToken);

    Optional<VerificationToken> findTopByUserAndPurposeTokenOrderByExpiryDateDesc(User user, PurposeToken purpose);

    @Query("SELECT COUNT(vt) FROM VerificationToken vt WHERE vt.expiryDate > :currentTime")
    long countPendingTokens(LocalDateTime currentTime);

    @Query("SELECT COUNT(vt) FROM VerificationToken vt WHERE vt.expiryDate > :currentTime AND vt.purposeToken = :purpose")
    long countPendingTokensByPurpose(LocalDateTime currentTime, PurposeToken purpose);
}
