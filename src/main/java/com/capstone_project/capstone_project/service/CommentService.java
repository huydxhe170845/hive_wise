package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.dto.CommentDTO;
import com.capstone_project.capstone_project.model.Comment;
import com.capstone_project.capstone_project.model.KnowledgeItem;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.repository.CommentRepository;
import com.capstone_project.capstone_project.repository.KnowledgeItemRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentService {

    CommentRepository commentRepository;
    KnowledgeItemRepository knowledgeItemRepository;
    UserService userService;

    public CommentDTO addComment(String knowledgeItemId, String userId, String content, Integer parentCommentId) {
        // Validate knowledge item exists
        Optional<KnowledgeItem> knowledgeItem = knowledgeItemRepository.findById(knowledgeItemId);
        if (knowledgeItem.isEmpty()) {
            throw new IllegalArgumentException("Knowledge item not found");
        }

        // Validate user exists
        User user = userService.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        // Validate parent comment if provided
        if (parentCommentId != null) {
            Optional<Comment> parentComment = commentRepository.findById(parentCommentId);
            if (parentComment.isEmpty()) {
                throw new IllegalArgumentException("Parent comment not found");
            }
        }

        Comment comment = Comment.builder()
                .knowledgeItem(knowledgeItem.get())
                .user(user)
                .content(content.trim())
                .parentCommentId(parentCommentId)
                .isEdited(false)
                .createdAt(LocalDateTime.now())
                .build();

        Comment savedComment = commentRepository.save(comment);
        return convertToDTO(savedComment);
    }

    public List<CommentDTO> getCommentsForKnowledge(String knowledgeItemId) {
        // Get top-level comments (no parent)
        List<Comment> topLevelComments = commentRepository
                .findByKnowledgeItemIdAndParentCommentIdIsNullOrderByCreatedAtDesc(knowledgeItemId);

        return topLevelComments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public CommentDTO updateComment(Integer commentId, String userId, String newContent) {
        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            throw new IllegalArgumentException("Comment not found");
        }

        Comment comment = commentOpt.get();

        // Check if user owns this comment
        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only edit your own comments");
        }

        comment.setContent(newContent.trim());
        comment.setEdited(true);
        comment.setUpdatedAt(LocalDateTime.now());

        Comment updatedComment = commentRepository.save(comment);
        return convertToDTO(updatedComment);
    }

    public void deleteComment(Integer commentId, String userId) {
        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            throw new IllegalArgumentException("Comment not found");
        }

        Comment comment = commentOpt.get();

        // Check if user owns this comment
        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }

    public long getCommentCount(String knowledgeItemId) {
        return commentRepository.countByKnowledgeItemId(knowledgeItemId);
    }

    private CommentDTO convertToDTO(Comment comment) {
        // Get replies for this comment
        List<Comment> replies = commentRepository.findByParentCommentIdOrderByCreatedAtAsc(comment.getId());
        List<CommentDTO> replyDTOs = replies.stream()
                .map(reply -> CommentDTO.builder()
                        .id(reply.getId())
                        .content(reply.getContent())
                        .createdAt(reply.getCreatedAt())
                        .updatedAt(reply.getUpdatedAt())
                        .isEdited(reply.isEdited())
                        .parentCommentId(reply.getParentCommentId())
                        .userId(reply.getUser().getId())
                        .username(reply.getUser().getUsername())
                        .userEmail(reply.getUser().getEmail())
                        .userAvatar(reply.getUser().getAvatar())
                        .build())
                .collect(Collectors.toList());

        return CommentDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .isEdited(comment.isEdited())
                .parentCommentId(comment.getParentCommentId())
                .userId(comment.getUser().getId())
                .username(comment.getUser().getUsername())
                .userEmail(comment.getUser().getEmail())
                .userAvatar(comment.getUser().getAvatar())
                .replies(replyDTOs)
                .build();
    }
}
