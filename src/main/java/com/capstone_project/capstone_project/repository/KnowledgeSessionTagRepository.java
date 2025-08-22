package com.capstone_project.capstone_project.repository;

import com.capstone_project.capstone_project.model.KnowledgeSessionTag;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface KnowledgeSessionTagRepository extends JpaRepository<KnowledgeSessionTag, Integer> {

    List<KnowledgeSessionTag> findByKnowledgeSessionId(Integer knowledgeSessionId);

}
