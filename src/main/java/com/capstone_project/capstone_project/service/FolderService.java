package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.model.Folder;
import com.capstone_project.capstone_project.repository.FolderRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FolderService {

    FolderRepository folderRepository;

    public List<Folder> getPersonalFoldersByVaultId(String vaultId, String userId) {
        return folderRepository.findByVaultIdAndUserIdAndIsPublicFalseAndParentIdIsNullOrderByCreatedAtAsc(vaultId,
                userId);
    }

    public List<Folder> getPublicFoldersByVaultId(String vaultId) {
        return folderRepository.findByVaultIdAndIsPublicTrue(vaultId);
    }

    public Folder getFolderById(String folderId) {
        Long id = Long.parseLong(folderId);
        return folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder not found"));
    }

    // Create folder
    public Folder createFolder(String name, String vaultId, String userId) {
        String trimmedName = name.trim();
        if (trimmedName.isEmpty()) {
            throw new RuntimeException("Tên folder không được để trống");
        }
        List<Folder> existingFolders = folderRepository
                .findByVaultIdAndUserIdAndIsPublicFalseAndParentIdIsNullOrderByCreatedAtAsc(vaultId,
                        userId);

        boolean folderExists = existingFolders.stream()
                .anyMatch(folder -> {
                    String existingName = folder.getName().trim();
                    boolean ignoreCaseMatch = existingName.equalsIgnoreCase(trimmedName);
                    return ignoreCaseMatch;
                });

        if (folderExists) {
            throw new RuntimeException("Folder với tên '" + trimmedName + "' đã tồn tại trong vault này");
        }
        Folder folder = Folder.builder()
                .name(trimmedName)
                .vaultId(vaultId)
                .userId(userId)
                .isPublic(false)
                .parentId(null)
                .build();
        Folder savedFolder = folderRepository.save(folder);
        return savedFolder;
    }

    public void deleteFolder(String folderId, String userId) {
        Long id = Long.parseLong(folderId);
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder không tồn tại"));
        if (Boolean.TRUE.equals(folder.getIsPublic())) {
            // Nếu là public folder, không kiểm tra userId
            folderRepository.deleteById(id);
            return;
        }
        if (folder.getUserId() == null || !folder.getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xóa folder này");
        }
        folderRepository.deleteById(id);
    }

    public void renameFolder(String folderId, String newName, String userId) {
        String trimmedName = newName.trim();
        if (trimmedName.isEmpty()) {
            throw new RuntimeException("Tên folder không được để trống");
        }
        Long id = Long.parseLong(folderId);
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder không tồn tại"));
        if (Boolean.TRUE.equals(folder.getIsPublic())) {
            folder.setName(trimmedName);
            folderRepository.save(folder);
            return;
        }
        if (folder.getUserId() == null || !folder.getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền đổi tên folder này");
        }
        List<Folder> existingFolders = folderRepository.findByVaultIdAndUserIdAndIsPublicFalse(folder.getVaultId(),
                userId);
        boolean folderExists = existingFolders.stream()
                .anyMatch(existingFolder -> {
                    if (existingFolder.getId().equals(id)) {
                        return false;
                    }
                    String existingName = existingFolder.getName().trim();
                    return existingName.equalsIgnoreCase(trimmedName);
                });
        if (folderExists) {
            throw new RuntimeException("Folder với tên '" + trimmedName + "' đã tồn tại trong vault này");
        }
        folder.setName(trimmedName);
        folderRepository.save(folder);
    }

    public List<Folder> getSubfoldersByParentId(Long parentId, String userId) {
        return folderRepository.findByParentIdAndUserIdAndIsPublicFalseOrderByCreatedAtDesc(parentId, userId);
    }

    public List<Folder> getSubfoldersByParentIdAndVaultId(Long parentId, String userId, String vaultId) {
        return folderRepository.findByVaultIdAndParentIdAndUserIdAndIsPublicFalse(vaultId, parentId, userId);
    }

    public Folder addSubfolder(String folderId, String subfolderName, String userId) {
        String trimmedName = subfolderName.trim();
        if (trimmedName.isEmpty()) {
            throw new RuntimeException("Tên subfolder không được để trống");
        }
        Long id = Long.parseLong(folderId);
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder không tồn tại"));
        if (Boolean.TRUE.equals(folder.getIsPublic())) {
            List<Folder> existingSubfolders = folderRepository.findByParentIdAndIsPublicTrue(folder.getId());
            boolean subfolderExists = existingSubfolders.stream()
                    .anyMatch(existingSubfolder -> existingSubfolder.getName().trim().equalsIgnoreCase(trimmedName));
            if (subfolderExists) {
                throw new RuntimeException(
                        "Subfolder public với tên '" + trimmedName + "' đã tồn tại trong folder này");
            }
            Folder subfolder = Folder.builder()
                    .name(trimmedName)
                    .parentId(folder.getId())
                    .vaultId(folder.getVaultId())
                    .userId(null)
                    .isPublic(true)
                    .build();
            return folderRepository.save(subfolder);
        }
        if (folder.getUserId() == null || !folder.getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền thêm subfolder vào folder này");
        }
        List<Folder> existingSubfolders = folderRepository.findByVaultIdAndParentIdAndUserIdAndIsPublicFalse(
                folder.getVaultId(), folder.getId(),
                userId);
        boolean subfolderExists = existingSubfolders.stream()
                .anyMatch(existingSubfolder -> {
                    String existingName = existingSubfolder.getName().trim();
                    return existingName.equalsIgnoreCase(trimmedName);
                });
        if (subfolderExists) {
            throw new RuntimeException("Subfolder với tên '" + trimmedName + "' đã tồn tại trong folder này");
        }
        Folder subfolder = Folder.builder()
                .name(trimmedName)
                .parentId(folder.getId())
                .vaultId(folder.getVaultId())
                .userId(userId)
                .isPublic(false)
                .build();
        return folderRepository.save(subfolder);
    }

    public List<Folder> getFolderTreeByParentId(Long parentId, String userId) {
        List<Folder> folders = folderRepository.findByParentIdAndUserIdAndIsPublicFalseOrderByCreatedAtDesc(parentId,
                userId);
        for (Folder folder : folders) {
            List<Folder> subfolders = getFolderTreeByParentId(folder.getId(), userId);
            folder.setSubfolders(subfolders);
        }
        return folders;
    }

    public List<Folder> getFolderTreeByParentIdAndVaultId(Long parentId, String userId, String vaultId) {
        List<Folder> folders = folderRepository
                .findByVaultIdAndParentIdAndUserIdAndIsPublicFalseOrderByCreatedAtDesc(vaultId, parentId, userId);
        for (Folder folder : folders) {
            List<Folder> subfolders = getFolderTreeByParentIdAndVaultId(folder.getId(), userId, vaultId);
            folder.setSubfolders(subfolders);
        }
        return folders;
    }

    // ================== PUBLIC FOLDER MANAGEMENT ==================
    public Folder createPublicFolder(String name, String vaultId) {
        String trimmedName = name.trim();
        if (trimmedName.isEmpty()) {
            throw new RuntimeException("Tên folder không được để trống");
        }
        List<Folder> existingFolders = folderRepository.findByVaultIdAndIsPublicTrue(vaultId);
        boolean folderExists = existingFolders.stream()
                .anyMatch(folder -> folder.getName().trim().equalsIgnoreCase(trimmedName));
        if (folderExists) {
            throw new RuntimeException("Folder public với tên '" + trimmedName + "' đã tồn tại trong vault này");
        }
        Folder folder = Folder.builder()
                .name(trimmedName)
                .vaultId(vaultId)
                .userId(null)
                .isPublic(true)
                .parentId(null)
                .build();
        return folderRepository.save(folder);
    }

    public void deletePublicFolder(String folderId) {
        Long id = Long.parseLong(folderId);
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder không tồn tại"));
        if (folder.getIsPublic() == null || !folder.getIsPublic()) {
            throw new RuntimeException("Bạn chỉ có thể xóa public folder");
        }
        folderRepository.deleteById(id);
    }

    public void renamePublicFolder(String folderId, String newName) {
        String trimmedName = newName.trim();
        if (trimmedName.isEmpty()) {
            throw new RuntimeException("Tên folder không được để trống");
        }
        Long id = Long.parseLong(folderId);
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder không tồn tại"));
        if (folder.getIsPublic() == null || !folder.getIsPublic()) {
            throw new RuntimeException("Bạn chỉ có thể đổi tên public folder");
        }
        List<Folder> existingFolders = folderRepository.findByVaultIdAndIsPublicTrue(folder.getVaultId());
        boolean folderExists = existingFolders.stream()
                .anyMatch(existingFolder -> {
                    if (existingFolder.getId().equals(id))
                        return false;
                    return existingFolder.getName().trim().equalsIgnoreCase(trimmedName);
                });
        if (folderExists) {
            throw new RuntimeException("Folder public với tên '" + trimmedName + "' đã tồn tại trong vault này");
        }
        folder.setName(trimmedName);
        folderRepository.save(folder);
    }

    public Folder addPublicSubfolder(String folderId, String subfolderName, String vaultId) {
        String trimmedName = subfolderName.trim();
        if (trimmedName.isEmpty()) {
            throw new RuntimeException("Tên subfolder không được để trống");
        }
        Long id = Long.parseLong(folderId);
        Folder parentFolder = folderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Folder không tồn tại"));
        if (parentFolder.getIsPublic() == null || !parentFolder.getIsPublic()) {
            throw new RuntimeException("Chỉ được thêm subfolder cho public folder");
        }
        List<Folder> existingSubfolders = folderRepository.findByParentIdAndIsPublicTrue(parentFolder.getId());
        boolean subfolderExists = existingSubfolders.stream()
                .anyMatch(existingSubfolder -> existingSubfolder.getName().trim().equalsIgnoreCase(trimmedName));
        if (subfolderExists) {
            throw new RuntimeException("Subfolder public với tên '" + trimmedName + "' đã tồn tại trong folder này");
        }
        Folder subfolder = Folder.builder()
                .name(trimmedName)
                .parentId(parentFolder.getId())
                .vaultId(vaultId)
                .userId(null)
                .isPublic(true)
                .build();
        return folderRepository.save(subfolder);
    }

    public List<Folder> getPublicSubfoldersByParentId(Long parentId) {
        return folderRepository.findByParentIdAndIsPublicTrue(parentId);
    }

    public List<Folder> getPublicFolderTreeByVaultId(String vaultId) {
        List<Folder> roots = folderRepository
                .findByVaultIdAndIsPublicTrueAndParentIdIsNullOrderByCreatedAtDesc(vaultId);
        for (Folder folder : roots) {
            folder.setSubfolders(getPublicSubfolderTree(folder.getId()));
        }
        return roots;
    }

    private List<Folder> getPublicSubfolderTree(Long parentId) {
        List<Folder> children = folderRepository.findByParentIdAndIsPublicTrue(parentId);
        for (Folder child : children) {
            child.setSubfolders(getPublicSubfolderTree(child.getId()));
        }
        return children;
    }

    public boolean isPublicFolder(Integer folderId) {
        if (folderId == null)
            return false;
        Folder folder = folderRepository.findById(Long.valueOf(folderId))
                .orElseThrow(() -> new RuntimeException("Folder not found"));
        return Boolean.TRUE.equals(folder.getIsPublic());
    }

    public List<Folder> getFolderPath(Long folderId) {
        List<Folder> path = new java.util.ArrayList<>();
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found"));
        while (folder != null) {
            path.add(0, folder); // add to the beginning for root-to-leaf order
            if (folder.getParentId() == null)
                break;
            folder = folderRepository.findById(folder.getParentId())
                    .orElse(null);
        }
        return path;
    }
}
