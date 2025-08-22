package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.model.Folder;
import com.capstone_project.capstone_project.repository.FolderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FolderServiceTest {

    @Mock
    private FolderRepository folderRepository;

    @InjectMocks
    private FolderService folderService;

    private Folder testFolder;

    @BeforeEach
    void setUp() {
        testFolder = Folder.builder()
                .id(1L)
                .name("Test Folder")
                .vaultId("vault1")
                .userId("user1")
                .isPublic(false)
                .parentId(null)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getPersonalFoldersByVaultId_ReturnsPersonalFolders() {
        // Arrange
        Folder folder2 = Folder.builder()
                .id(2L)
                .name("Test Folder 2")
                .vaultId("vault1")
                .userId("user1")
                .isPublic(false)
                .build();
        when(folderRepository.findByVaultIdAndUserIdAndIsPublicFalseAndParentIdIsNullOrderByCreatedAtAsc("vault1",
                "user1"))
                .thenReturn(Arrays.asList(testFolder, folder2));

        // Act
        List<Folder> result = folderService.getPersonalFoldersByVaultId("vault1", "user1");

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.contains(testFolder));
        assertTrue(result.contains(folder2));
        verify(folderRepository).findByVaultIdAndUserIdAndIsPublicFalseAndParentIdIsNullOrderByCreatedAtAsc("vault1",
                "user1");
    }

    @Test
    void getPublicFoldersByVaultId_ReturnsPublicFolders() {
        // Arrange
        Folder publicFolder = Folder.builder()
                .id(2L)
                .name("Public Folder")
                .vaultId("vault1")
                .isPublic(true)
                .build();
        when(folderRepository.findByVaultIdAndIsPublicTrue("vault1"))
                .thenReturn(Arrays.asList(publicFolder));

        // Act
        List<Folder> result = folderService.getPublicFoldersByVaultId("vault1");

        // Assert
        assertEquals(1, result.size());
        assertEquals(publicFolder, result.get(0));
        verify(folderRepository).findByVaultIdAndIsPublicTrue("vault1");
    }

    @Test
    void getFolderById_ExistingFolder_ReturnsFolder() {
        // Arrange
        when(folderRepository.findById(1L)).thenReturn(Optional.of(testFolder));

        // Act
        Folder result = folderService.getFolderById("1");

        // Assert
        assertNotNull(result);
        assertEquals(testFolder, result);
        verify(folderRepository).findById(1L);
    }

    @Test
    void getFolderById_NonExistingFolder_ThrowsException() {
        // Arrange
        when(folderRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> folderService.getFolderById("999"));
        assertEquals("Folder not found", exception.getMessage());
        verify(folderRepository).findById(999L);
    }

    @Test
    void createFolder_Success() {
        // Arrange
        when(folderRepository.findByVaultIdAndUserIdAndIsPublicFalseAndParentIdIsNullOrderByCreatedAtAsc("vault1",
                "user1"))
                .thenReturn(Arrays.asList());
        when(folderRepository.save(any(Folder.class))).thenReturn(testFolder);

        // Act
        Folder result = folderService.createFolder("New Folder", "vault1", "user1");

        // Assert
        assertNotNull(result);
        assertEquals("Test Folder", result.getName());
        verify(folderRepository).save(any(Folder.class));
    }

    @Test
    void createFolder_WithParentId_Success() {
        // Arrange
        Folder parentFolder = Folder.builder().id(1L).name("Parent Folder").build();
        when(folderRepository.findById(1L)).thenReturn(Optional.of(parentFolder));
        when(folderRepository.findByVaultIdAndParentIdAndUserIdAndIsPublicFalse("vault1", 1L, "user1"))
                .thenReturn(Arrays.asList());
        when(folderRepository.save(any(Folder.class))).thenReturn(testFolder);

        // Act
        Folder result = folderService.addSubfolder("1", "Child Folder", "user1");

        // Assert
        assertNotNull(result);
        verify(folderRepository).findById(1L);
        verify(folderRepository).save(any(Folder.class));
    }

    @Test
    void createFolder_WithInvalidParentId_ThrowsException() {
        // Arrange
        when(folderRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> folderService.addSubfolder("999", "Child Folder", "user1"));
        assertEquals("Folder không tồn tại", exception.getMessage());
        verify(folderRepository).findById(999L);
        verify(folderRepository, never()).save(any(Folder.class));
    }

    @Test
    void renameFolder_Success() {
        // Arrange
        when(folderRepository.findById(1L)).thenReturn(Optional.of(testFolder));
        when(folderRepository.findByVaultIdAndUserIdAndIsPublicFalse("vault1", "user1"))
                .thenReturn(Arrays.asList(testFolder));
        when(folderRepository.save(any(Folder.class))).thenReturn(testFolder);

        // Act
        assertDoesNotThrow(() -> folderService.renameFolder("1", "Updated Folder", "user1"));

        // Assert
        verify(folderRepository).findById(1L);
        verify(folderRepository).save(any(Folder.class));
    }

    @Test
    void renameFolder_NonExistingFolder_ThrowsException() {
        // Arrange
        when(folderRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> folderService.renameFolder("999", "Updated Folder", "user1"));
        assertEquals("Folder không tồn tại", exception.getMessage());
        verify(folderRepository).findById(999L);
        verify(folderRepository, never()).save(any(Folder.class));
    }

    @Test
    void deleteFolder_Success() {
        // Arrange
        when(folderRepository.findById(1L)).thenReturn(Optional.of(testFolder));
        doNothing().when(folderRepository).deleteById(1L);

        // Act
        assertDoesNotThrow(() -> folderService.deleteFolder("1", "user1"));

        // Assert
        verify(folderRepository).findById(1L);
        verify(folderRepository).deleteById(1L);
    }

    @Test
    void deleteFolder_NonExistingFolder_ThrowsException() {
        // Arrange
        when(folderRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> folderService.deleteFolder("999", "user1"));
        assertEquals("Folder không tồn tại", exception.getMessage());
        verify(folderRepository).findById(999L);
        verify(folderRepository, never()).deleteById(anyLong());
    }

    @Test
    void isPublicFolder_ReturnsTrue() {
        // Arrange
        Folder publicFolder = Folder.builder().id(1L).isPublic(true).build();
        when(folderRepository.findById(1L)).thenReturn(Optional.of(publicFolder));

        // Act
        boolean result = folderService.isPublicFolder(1);

        // Assert
        assertTrue(result);
        verify(folderRepository).findById(1L);
    }

    @Test
    void isPublicFolder_ReturnsFalse() {
        // Arrange
        when(folderRepository.findById(1L)).thenReturn(Optional.of(testFolder));

        // Act
        boolean result = folderService.isPublicFolder(1);

        // Assert
        assertFalse(result);
        verify(folderRepository).findById(1L);
    }

    @Test
    void isPublicFolder_NonExistingFolder_ThrowsException() {
        // Arrange
        when(folderRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> folderService.getFolderById("999"));
        assertEquals("Folder not found", exception.getMessage());
        verify(folderRepository).findById(999L);
    }

    @Test
    void getSubfolders_ReturnsSubfolders() {
        // Arrange
        Folder subfolder1 = Folder.builder().id(2L).name("Subfolder 1").parentId(1L).build();
        Folder subfolder2 = Folder.builder().id(3L).name("Subfolder 2").parentId(1L).build();
        when(folderRepository.findByParentIdAndUserIdAndIsPublicFalseOrderByCreatedAtDesc(1L, "user1"))
                .thenReturn(Arrays.asList(subfolder1, subfolder2));

        // Act
        List<Folder> result = folderService.getSubfoldersByParentId(1L, "user1");

        // Assert
        assertEquals(2, result.size());
        assertTrue(result.contains(subfolder1));
        assertTrue(result.contains(subfolder2));
        verify(folderRepository).findByParentIdAndUserIdAndIsPublicFalseOrderByCreatedAtDesc(1L, "user1");
    }

    @Test
    void getSubfolders_NoSubfolders_ReturnsEmptyList() {
        // Arrange
        when(folderRepository.findByParentIdAndUserIdAndIsPublicFalseOrderByCreatedAtDesc(1L, "user1"))
                .thenReturn(Arrays.asList());

        // Act
        List<Folder> result = folderService.getSubfoldersByParentId(1L, "user1");

        // Assert
        assertTrue(result.isEmpty());
        verify(folderRepository).findByParentIdAndUserIdAndIsPublicFalseOrderByCreatedAtDesc(1L, "user1");
    }
}
