
package com.capstone_project.capstone_project.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.capstone_project.capstone_project.model.KnowledgeSession;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.model.Vault;
import com.capstone_project.capstone_project.repository.KnowledgeSessionRepository;

import com.capstone_project.capstone_project.model.Tag;
import com.capstone_project.capstone_project.model.KnowledgeSessionTag;
import com.capstone_project.capstone_project.repository.TagRepository;
import com.capstone_project.capstone_project.repository.KnowledgeSessionTagRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class KnowledgeSessionService {

    KnowledgeSessionRepository knowledgeSessionRepository;
    VaultService vaultService;
    UserService userService;
    TagRepository tagRepository;
    KnowledgeSessionTagRepository knowledgeSessionTagRepository;
    NotificationService notificationService;

    public List<KnowledgeSession> getKnowledgeSessionsByVault(String vaultId) {
        return knowledgeSessionRepository.findByVaultIdOrderByStartTimeDesc(vaultId);
    }

    public List<Tag> getTagsForSession(int sessionId) {
        List<KnowledgeSessionTag> sessionTags = knowledgeSessionTagRepository.findByKnowledgeSessionId(sessionId);
        List<Tag> tags = new ArrayList<>();
        for (KnowledgeSessionTag sessionTag : sessionTags) {
            if (sessionTag.getTag() != null) {
                tags.add(sessionTag.getTag());
            }
        }
        return tags;
    }

    public List<KnowledgeSession> getKnowledgeSessionsByInstructor(String instructorId) {
        return knowledgeSessionRepository.findByInstructorIdOrderByStartTimeDesc(instructorId);
    }

    public List<KnowledgeSession> getKnowledgeSessionsByVaultAndStatus(String vaultId, String status) {
        return knowledgeSessionRepository.findByVaultIdAndStatusOrderByStartTimeDesc(vaultId, status);
    }

    public KnowledgeSession saveSession(KnowledgeSession session) {
        return knowledgeSessionRepository.save(session);
    }

    public KnowledgeSession createKnowledgeSession(
            String title,
            String description,
            String date,
            String time,
            String endDate,
            String endTime,
            String duration,
            String instructorId,
            String meetingLink,
            String tags,
            String vaultId,
            String organizerId) {
        System.out.println("🔧 Service method called with:");
        System.out.println("  date: " + date + ", time: " + time);
        System.out.println("  endDate: " + endDate + ", endTime: " + endTime);
        System.out.println("  duration: " + duration);

        LocalDate sessionDate = LocalDate.parse(date);
        LocalTime sessionTime = LocalTime.parse(time);
        LocalDate sessionEndDate = LocalDate.parse(endDate);
        LocalTime sessionEndTime = LocalTime.parse(endTime);
        int durationMinutes = Integer.parseInt(duration);

        LocalDateTime startTime = LocalDateTime.of(sessionDate, sessionTime);
        LocalDateTime endDateTime = LocalDateTime.of(sessionEndDate, sessionEndTime);

        System.out.println("🕒 Parsed times:");
        System.out.println("  startTime: " + startTime);
        System.out.println("  endDateTime: " + endDateTime);
        System.out.println("  durationMinutes: " + durationMinutes);

        Vault vault = vaultService.getVaultDetailById(vaultId);
        User instructor = userService.findById(instructorId);

        KnowledgeSession session = KnowledgeSession.builder()
                .title(title)
                .description(description)
                .meetingLink(meetingLink)
                .startTime(startTime)
                .endTime(endDateTime)
                .duration(durationMinutes)
                .vault(vault)
                .instructor(instructor)
                .status("Scheduled")
                .createdBy(organizerId)
                .build();

        // Save session first to get its ID
        session = knowledgeSessionRepository.save(session);

        // Save tags if provided (tags is comma-separated string of tag names or IDs)
        if (tags != null && !tags.trim().isEmpty()) {
            String[] tagArr = tags.split(",");
            for (String tagStr : tagArr) {
                String trimmed = tagStr.trim();
                if (!trimmed.isEmpty()) {
                    Tag tag = null;
                    try {
                        // Try to parse as ID
                        int tagId = Integer.parseInt(trimmed);
                        tag = tagRepository.findById(tagId).orElse(null);
                    } catch (NumberFormatException e) {
                        // Otherwise, find by name
                        tag = tagRepository.findByName(trimmed).orElse(null);
                    }
                    if (tag != null) {
                        KnowledgeSessionTag sessionTag = KnowledgeSessionTag.builder()
                                .knowledgeSession(session)
                                .tag(tag)
                                .build();
                        knowledgeSessionTagRepository.save(sessionTag);
                    }
                }
            }
        }

        // Tạo thông báo cho tất cả members trong vault
        notificationService.createSessionCreatedNotification(session);

        return session;
    }

    public void deleteKnowledgeSession(int sessionId) {
        KnowledgeSession session = knowledgeSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        knowledgeSessionRepository.delete(session);
    }

    public KnowledgeSession updateKnowledgeSession(
            int sessionId,
            String title,
            String description,
            String date,
            String time,
            String endDate,
            String endTime,
            String duration,
            String instructorId,
            String meetingLink,
            String tags,
            String vaultId,
            String organizerId) {

        System.out.println("🔧 Update session method called with sessionId: " + sessionId);

        // Find existing session
        KnowledgeSession existingSession = knowledgeSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        System.out.println("  date: " + date + ", time: " + time);
        System.out.println("  endDate: " + endDate + ", endTime: " + endTime);
        System.out.println("  duration: " + duration);

        LocalDate sessionDate = LocalDate.parse(date);
        LocalTime sessionTime = LocalTime.parse(time);
        LocalDate sessionEndDate = LocalDate.parse(endDate);
        LocalTime sessionEndTime = LocalTime.parse(endTime);
        int durationMinutes = Integer.parseInt(duration);

        LocalDateTime startTime = LocalDateTime.of(sessionDate, sessionTime);
        LocalDateTime endDateTime = LocalDateTime.of(sessionEndDate, sessionEndTime);

        Vault vault = vaultService.getVaultDetailById(vaultId);
        User instructor = userService.findById(instructorId);

        // Update existing session fields
        existingSession.setTitle(title);
        existingSession.setDescription(description);
        existingSession.setMeetingLink(meetingLink);
        existingSession.setStartTime(startTime);
        existingSession.setEndTime(endDateTime);
        existingSession.setDuration(durationMinutes);
        existingSession.setVault(vault);
        existingSession.setInstructor(instructor);

        // Save updated session
        existingSession = knowledgeSessionRepository.save(existingSession);

        // Delete existing tags
        List<KnowledgeSessionTag> existingTags = knowledgeSessionTagRepository.findByKnowledgeSessionId(sessionId);
        for (KnowledgeSessionTag tagToDelete : existingTags) {
            knowledgeSessionTagRepository.delete(tagToDelete);
        }

        // Save new tags if provided
        if (tags != null && !tags.trim().isEmpty()) {
            String[] tagArr = tags.split(",");
            for (String tagStr : tagArr) {
                String trimmed = tagStr.trim();
                if (!trimmed.isEmpty()) {
                    Tag tag = null;
                    try {
                        // Try to parse as ID
                        int tagId = Integer.parseInt(trimmed);
                        tag = tagRepository.findById(tagId).orElse(null);
                    } catch (NumberFormatException e) {
                        // Otherwise, find by name
                        tag = tagRepository.findByName(trimmed).orElse(null);
                    }
                    if (tag != null) {
                        KnowledgeSessionTag sessionTag = KnowledgeSessionTag.builder()
                                .knowledgeSession(existingSession)
                                .tag(tag)
                                .build();
                        knowledgeSessionTagRepository.save(sessionTag);
                    }
                }
            }
        }
        return existingSession;
    }

    public List<Map<String, Object>> getCalendarSessionsData(String vaultId) {
        List<KnowledgeSession> allSessions = getKnowledgeSessionsByVault(vaultId);
        List<Map<String, Object>> calendarSessions = new ArrayList<>();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        for (KnowledgeSession session : allSessions) {
            if (session.getStartTime() != null) {
                Map<String, Object> sessionData = new HashMap<>();
                sessionData.put("id", session.getId());
                sessionData.put("title", session.getTitle());
                sessionData.put("description", session.getDescription());
                sessionData.put("startDate", session.getStartTime().toLocalDate().format(dateFormatter));
                sessionData.put("startTime", session.getStartTime().toLocalTime().format(timeFormatter));
                sessionData.put("endDate",
                        session.getEndTime() != null ? session.getEndTime().toLocalDate().format(dateFormatter)
                                : session.getStartTime().toLocalDate().format(dateFormatter));
                sessionData.put("endTime",
                        session.getEndTime() != null ? session.getEndTime().toLocalTime().format(timeFormatter) : "");
                sessionData.put("durationMinutes", session.getDuration());

                // Add instructor name and avatar
                if (session.getInstructor() != null) {
                    // Add instructor ID
                    sessionData.put("instructorId", session.getInstructor().getId());

                    String instructorName = session.getInstructor().getName();
                    if (instructorName == null || instructorName.trim().isEmpty()) {
                        // Fallback to Google name fields if available
                        String googleFirstName = session.getInstructor().getGoogleFirstName();
                        String googleFamilyName = session.getInstructor().getGoogleFamilyName();
                        if (googleFirstName != null && googleFamilyName != null) {
                            instructorName = googleFirstName + " " + googleFamilyName;
                        } else if (googleFirstName != null) {
                            instructorName = googleFirstName;
                        } else {
                            instructorName = session.getInstructor().getUsername();
                        }
                    }
                    sessionData.put("instructor", instructorName);

                    // Add instructor avatar - use profile image if available
                    String instructorAvatar = session.getInstructor().getAvatar();
                    if (instructorAvatar != null && !instructorAvatar.trim().isEmpty()) {
                        sessionData.put("instructorAvatar", instructorAvatar);
                    } else {
                        sessionData.put("instructorAvatar", null);
                    }
                } else {
                    sessionData.put("instructorId", "");
                    sessionData.put("instructor", "");
                    sessionData.put("instructorAvatar", null);
                }

                // Add meeting link
                String meetingLink = session.getMeetingLink();
                if (meetingLink != null && !meetingLink.trim().isEmpty()) {
                    sessionData.put("meetingLink", meetingLink);
                } else {
                    sessionData.put("meetingLink", null);
                }

                // Get tags for this session through relationship
                List<Tag> sessionTags = getTagsForSession(session.getId());
                List<String> tagNames = sessionTags.stream()
                        .map(Tag::getName)
                        .collect(Collectors.toList());
                sessionData.put("tags", tagNames);

                calendarSessions.add(sessionData);
            }
        }

        return calendarSessions;
    }

    public List<Map<String, Object>> getCalendarSessionsDataByWeek(String vaultId, LocalDate weekStart,
            LocalDate weekEnd) {
        List<KnowledgeSession> allSessions = getKnowledgeSessionsByVault(vaultId);
        List<Map<String, Object>> calendarSessions = new ArrayList<>();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        for (KnowledgeSession session : allSessions) {
            if (session.getStartTime() != null) {
                LocalDate sessionDate = session.getStartTime().toLocalDate();

                // Only include sessions that fall within the specified week
                if (sessionDate.isBefore(weekStart) || sessionDate.isAfter(weekEnd)) {
                    continue;
                }

                Map<String, Object> sessionData = new HashMap<>();
                sessionData.put("id", session.getId());
                sessionData.put("title", session.getTitle());
                sessionData.put("description", session.getDescription());
                sessionData.put("startDate", session.getStartTime().toLocalDate().format(dateFormatter));
                sessionData.put("startTime", session.getStartTime().toLocalTime().format(timeFormatter));
                sessionData.put("endDate",
                        session.getEndTime() != null ? session.getEndTime().toLocalDate().format(dateFormatter)
                                : session.getStartTime().toLocalDate().format(dateFormatter));
                sessionData.put("endTime",
                        session.getEndTime() != null ? session.getEndTime().toLocalTime().format(timeFormatter) : "");
                sessionData.put("durationMinutes", session.getDuration());

                // Add instructor name and avatar
                if (session.getInstructor() != null) {
                    // Add instructor ID
                    sessionData.put("instructorId", session.getInstructor().getId());

                    String instructorName = session.getInstructor().getName();
                    if (instructorName == null || instructorName.trim().isEmpty()) {
                        // Fallback to Google name fields if available
                        String googleFirstName = session.getInstructor().getGoogleFirstName();
                        String googleFamilyName = session.getInstructor().getGoogleFamilyName();
                        if (googleFirstName != null && googleFamilyName != null) {
                            instructorName = googleFirstName + " " + googleFamilyName;
                        } else if (googleFirstName != null) {
                            instructorName = googleFirstName;
                        } else {
                            instructorName = session.getInstructor().getUsername();
                        }
                    }
                    sessionData.put("instructor", instructorName);

                    // Add instructor avatar - use profile image if available
                    String instructorAvatar = session.getInstructor().getAvatar();
                    if (instructorAvatar != null && !instructorAvatar.trim().isEmpty()) {
                        sessionData.put("instructorAvatar", instructorAvatar);
                    } else {
                        sessionData.put("instructorAvatar", null);
                    }
                } else {
                    sessionData.put("instructorId", "");
                    sessionData.put("instructor", "");
                    sessionData.put("instructorAvatar", null);
                }

                // Add meeting link
                String meetingLink = session.getMeetingLink();
                if (meetingLink != null && !meetingLink.trim().isEmpty()) {
                    sessionData.put("meetingLink", meetingLink);
                } else {
                    sessionData.put("meetingLink", null);
                }

                // Get tags for this session through relationship
                List<Tag> sessionTags = getTagsForSession(session.getId());
                List<String> tagNames = sessionTags.stream()
                        .map(Tag::getName)
                        .collect(Collectors.toList());
                sessionData.put("tags", tagNames);

                calendarSessions.add(sessionData);
            }
        }

        return calendarSessions;
    }

}
