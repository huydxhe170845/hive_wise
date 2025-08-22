package com.capstone_project.capstone_project.repository;

import org.springframework.data.repository.CrudRepository;

import com.capstone_project.capstone_project.model.Folder;

import java.util.List;
import java.util.Optional;

public interface FolderRepository extends CrudRepository<Folder, Long> {

        List<Folder> findByVaultIdAndIsPublicTrue(String vaultId);

        List<Folder> findByVaultIdAndUserId(String vaultId, String userId);

        List<Folder> findByVaultIdAndUserIdAndIsPublicFalse(String vaultId, String userId);

        List<Folder> findByVaultIdAndUserIdAndIsPublicFalseAndParentIdIsNullOrderByCreatedAtAsc(String vaultId,
                        String userId);

        Optional<Folder> findByVaultIdAndUserIdAndNameAndIsPublicFalse(String vaultId, String userId, String name);

        Optional<Folder> findByVaultIdAndNameAndIsPublicTrue(String vaultId, String name);

        List<Folder> findByParentIdAndUserIdAndIsPublicFalse(Long parentId, String userId);

        List<Folder> findByVaultIdAndParentIdAndUserIdAndIsPublicFalse(String vaultId, Long parentId, String userId);

        List<Folder> findByParentIdAndUserIdAndIsPublicFalseOrderByCreatedAtDesc(Long parentId, String userId);

        List<Folder> findByVaultIdAndParentIdAndUserIdAndIsPublicFalseOrderByCreatedAtDesc(String vaultId,
                        Long parentId,
                        String userId);

        List<Folder> findByParentIdAndIsPublicTrue(Long parentId);

        List<Folder> findByVaultIdAndIsPublicTrueAndParentIdIsNullOrderByCreatedAtDesc(String vaultId);

        Optional<Folder> findById(Long id);

        void deleteById(Long id);

}
