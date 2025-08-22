package com.capstone_project.capstone_project.repository;

import com.capstone_project.capstone_project.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Integer> {

    List<Comment> findByKnowledgeItemIdOrderByCreatedAtDesc(String knowledgeItemId);

    List<Comment> findByKnowledgeItemIdAndParentCommentIdIsNullOrderByCreatedAtDesc(String knowledgeItemId);

    List<Comment> findByParentCommentIdOrderByCreatedAtAsc(Integer parentCommentId);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.knowledgeItemId = :knowledgeItemId")
    long countByKnowledgeItemId(@Param("knowledgeItemId") String knowledgeItemId);

    List<Comment> findByUserIdOrderByCreatedAtDesc(String userId);
}
