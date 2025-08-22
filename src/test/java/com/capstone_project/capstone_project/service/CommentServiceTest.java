package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.dto.CommentDTO;
import com.capstone_project.capstone_project.model.Comment;
import com.capstone_project.capstone_project.model.KnowledgeItem;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.repository.CommentRepository;
import com.capstone_project.capstone_project.repository.KnowledgeItemRepository;
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
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private KnowledgeItemRepository knowledgeItemRepository;

    @Mock
    private UserService userService;

    @InjectMocks
    private CommentService commentService;

    private User testUser;
    private KnowledgeItem testKnowledgeItem;
    private Comment testComment;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id("user1")
                .username("testuser")
                .email("test@example.com")
                .name("Test User")
                .build();

        testKnowledgeItem = KnowledgeItem.builder()
                .id("knowledge1")
                .name("Test Knowledge")
                .description("Test Description")
                .content("Test Content")
                .createdBy("user1")
                .vaultId("vault1")
                .build();

        testComment = Comment.builder()
                .id(1)
                .content("Test Comment")
                .knowledgeItem(testKnowledgeItem)
                .user(testUser)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void addComment_Success() {
        // Arrange
        when(knowledgeItemRepository.findById("knowledge1")).thenReturn(Optional.of(testKnowledgeItem));
        when(userService.findById("user1")).thenReturn(testUser);
        when(commentRepository.save(any(Comment.class))).thenReturn(testComment);

        // Act
        CommentDTO result = commentService.addComment("knowledge1", "user1", "Test Comment", null);

        // Assert
        assertNotNull(result);
        assertEquals("Test Comment", result.getContent());
        verify(knowledgeItemRepository).findById("knowledge1");
        verify(userService).findById("user1");
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    void addComment_KnowledgeItemNotFound_ThrowsException() {
        // Arrange
        when(knowledgeItemRepository.findById("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> commentService.addComment("nonexistent", "user1", "Test Comment", null));
        assertEquals("Knowledge item not found", exception.getMessage());
        verify(knowledgeItemRepository).findById("nonexistent");
        verify(userService, never()).findById(anyString());
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    void addComment_UserNotFound_ThrowsException() {
        // Arrange
        when(knowledgeItemRepository.findById("knowledge1")).thenReturn(Optional.of(testKnowledgeItem));
        when(userService.findById("nonexistent")).thenReturn(null);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> commentService.addComment("knowledge1", "nonexistent", "Test Comment", null));
        assertEquals("User not found", exception.getMessage());
        verify(knowledgeItemRepository).findById("knowledge1");
        verify(userService).findById("nonexistent");
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    void getCommentsForKnowledge_ReturnsComments() {
        // Arrange
        Comment comment2 = Comment.builder()
                .id(2)
                .content("Another Comment")
                .knowledgeItem(testKnowledgeItem)
                .user(testUser)
                .build();
        when(commentRepository.findByKnowledgeItemIdAndParentCommentIdIsNullOrderByCreatedAtDesc("knowledge1"))
                .thenReturn(Arrays.asList(testComment, comment2));

        // Act
        List<CommentDTO> result = commentService.getCommentsForKnowledge("knowledge1");

        // Assert
        assertEquals(2, result.size());
        assertEquals("Test Comment", result.get(0).getContent());
        assertEquals("Another Comment", result.get(1).getContent());
        verify(commentRepository).findByKnowledgeItemIdAndParentCommentIdIsNullOrderByCreatedAtDesc("knowledge1");
    }

    @Test
    void getCommentsForKnowledge_NoComments_ReturnsEmptyList() {
        // Arrange
        when(commentRepository.findByKnowledgeItemIdAndParentCommentIdIsNullOrderByCreatedAtDesc("knowledge1"))
                .thenReturn(Arrays.asList());

        // Act
        List<CommentDTO> result = commentService.getCommentsForKnowledge("knowledge1");

        // Assert
        assertTrue(result.isEmpty());
        verify(commentRepository).findByKnowledgeItemIdAndParentCommentIdIsNullOrderByCreatedAtDesc("knowledge1");
    }

    @Test
    void updateComment_Success() {
        // Arrange
        when(commentRepository.findById(1)).thenReturn(Optional.of(testComment));
        when(commentRepository.save(any(Comment.class))).thenReturn(testComment);

        // Act
        CommentDTO result = commentService.updateComment(1, "user1", "Updated Comment");

        // Assert
        assertNotNull(result);
        assertEquals("Updated Comment", result.getContent());
        verify(commentRepository).findById(1);
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    void updateComment_CommentNotFound_ThrowsException() {
        // Arrange
        when(commentRepository.findById(999)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> commentService.updateComment(999, "user1", "Updated Comment"));
        assertEquals("Comment not found", exception.getMessage());
        verify(commentRepository).findById(999);
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    void deleteComment_Success() {
        // Arrange
        when(commentRepository.findById(1)).thenReturn(Optional.of(testComment));
        doNothing().when(commentRepository).delete(testComment);

        // Act
        assertDoesNotThrow(() -> commentService.deleteComment(1, "user1"));

        // Assert
        verify(commentRepository).findById(1);
        verify(commentRepository).delete(testComment);
    }

    @Test
    void deleteComment_CommentNotFound_ThrowsException() {
        // Arrange
        when(commentRepository.findById(999)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> commentService.deleteComment(999, "user1"));
        assertEquals("Comment not found", exception.getMessage());
        verify(commentRepository).findById(999);
        verify(commentRepository, never()).delete(any(Comment.class));
    }

    @Test
    void getCommentCount_ReturnsCorrectCount() {
        // Arrange
        when(commentRepository.countByKnowledgeItemId("knowledge1")).thenReturn(5L);

        // Act
        long result = commentService.getCommentCount("knowledge1");

        // Assert
        assertEquals(5L, result);
        verify(commentRepository).countByKnowledgeItemId("knowledge1");
    }
}
