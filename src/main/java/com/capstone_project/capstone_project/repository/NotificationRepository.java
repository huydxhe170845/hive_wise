package com.capstone_project.capstone_project.repository;

import java.util.List;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import com.capstone_project.capstone_project.model.Notification;
import com.capstone_project.capstone_project.enums.NotificationType;

@Repository
public interface NotificationRepository extends CrudRepository<Notification, String> {

        List<Notification> findByRecipientIdAndVaultIdOrderByCreatedAtDesc(String recipientId, String vaultId);

        List<Notification> findByRecipientIdAndVaultIdAndIsReadFalseOrderByCreatedAtDesc(String recipientId,
                        String vaultId);

        List<Notification> findByRecipientIdAndVaultIdAndTypeOrderByCreatedAtDesc(String recipientId, String vaultId,
                        NotificationType type);

        int countByRecipientIdAndVaultIdAndIsReadFalse(String recipientId, String vaultId);

        List<Notification> findByRelatedEntityIdAndRelatedEntityType(String relatedEntityId, String relatedEntityType);

        void deleteByVaultIdAndCreatedAtBefore(String vaultId, java.time.LocalDateTime date);

        // Admin notification queries
        List<Notification> findByRecipientIdAndTypeOrderByCreatedAtDesc(String recipientId, NotificationType type);

        List<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(String recipientId);

        int countByRecipientIdAndIsReadFalse(String recipientId);

        List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);

        // System-wide notifications (no vault_id)
        List<Notification> findByRecipientIdAndVaultIdIsNullOrderByCreatedAtDesc(String recipientId);

        List<Notification> findByRecipientIdAndVaultIdIsNullAndIsReadFalseOrderByCreatedAtDesc(String recipientId);

        int countByRecipientIdAndVaultIdIsNullAndIsReadFalse(String recipientId);
}
