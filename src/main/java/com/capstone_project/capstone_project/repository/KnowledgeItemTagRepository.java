package com.capstone_project.capstone_project.repository;

import com.capstone_project.capstone_project.model.KnowledgeItemTag;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface KnowledgeItemTagRepository extends CrudRepository<KnowledgeItemTag, Integer> {

    List<KnowledgeItemTag> findByKnowledgeItemId(String knowledgeItemId);

    void deleteByKnowledgeItemId(String knowledgeItemId);

    void deleteByKnowledgeItemIdAndTagId(String knowledgeItemId, Integer tagId);
}
