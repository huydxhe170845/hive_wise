package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.enums.KnowledgeVisibility;
import com.capstone_project.capstone_project.model.KnowledgeItem;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.model.Vault;
import com.capstone_project.capstone_project.repository.KnowledgeItemRepository;
import com.capstone_project.capstone_project.repository.UserRepository;
import com.capstone_project.capstone_project.repository.VaultRepository;
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
class KnowledgeItemServiceTest {

    @Mock
    private KnowledgeItemRepository knowledgeItemRepository;

    @Mock
    private VaultRepository vaultRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private KnowledgeItemService knowledgeItemService;

    private User testUser;
    private Vault testVault;
    private KnowledgeItem testKnowledgeItem;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user1")
                .username("testuser")
                .email("test@example.com")
                .build();

        testVault = Vault.builder()
                .id("vault1")
                .name("Test Vault")
                .description("Test Description")
                .build();

        testKnowledgeItem = KnowledgeItem.builder()
                .id("knowledge1")
                .name("Test Knowledge")
                .description("Test Description")
                .content("Test Content")
                .visibility(KnowledgeVisibility.PRIVATE)
                .createdBy("user1")
                .vaultId("vault1")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getKnowledgeItemById_ExistingItem_ReturnsItem() {
        // Arrange
        when(knowledgeItemRepository.findByIdAndIsDeletedFalse("knowledge1"))
                .thenReturn(Optional.of(testKnowledgeItem));

        // Act
        Optional<KnowledgeItem> result = knowledgeItemService.getKnowledgeItemById("knowledge1");

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testKnowledgeItem, result.get());
        verify(knowledgeItemRepository).findByIdAndIsDeletedFalse("knowledge1");
    }

    @Test
    void getKnowledgeItemById_NonExistingItem_ReturnsEmpty() {
        // Arrange
        when(knowledgeItemRepository.findByIdAndIsDeletedFalse("nonexistent")).thenReturn(Optional.empty());

        // Act
        Optional<KnowledgeItem> result = knowledgeItemService.getKnowledgeItemById("nonexistent");

        // Assert
        assertFalse(result.isPresent());
        verify(knowledgeItemRepository).findByIdAndIsDeletedFalse("nonexistent");
    }

    @Test
    void getKnowledgeItemsByVaultId_ReturnsVaultItems() {
        // Arrange
        when(knowledgeItemRepository.findByVaultIdAndIsDeletedFalse("vault1"))
                .thenReturn(Arrays.asList(testKnowledgeItem));

        // Act
        List<KnowledgeItem> result = knowledgeItemService.getKnowledgeItemsByVaultId("vault1");

        // Assert
        assertEquals(1, result.size());
        assertEquals(testKnowledgeItem, result.get(0));
        verify(knowledgeItemRepository).findByVaultIdAndIsDeletedFalse("vault1");
    }

    @Test
    void updateKnowledgeItem_Success() {
        // Arrange
        when(knowledgeItemRepository.findByIdAndIsDeletedFalse("knowledge1"))
                .thenReturn(Optional.of(testKnowledgeItem));
        when(knowledgeItemRepository.save(any(KnowledgeItem.class))).thenReturn(testKnowledgeItem);

        // Act
        KnowledgeItem result = knowledgeItemService.updateKnowledgeItem("knowledge1", "Updated Name",
                "Updated Description", "Updated Content", "user1");

        // Assert
        assertNotNull(result);
        verify(knowledgeItemRepository).save(any(KnowledgeItem.class));
    }

    @Test
    void updateKnowledgeItem_ItemNotFound_ThrowsException() {
        // Arrange
        when(knowledgeItemRepository.findByIdAndIsDeletedFalse("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> knowledgeItemService.updateKnowledgeItem("nonexistent", "Name", "Description", "Content",
                        "user1"));
        assertEquals("Không tìm thấy knowledge item", exception.getMessage());
    }

    @Test
    void deleteKnowledgeItem_Success() {
        // Arrange
        when(knowledgeItemRepository.findByIdAndIsDeletedFalse("knowledge1"))
                .thenReturn(Optional.of(testKnowledgeItem));
        when(knowledgeItemRepository.save(any(KnowledgeItem.class))).thenReturn(testKnowledgeItem);

        // Act
        assertDoesNotThrow(() -> knowledgeItemService.deleteKnowledgeItem("knowledge1", "user1"));

        // Assert
        verify(knowledgeItemRepository).save(any(KnowledgeItem.class));
    }

    @Test
    void deleteKnowledgeItem_ItemNotFound_ThrowsException() {
        // Arrange
        when(knowledgeItemRepository.findByIdAndIsDeletedFalse("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> knowledgeItemService.deleteKnowledgeItem("nonexistent", "user1"));
        assertEquals("Không tìm thấy knowledge item", exception.getMessage());
    }

    @Test
    void getPrivateKnowledgeItems_ReturnsPrivateItems() {
        // Arrange
        when(knowledgeItemRepository.findByVaultIdAndCreatedByAndVisibilityAndIsDeletedFalse("vault1", "user1",
                KnowledgeVisibility.PRIVATE))
                .thenReturn(Arrays.asList(testKnowledgeItem));

        // Act
        List<KnowledgeItem> result = knowledgeItemService.getPrivateKnowledgeItems("vault1", "user1");

        // Assert
        assertEquals(1, result.size());
        assertEquals(testKnowledgeItem, result.get(0));
        verify(knowledgeItemRepository).findByVaultIdAndCreatedByAndVisibilityAndIsDeletedFalse("vault1", "user1",
                KnowledgeVisibility.PRIVATE);
    }

    @Test
    void getAllApprovedOfficialKnowledgeItems_ReturnsApprovedItems() {
        // Arrange
        when(knowledgeItemRepository.findByVaultIdAndApprovalStatusAndIsDeletedFalse("vault1",
                com.capstone_project.capstone_project.enums.KnowledgeApprovalStatus.APPROVED))
                .thenReturn(Arrays.asList(testKnowledgeItem));

        // Act
        List<KnowledgeItem> result = knowledgeItemService.getAllApprovedOfficialKnowledgeItems("vault1");

        // Assert
        assertEquals(1, result.size());
        assertEquals(testKnowledgeItem, result.get(0));
        verify(knowledgeItemRepository).findByVaultIdAndApprovalStatusAndIsDeletedFalse("vault1",
                com.capstone_project.capstone_project.enums.KnowledgeApprovalStatus.APPROVED);
    }
}
