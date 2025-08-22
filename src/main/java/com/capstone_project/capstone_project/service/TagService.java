package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.model.Tag;
import com.capstone_project.capstone_project.repository.TagRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TagService {

    TagRepository tagRepository;

    public Tag createTag(String name) {
        // Check if tag already exists
        Optional<Tag> existingTag = tagRepository.findByName(name.trim());
        if (existingTag.isPresent()) {
            return existingTag.get();
        }

        Tag tag = Tag.builder()
                .name(name.trim())
                .build();

        return tagRepository.save(tag);
    }

    public Optional<Tag> findByName(String name) {
        return tagRepository.findByName(name.trim());
    }

    public List<Tag> searchTags(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return new ArrayList<>();
        }
        return tagRepository.findByNameContainingIgnoreCase(searchTerm.trim());
    }

    public List<Map<String, Object>> getTagsWithUsageCount(String searchTerm) {
        List<Object[]> results;

        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            results = tagRepository.findAllTagsWithUsageCount();
        } else {
            results = tagRepository.findTagsWithUsageCount(searchTerm.trim());
        }

        List<Map<String, Object>> tagList = new ArrayList<>();
        for (Object[] result : results) {
            Tag tag = (Tag) result[0];
            Long count = (Long) result[1];

            Map<String, Object> tagMap = new HashMap<>();
            tagMap.put("id", tag.getId());
            tagMap.put("name", tag.getName());
            tagMap.put("count", count);

            tagList.add(tagMap);
        }

        return tagList;
    }

    public List<Tag> findOrCreateTags(List<String> tagNames) {
        List<Tag> tags = new ArrayList<>();

        for (String tagName : tagNames) {
            String trimmedName = tagName.trim();
            if (!trimmedName.isEmpty()) {
                Optional<Tag> existingTag = tagRepository.findByName(trimmedName);
                if (existingTag.isPresent()) {
                    tags.add(existingTag.get());
                } else {
                    Tag newTag = createTag(trimmedName);
                    tags.add(newTag);
                }
            }
        }

        return tags;
    }

    public List<Tag> getAllTags() {
        List<Tag> tags = new ArrayList<>();
        tagRepository.findAll().forEach(tags::add);
        return tags;
    }
}
