package com.capstone_project.capstone_project.repository;

import com.capstone_project.capstone_project.model.Tag;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends CrudRepository<Tag, Integer> {

    Optional<Tag> findByName(String name);

    List<Tag> findByNameContainingIgnoreCase(String name);

    @Query("SELECT t, COUNT(kit.knowledgeItem) as usageCount " +
            "FROM Tag t LEFT JOIN t.knowledgeItemTags kit " +
            "WHERE LOWER(t.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "GROUP BY t.id " +
            "ORDER BY usageCount DESC, t.name ASC")
    List<Object[]> findTagsWithUsageCount(@Param("searchTerm") String searchTerm);

    @Query("SELECT t, COUNT(kit.knowledgeItem) as usageCount " +
            "FROM Tag t LEFT JOIN t.knowledgeItemTags kit " +
            "GROUP BY t.id " +
            "ORDER BY usageCount DESC, t.name ASC")
    List<Object[]> findAllTagsWithUsageCount();
}
