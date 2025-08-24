package com.capstone_project.capstone_project.controller;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import com.capstone_project.capstone_project.model.Folder;
import com.capstone_project.capstone_project.model.KnowledgeItem;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.security.CustomUserDetails;
import com.capstone_project.capstone_project.service.FolderService;
import com.capstone_project.capstone_project.service.VaultService;
import com.capstone_project.capstone_project.service.KnowledgeItemService;
import com.capstone_project.capstone_project.service.UserVaultRoleService;
import com.capstone_project.capstone_project.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.ResponseBody;
import java.util.Optional;
import jakarta.servlet.http.HttpServletRequest;
import com.capstone_project.capstone_project.model.ChatSession;
import com.capstone_project.capstone_project.dto.ChatSessionDTO;
import com.capstone_project.capstone_project.dto.ChatMessageDTO;
import com.capstone_project.capstone_project.service.AssistantService;
import com.capstone_project.capstone_project.service.TagService;
import com.capstone_project.capstone_project.service.KnowledgeSessionService;
import com.capstone_project.capstone_project.service.KnowledgeInteractionService;
import com.capstone_project.capstone_project.service.KnowledgeViewService;
import com.capstone_project.capstone_project.model.KnowledgeSession;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Autowired;

@Controller
@RequestMapping(path = "/vault-detail")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VaultDetailController {
    VaultService vaultService;
    FolderService folderService;
    KnowledgeItemService knowledgeItemService;
    UserVaultRoleService userVaultRoleService;
    UserService userService;
    TagService tagService;
    KnowledgeSessionService knowledgeSessionService;
    KnowledgeInteractionService knowledgeInteractionService;
    KnowledgeViewService knowledgeViewService;
    @Autowired
    private AssistantService assistantService;

    @GetMapping(path = "")
    public String vaultManagement(Model model, @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("id") String vaultId,
            @RequestParam(value = "folder", required = false) Integer folderId,
            @RequestParam(value = "private", required = false) Boolean showPrivate,
            @RequestParam(value = "official", required = false) Boolean showOfficial,
            @RequestParam(value = "bin", required = false) Boolean showBin,
            @RequestParam(value = "reject", required = false) Boolean showReject,
            @RequestParam(value = "sessions", required = false) Boolean showSessions,
            RedirectAttributes redirectAttributes) {
        try {
            var vault = vaultService.getVaultDetailById(vaultId);
            if (vault != null && !vault.isActivated()) {
                model.addAttribute("vaultName", vault.getName());
                model.addAttribute("vaultId", vault.getId());
                return "reactivate-vault";
            }

            List<Folder> publicFolders = folderService.getPublicFolderTreeByVaultId(vaultId);
            List<Folder> personalFolders = folderService.getFolderTreeByParentIdAndVaultId(null, userDetails.getId(),
                    vaultId);
            List<KnowledgeItem> knowledgeItems;

            if (Boolean.TRUE.equals(showSessions)) {
                List<KnowledgeSession> allSessions = knowledgeSessionService.getKnowledgeSessionsByVault(vaultId);
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                List<KnowledgeSession> upcomingSessions = new ArrayList<>();
                List<KnowledgeSession> pastSessions = new ArrayList<>();

                List<Map<String, Object>> upcomingSessionsWithTags = new ArrayList<>();
                List<Map<String, Object>> pastSessionsWithTags = new ArrayList<>();

                for (KnowledgeSession session : allSessions) {
                    Map<String, Object> sessionMap = new HashMap<>();
                    sessionMap.put("id", session.getId());
                    sessionMap.put("title", session.getTitle());
                    sessionMap.put("description", session.getDescription());
                    sessionMap.put("startTime", session.getStartTime());
                    sessionMap.put("endTime", session.getEndTime());
                    sessionMap.put("duration", session.getDuration());
                    sessionMap.put("instructor", session.getInstructor());
                    sessionMap.put("meetingLink", session.getMeetingLink());
                    sessionMap.put("status", session.getStatus());
                    sessionMap.put("vault", session.getVault());

                    List<com.capstone_project.capstone_project.model.Tag> sessionTags = knowledgeSessionService
                            .getTagsForSession(session.getId());
                    sessionMap.put("tags", sessionTags);

                    if (session.getEndTime() != null && session.getEndTime().isAfter(now)) {
                        upcomingSessions.add(session);
                        upcomingSessionsWithTags.add(sessionMap);
                    } else {
                        pastSessions.add(session);
                        pastSessionsWithTags.add(sessionMap);
                    }
                }

                model.addAttribute("upcomingSessions", upcomingSessions);
                model.addAttribute("pastSessions", pastSessions);
                model.addAttribute("upcomingSessionsWithTags", upcomingSessionsWithTags);
                model.addAttribute("pastSessionsWithTags", pastSessionsWithTags);
                model.addAttribute("showSessions", true);
                knowledgeItems = List.of();
            } else if (folderId != null) {
                Folder currentFolder = folderService.getFolderById(folderId.toString());
                model.addAttribute("currentFolderName", currentFolder.getName());
                List<Folder> folderPath = folderService.getFolderPath(Long.valueOf(folderId));
                model.addAttribute("currentFolderPath", folderPath);
                if (Boolean.TRUE.equals(showPrivate)) {
                    knowledgeItems = knowledgeItemService.getPrivateFolderKnowledgeItems(vaultId, folderId,
                            userDetails.getId());
                    model.addAttribute("showPrivate", true);
                } else if (Boolean.TRUE.equals(showOfficial)) {
                    knowledgeItems = knowledgeItemService.getAllApprovedOfficialKnowledgeItemsByFolder(vaultId,
                            folderId);
                    model.addAttribute("showOfficial", true);
                } else {
                    knowledgeItems = knowledgeItemService.getPrivateFolderKnowledgeItems(vaultId, folderId,
                            userDetails.getId());
                }
            } else if (Boolean.TRUE.equals(showPrivate)) {
                knowledgeItems = knowledgeItemService.getPrivateKnowledgeItems(vaultId, userDetails.getId());
                model.addAttribute("showPrivate", true);
            } else if (Boolean.TRUE.equals(showOfficial)) {

                knowledgeItems = knowledgeItemService.getAllApprovedOfficialKnowledgeItems(vaultId);
                model.addAttribute("showOfficial", true);
            } else if (Boolean.TRUE.equals(showBin)) {
                knowledgeItems = knowledgeItemService.getTrashFolderByCreateByAndVaultId(userDetails.getId(), vaultId);
                model.addAttribute("showBin", true);
            } else if (Boolean.TRUE.equals(showReject)) {
                knowledgeItems = knowledgeItemService.getRejectedKnowledge(vaultId);
                model.addAttribute("showReject", true);
            } else {
                knowledgeItems = knowledgeItemService.getPrivateKnowledgeItems(vaultId, userDetails.getId());
            }
            model.addAttribute("publicFolders", publicFolders);
            model.addAttribute("personalFolders", personalFolders);
            model.addAttribute("vault", vaultService.getVaultDetailById(vaultId));
            model.addAttribute("knowledgeItems", knowledgeItems);
            String userRole = userVaultRoleService.getRoleInVault(userDetails.getId(), vaultId);
            model.addAttribute("userRole", userRole);

            User currentUser = userService.findById(userDetails.getId());
            model.addAttribute("currentUser", currentUser);

            List<KnowledgeItem> pendingKnowledge;
            boolean canViewPendingApproval = false;

            if ("VAULT_OWNER".equalsIgnoreCase(userRole) || "EXPERT".equalsIgnoreCase(userRole)) {
                canViewPendingApproval = true;
                if (Boolean.TRUE.equals(showPrivate)) {

                    pendingKnowledge = knowledgeItemService.getPendingApprovalKnowledgeByUser(vaultId,
                            userDetails.getId());
                } else if (Boolean.TRUE.equals(showOfficial)) {

                    pendingKnowledge = knowledgeItemService.getPendingApprovalKnowledge(vaultId);
                } else {
                    pendingKnowledge = knowledgeItemService.getPendingApprovalKnowledge(vaultId);
                }
            } else if ("BUILDER".equalsIgnoreCase(userRole) && Boolean.TRUE.equals(showPrivate)) {

                canViewPendingApproval = true;
                pendingKnowledge = knowledgeItemService.getPendingApprovalKnowledgeByUser(vaultId, userDetails.getId());
            } else {
                pendingKnowledge = List.of();
            }

            model.addAttribute("pendingKnowledge", pendingKnowledge);
            model.addAttribute("canViewPendingApproval", canViewPendingApproval);
            if (canViewPendingApproval) {
                Map<String, String> pendingUserInfo = createUserInfoMap(pendingKnowledge);
                model.addAttribute("pendingUserInfo", pendingUserInfo);
            }

            List<KnowledgeItem> approvedKnowledge;
            if (Boolean.TRUE.equals(showPrivate)) {

                if (folderId != null) {
                    approvedKnowledge = knowledgeItemService.getApprovedPrivateKnowledgeByUserAndFolder(vaultId,
                            userDetails.getId(), folderId);
                } else {
                    approvedKnowledge = knowledgeItemService.getApprovedPrivateKnowledgeByUser(vaultId,
                            userDetails.getId());
                }
            } else if (Boolean.TRUE.equals(showOfficial)) {

                approvedKnowledge = List.of();
            } else {
                approvedKnowledge = knowledgeItemService.getApprovedKnowledge(vaultId);
            }

            model.addAttribute("approvedKnowledge", approvedKnowledge);
            model.addAttribute("hideApprovalTab", Boolean.TRUE.equals(showOfficial));
            Map<String, String> approvedUserInfo = createUserInfoMap(approvedKnowledge);
            model.addAttribute("approvedUserInfo", approvedUserInfo);

            // Handle rejected knowledge
            List<KnowledgeItem> rejectedKnowledge;
            if (folderId != null) {
                rejectedKnowledge = knowledgeItemService.getRejectedKnowledgeByFolder(vaultId, folderId);
            } else {
                rejectedKnowledge = knowledgeItemService.getRejectedKnowledge(vaultId);
            }
            model.addAttribute("rejectedKnowledge", rejectedKnowledge);
            Map<String, String> rejectedUserInfo = createUserInfoMap(rejectedKnowledge);
            model.addAttribute("rejectedUserInfo", rejectedUserInfo);

            Map<String, String> allUserInfo = createUserInfoMap(knowledgeItems);
            model.addAttribute("allUserInfo", allUserInfo);

            List<KnowledgeItem> draftKnowledge = List.of();
            if (Boolean.TRUE.equals(showPrivate)) {
                if (folderId != null) {
                    draftKnowledge = knowledgeItemService.getDraftKnowledgeItemsByFolder(vaultId,
                            userDetails.getId(), folderId);
                } else {
                    draftKnowledge = knowledgeItemService.getDraftKnowledgeItems(vaultId, userDetails.getId());
                }
            }
            model.addAttribute("draftKnowledge", draftKnowledge);

            if (model.containsAttribute("showToast")) {
            }

            // Add calendar sessions data for JavaScript
            try {
                List<Map<String, Object>> calendarSessions = knowledgeSessionService.getCalendarSessionsData(vaultId);
                ObjectMapper mapper = new ObjectMapper();
                mapper.registerModule(new JavaTimeModule());
                String calendarSessionsJson = mapper.writeValueAsString(calendarSessions);
                model.addAttribute("calendarSessionsJson", calendarSessionsJson);
            } catch (Exception e) {
                // Log error and continue
                System.err.println("Error processing calendar sessions: " + e.getMessage());
                model.addAttribute("calendarSessionsJson", "[]");
            }
        } catch (IllegalArgumentException e) {
            model.addAttribute("errorMessage", "Vault not found with ID: " + vaultId);
            return "vault-management";
        }
        return "vault-detail";
    }

    @GetMapping("/get-knowledge")
    @ResponseBody
    public ResponseEntity<?> getKnowledge(@RequestParam("id") String id) {
        Optional<KnowledgeItem> item = knowledgeItemService.getKnowledgeItemById(id);
        if (item.isPresent()) {
            return ResponseEntity.ok(item.get());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/tags")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getTags(
            @RequestParam(value = "search", required = false) String searchTerm) {
        try {
            List<Map<String, Object>> tags = tagService.getTagsWithUsageCount(searchTerm);
            return ResponseEntity.ok(tags);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/session/{sessionId}/tags")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getSessionTags(@PathVariable int sessionId) {
        try {
            List<com.capstone_project.capstone_project.model.Tag> tags = knowledgeSessionService
                    .getTagsForSession(sessionId);
            List<Map<String, Object>> tagList = new ArrayList<>();
            for (com.capstone_project.capstone_project.model.Tag tag : tags) {
                Map<String, Object> tagMap = new HashMap<>();
                tagMap.put("id", tag.getId());
                tagMap.put("name", tag.getName());
                tagList.add(tagMap);
            }
            return ResponseEntity.ok(tagList);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping(path = "/create-folder")
    public String createFolder(@RequestParam("folderName") String folderName,
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            if (folderName == null || folderName.trim().isEmpty()) {
                redirectAttributes.addAttribute("error", "true");
                redirectAttributes.addAttribute("message", "Tên folder không được để trống");
                redirectAttributes.addAttribute("type", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            if (folderName.length() > 50) {
                redirectAttributes.addAttribute("error", "true");
                redirectAttributes.addAttribute("message", "Tên folder không được quá 50 ký tự");
                redirectAttributes.addAttribute("type", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            Folder folder = folderService.createFolder(folderName.trim(), vaultId, userDetails.getId());

            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Tạo folder '" + folder.getName() + "' thành công!");
            redirectAttributes.addFlashAttribute("toastType", "success");
            return "redirect:/vault-detail?id=" + vaultId + "&folder=" + folder.getId() + "&private=true";
        } catch (RuntimeException e) {
            System.err.println("Error creating folder: " + e.getMessage());
            redirectAttributes.addAttribute("error", "true");
            redirectAttributes.addAttribute("message", e.getMessage());
            redirectAttributes.addAttribute("type", "error");
            return "redirect:/vault-detail?id=" + vaultId;
        } catch (Exception e) {
            System.err.println("Error creating folder: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addAttribute("error", "true");
            redirectAttributes.addAttribute("message", "Có lỗi xảy ra khi tạo folder: " + e.getMessage());
            redirectAttributes.addAttribute("type", "error");
            return "redirect:/vault-detail?id=" + vaultId;
        }
    }

    @PostMapping(path = "/delete-folder")
    public String deleteFolder(@RequestParam("folderId") String folderId,
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            if (folderId == null || folderId.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("showToast", true);
                redirectAttributes.addFlashAttribute("toastMessage", "ID folder không được để trống");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            Folder folder = folderService.getFolderById(folderId);
            String folderName = folder.getName();
            boolean isPublic = folder.getIsPublic() != null && folder.getIsPublic();
            folderService.deleteFolder(folderId, userDetails.getId());
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Xóa folder '" + folderName + "' thành công!");
            redirectAttributes.addFlashAttribute("toastType", "success");
            return "redirect:/vault-detail?id=" + vaultId + (isPublic ? "&official=true" : "&private=true");
        } catch (RuntimeException e) {
            System.err.println("Error deleting folder: " + e.getMessage());
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
            try {
                Folder folder = folderService.getFolderById(folderId);
                boolean isPublic = folder.getIsPublic() != null && folder.getIsPublic();
                return "redirect:/vault-detail?id=" + vaultId + (isPublic ? "&official=true" : "&private=true");
            } catch (Exception ex) {
                return "redirect:/vault-detail?id=" + vaultId + "&private=true";
            }
        } catch (Exception e) {
            System.err.println("Error deleting folder: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Có lỗi xảy ra khi xóa folder: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
            try {
                Folder folder = folderService.getFolderById(folderId);
                boolean isPublic = folder.getIsPublic() != null && folder.getIsPublic();
                return "redirect:/vault-detail?id=" + vaultId + (isPublic ? "&official=true" : "&private=true");
            } catch (Exception ex) {
                return "redirect:/vault-detail?id=" + vaultId + "&private=true";
            }
        }
    }

    @PostMapping(path = "/rename-folder")
    public String renameFolder(@RequestParam("folderId") String folderId,
            @RequestParam("newName") String newName,
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            if (newName == null || newName.trim().isEmpty()) {
                redirectAttributes.addAttribute("error", "true");
                redirectAttributes.addAttribute("message", "Tên folder không được để trống");
                redirectAttributes.addAttribute("type", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }

            if (newName.length() > 50) {
                redirectAttributes.addAttribute("error", "true");
                redirectAttributes.addAttribute("message", "Tên folder không được quá 50 ký tự");
                redirectAttributes.addAttribute("type", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }

            // Xác định loại folder trước khi rename
            Folder folder = folderService.getFolderById(folderId);
            boolean isPublic = folder.getIsPublic() != null && folder.getIsPublic();

            folderService.renameFolder(folderId, newName.trim(), userDetails.getId());
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Đổi tên folder thành công!");
            redirectAttributes.addFlashAttribute("toastType", "success");
            return "redirect:/vault-detail?id=" + vaultId + (isPublic ? "&official=true" : "&private=true");
        } catch (RuntimeException e) {
            System.err.println("Error renaming folder: " + e.getMessage());
            redirectAttributes.addAttribute("error", "true");
            redirectAttributes.addAttribute("message", e.getMessage());
            redirectAttributes.addAttribute("type", "error");
            // Try to determine folder type for error redirect
            try {
                Folder folder = folderService.getFolderById(folderId);
                boolean isPublic = folder.getIsPublic() != null && folder.getIsPublic();
                return "redirect:/vault-detail?id=" + vaultId + (isPublic ? "&official=true" : "&private=true");
            } catch (Exception ex) {
                return "redirect:/vault-detail?id=" + vaultId + "&private=true";
            }
        } catch (Exception e) {
            System.err.println("Error renaming folder: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addAttribute("error", "true");
            redirectAttributes.addAttribute("message", "Có lỗi xảy ra khi đổi tên folder: " + e.getMessage());
            redirectAttributes.addAttribute("type", "error");
            // Try to determine folder type for error redirect
            try {
                Folder folder = folderService.getFolderById(folderId);
                boolean isPublic = folder.getIsPublic() != null && folder.getIsPublic();
                return "redirect:/vault-detail?id=" + vaultId + (isPublic ? "&official=true" : "&private=true");
            } catch (Exception ex) {
                return "redirect:/vault-detail?id=" + vaultId + "&private=true";
            }
        }
    }

    @PostMapping(path = "/add-subfolder")
    public String addSubfolder(@RequestParam("folderId") String folderId,
            @RequestParam("subfolderName") String subfolderName,
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            if (folderId == null || folderId.trim().isEmpty()) {
                redirectAttributes.addAttribute("error", "true");
                redirectAttributes.addAttribute("message", "ID folder không được để trống");
                redirectAttributes.addAttribute("type", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            if (subfolderName == null || subfolderName.trim().isEmpty()) {
                redirectAttributes.addAttribute("error", "true");
                redirectAttributes.addAttribute("message", "Tên subfolder không được để trống");
                redirectAttributes.addAttribute("type", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            if (subfolderName.length() > 50) {
                redirectAttributes.addAttribute("error", "true");
                redirectAttributes.addAttribute("message", "Tên subfolder không được quá 50 ký tự");
                redirectAttributes.addAttribute("type", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            Folder subfolder = folderService.addSubfolder(folderId, subfolderName.trim(), userDetails.getId());
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage",
                    "Tạo subfolder '" + subfolder.getName() + "' thành công!");
            redirectAttributes.addFlashAttribute("toastType", "success");
            return "redirect:/vault-detail?id=" + vaultId + "&folder=" + subfolder.getId() + "&private=true";
        } catch (RuntimeException e) {
            System.err.println("Error creating subfolder: " + e.getMessage());
            redirectAttributes.addAttribute("error", "true");
            redirectAttributes.addAttribute("message", e.getMessage());
            redirectAttributes.addAttribute("type", "error");
            return "redirect:/vault-detail?id=" + vaultId;
        } catch (Exception e) {
            System.err.println("Error creating subfolder: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addAttribute("error", "true");
            redirectAttributes.addAttribute("message", "Có lỗi xảy ra khi tạo subfolder: " + e.getMessage());
            redirectAttributes.addAttribute("type", "error");
            return "redirect:/vault-detail?id=" + vaultId;
        }
    }

    // ================== PUBLIC FOLDER MANAGEMENT ==================

    @PostMapping(path = "/create-public-folder")
    public String createPublicFolder(@RequestParam("folderName") String folderName,
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            if (folderName == null || folderName.trim().isEmpty()) {
                redirectAttributes.addAttribute("error", "true");
                redirectAttributes.addAttribute("message", "Tên folder không được để trống");
                redirectAttributes.addAttribute("type", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            if (folderName.length() > 50) {
                redirectAttributes.addAttribute("error", "true");
                redirectAttributes.addAttribute("message", "Tên folder không được quá 50 ký tự");
                redirectAttributes.addAttribute("type", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            Folder folder = folderService.createPublicFolder(folderName.trim(), vaultId);
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage",
                    "Tạo folder public '" + folder.getName() + "' thành công!");
            redirectAttributes.addFlashAttribute("toastType", "success");
            return "redirect:/vault-detail?id=" + vaultId + "&folder=" + folder.getId() + "&official=true";
        } catch (RuntimeException e) {
            System.err.println("Error creating public folder: " + e.getMessage());
            redirectAttributes.addAttribute("error", "true");
            redirectAttributes.addAttribute("message", e.getMessage());
            redirectAttributes.addAttribute("type", "error");
            return "redirect:/vault-detail?id=" + vaultId;
        } catch (Exception e) {
            System.err.println("Error creating public folder: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addAttribute("error", "true");
            redirectAttributes.addAttribute("message", "Có lỗi xảy ra khi tạo folder public: " + e.getMessage());
            redirectAttributes.addAttribute("type", "error");
            return "redirect:/vault-detail?id=" + vaultId;
        }
    }

    @PostMapping(path = "/delete-public-folder")
    public String deletePublicFolder(@RequestParam("folderId") String folderId,
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            if (folderId == null || folderId.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("showToast", true);
                redirectAttributes.addFlashAttribute("toastMessage", "ID folder không được để trống");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            Folder folder = folderService.getFolderById(folderId);
            if (folder.getIsPublic() == null || !folder.getIsPublic()) {
                redirectAttributes.addFlashAttribute("showToast", true);
                redirectAttributes.addFlashAttribute("toastMessage", "Folder này không phải public folder");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            String folderName = folder.getName();
            folderService.deletePublicFolder(folderId);
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Xóa folder public '" + folderName + "' thành công!");
            redirectAttributes.addFlashAttribute("toastType", "success");
            return "redirect:/vault-detail?id=" + vaultId + "&official=true";
        } catch (RuntimeException e) {
            System.err.println("Error deleting public folder: " + e.getMessage());
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
            return "redirect:/vault-detail?id=" + vaultId + "&official=true";
        } catch (Exception e) {
            System.err.println("Error deleting public folder: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage",
                    "Có lỗi xảy ra khi xóa folder public: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
            return "redirect:/vault-detail?id=" + vaultId + "&official=true";
        }
    }

    @PostMapping(path = "/rename-public-folder")
    public String renamePublicFolder(@RequestParam("folderId") String folderId,
            @RequestParam("newName") String newName,
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            if (newName == null || newName.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("showToast", true);
                redirectAttributes.addFlashAttribute("toastMessage", "Tên folder không được để trống");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            if (newName.length() > 50) {
                redirectAttributes.addFlashAttribute("showToast", true);
                redirectAttributes.addFlashAttribute("toastMessage", "Tên folder không được quá 50 ký tự");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            folderService.renamePublicFolder(folderId, newName.trim());
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Đổi tên folder public thành công!");
            redirectAttributes.addFlashAttribute("toastType", "success");
            return "redirect:/vault-detail?id=" + vaultId + "&official=true";
        } catch (RuntimeException e) {
            System.err.println("Error renaming public folder: " + e.getMessage());
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
            return "redirect:/vault-detail?id=" + vaultId + "&official=true";
        } catch (Exception e) {
            System.err.println("Error renaming public folder: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage",
                    "Có lỗi xảy ra khi đổi tên folder public: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
            return "redirect:/vault-detail?id=" + vaultId + "&official=true";
        }
    }

    @PostMapping(path = "/add-public-subfolder")
    public String addPublicSubfolder(@RequestParam("folderId") String folderId,
            @RequestParam("subfolderName") String subfolderName,
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            if (folderId == null || folderId.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("showToast", true);
                redirectAttributes.addFlashAttribute("toastMessage", "ID folder không được để trống");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            if (subfolderName == null || subfolderName.trim().isEmpty()) {
                redirectAttributes.addFlashAttribute("showToast", true);
                redirectAttributes.addFlashAttribute("toastMessage", "Tên subfolder không được để trống");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            if (subfolderName.length() > 50) {
                redirectAttributes.addFlashAttribute("showToast", true);
                redirectAttributes.addFlashAttribute("toastMessage", "Tên subfolder không được quá 50 ký tự");
                redirectAttributes.addFlashAttribute("toastType", "error");
                return "redirect:/vault-detail?id=" + vaultId;
            }
            Folder subfolder = folderService.addPublicSubfolder(folderId, subfolderName.trim(), vaultId);
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage",
                    "Tạo subfolder public '" + subfolder.getName() + "' thành công!");
            redirectAttributes.addFlashAttribute("toastType", "success");
            return "redirect:/vault-detail?id=" + vaultId + "&folder=" + subfolder.getId() + "&official=true";
        } catch (RuntimeException e) {
            System.err.println("Error creating public subfolder: " + e.getMessage());
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
            return "redirect:/vault-detail?id=" + vaultId;
        } catch (Exception e) {
            System.err.println("Error creating public subfolder: " + e.getMessage());
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage",
                    "Có lỗi xảy ra khi tạo subfolder public: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
            return "redirect:/vault-detail?id=" + vaultId;
        }
    }

    @PostMapping(path = "/create-knowledge")
    public String createKnowledge(
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam("folderId") Integer folderId,
            @RequestParam("vaultId") String vaultId,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "tags", required = false) String tags,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        String redirectUrl = "redirect:/vault-detail?id=" + vaultId;
        try {
            List<String> tagList = new ArrayList<>();
            if (tags != null && !tags.trim().isEmpty()) {
                String[] tagArray = tags.split(",");
                for (String tag : tagArray) {
                    String trimmedTag = tag.trim();
                    if (!trimmedTag.isEmpty()) {
                        tagList.add(trimmedTag);
                    }
                }
            }

            KnowledgeItem knowledgeItem = knowledgeItemService.createKnowledgeItemWithTags(
                    vaultId,
                    folderId,
                    title,
                    description,
                    content,
                    userDetails.getId(),
                    tagList);
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Tạo knowledge thành công!");
            redirectAttributes.addFlashAttribute("toastType", "success");
            boolean isPublic = false;
            try {
                isPublic = folderService.isPublicFolder(folderId);
            } catch (Exception e) {
                isPublic = false;
            }
            redirectUrl += "&folder=" + folderId + (isPublic ? "&official=true" : "&private=true");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Lỗi: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
        }
        return redirectUrl;
    }

    @PostMapping(path = "/update-knowledge")
    public String updateKnowledge(
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam("folderId") Integer folderId,
            @RequestParam("vaultId") String vaultId,
            @RequestParam("knowledgeId") String knowledgeId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        String redirectUrl = "redirect:/vault-detail?id=" + vaultId;
        try {
            KnowledgeItem knowledgeItem = knowledgeItemService.updateKnowledgeItem(
                    knowledgeId,
                    title,
                    null,
                    content,
                    userDetails.getId());

            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Cập nhật knowledge thành công!");
            redirectAttributes.addFlashAttribute("toastType", "success");

            boolean isPublic = false;
            try {
                isPublic = folderService.isPublicFolder(folderId);
            } catch (Exception e) {
                isPublic = false;
            }
            redirectUrl += "&folder=" + folderId + (isPublic ? "&official=true" : "&private=true");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Lỗi cập nhật: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
        }
        return redirectUrl;
    }

    @PostMapping(path = "/delete-knowledge")
    public String deleteKnowledge(@RequestParam("knowledgeId") String knowledgeId,
            @RequestParam("vaultId") String vaultId,
            @RequestParam("folderId") Integer folderId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        boolean isPublic = false;
        try {
            knowledgeItemService.deleteKnowledgeItem(knowledgeId, userDetails.getId());
            try {
                isPublic = folderService.isPublicFolder(folderId);
            } catch (Exception e) {
                isPublic = false;
            }
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Xóa knowledge thành công!");
            redirectAttributes.addFlashAttribute("toastType", "success");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Có lỗi xảy ra khi xóa knowledge: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
        }
        return "redirect:/vault-detail?id=" + vaultId + "&folder=" + folderId
                + (isPublic ? "&official=true" : "&private=true");
    }

    @PostMapping(path = "/restore-knowledge")
    public String restoreKnowledge(@RequestParam("knowledgeId") String knowledgeId,
            @RequestParam("vaultId") String vaultId,
            @RequestParam("folderId") Integer folderId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        boolean isPublic = false;
        try {
            knowledgeItemService.restoreKnowledgeItem(knowledgeId, userDetails.getId());
            try {
                isPublic = folderService.isPublicFolder(folderId);
            } catch (Exception e) {
                isPublic = false;
            }
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Khôi phục knowledge thành công!");
            redirectAttributes.addFlashAttribute("toastType", "success");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage",
                    "Có lỗi xảy ra khi khôi phục knowledge: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
        }
        return "redirect:/vault-detail?id=" + vaultId + "&folder=" + folderId
                + (isPublic ? "&official=true" : "&private=true");
    }

    @PostMapping("/delete-permanent-knowledge")
    public String deletePermanentKnowledge(@RequestParam String knowledgeId,
            @RequestParam String vaultId,
            @RequestParam String folderId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            knowledgeItemService.deletePermanentKnowledgeItem(knowledgeId, userDetails.getId(), vaultId);
            redirectAttributes.addFlashAttribute("successDeleteKnowledgeMessage",
                    "Knowledge đã được xóa vĩnh viễn thành công");
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("errorDeleteKnowledgeMessage", e.getMessage());
        }

        return "redirect:/vault-detail?id=" + vaultId + "&bin=true";
    }

    @GetMapping(path = "/withdraw-knowledge")
    public String withdrawKnowledgeGet(@RequestParam(value = "id", required = false) String vaultId) {
        // Redirect GET requests to vault detail page
        if (vaultId != null) {
            return "redirect:/vault-detail?id=" + vaultId;
        }
        return "redirect:/vault-management";
    }

    @PostMapping(path = "/withdraw-knowledge")
    public String withdrawKnowledge(@RequestParam("knowledgeId") String knowledgeId,
            @RequestParam("vaultId") String vaultId,
            @RequestParam("folderId") Integer folderId,
            @RequestParam(value = "private", required = false) Boolean showPrivate,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            if (!knowledgeItemService.canWithdrawKnowledge(knowledgeId, userDetails.getId())) {
                redirectAttributes.addFlashAttribute("errorMessage",
                        "Không thể rút lại knowledge này! Có thể đang được expert review hoặc bạn không phải là người tạo.");

                String redirectUrl = "redirect:/vault-detail?id=" + vaultId + "&folder=" + folderId;
                if (showPrivate != null && showPrivate) {
                    redirectUrl += "&private=true";
                }
                return redirectUrl;
            }

            Optional<KnowledgeItem> itemOpt = knowledgeItemService.getKnowledgeItemById(knowledgeId);
            if (itemOpt.isPresent()) {
                KnowledgeItem item = itemOpt.get();
                if (item.getApprovalStatus() == com.capstone_project.capstone_project.enums.KnowledgeApprovalStatus.PENDING_APPROVAL) {
                    knowledgeItemService.stopReviewingKnowledge(knowledgeId, userDetails.getId());

                    knowledgeItemService.withdrawKnowledge(item.getId(), userDetails.getId(), vaultId,
                            "Withdraw by user");
                    redirectAttributes.addFlashAttribute("successMessage", "Rút lại kiến thức thành công!");
                } else {
                    redirectAttributes.addFlashAttribute("errorMessage", "Kiến thức không ở trạng thái chờ duyệt!");
                }
            } else {
                redirectAttributes.addFlashAttribute("errorMessage", "Không tìm thấy kiến thức!");
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMessage",
                    "Có lỗi xảy ra khi rút lại kiến thức: " + e.getMessage());
        }

        String redirectUrl = "redirect:/vault-detail?id=" + vaultId + "&folder=" + folderId;
        if (showPrivate != null && showPrivate) {
            redirectUrl += "&private=true";
        }
        return redirectUrl;
    }

    @PostMapping(path = "/start-reviewing")
    @ResponseBody
    public Map<String, Object> startReviewing(@RequestParam("knowledgeId") String knowledgeId,
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Map<String, Object> result = new HashMap<>();
        try {
            boolean canReview = knowledgeItemService.startReviewingKnowledge(knowledgeId, userDetails.getId(), vaultId);
            if (canReview) {
                result.put("success", true);
                result.put("message", "Đã bắt đầu review knowledge");
            } else {
                result.put("success", false);
                result.put("message", "Knowledge đang được review bởi expert khác");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Lỗi khi bắt đầu review: " + e.getMessage());
        }
        return result;
    }

    @PostMapping(path = "/stop-reviewing")
    @ResponseBody
    public Map<String, Object> stopReviewing(@RequestParam("knowledgeId") String knowledgeId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Map<String, Object> result = new HashMap<>();
        try {
            knowledgeItemService.stopReviewingKnowledge(knowledgeId, userDetails.getId());
            result.put("success", true);
            result.put("message", "Đã dừng review knowledge");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Lỗi khi dừng review: " + e.getMessage());
        }
        return result;
    }

    @GetMapping(path = "/get-reviewer-info")
    @ResponseBody
    public Map<String, Object> getReviewerInfo(@RequestParam("knowledgeId") String knowledgeId) {
        try {
            return knowledgeItemService.getReviewerInfo(knowledgeId);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Lỗi khi lấy thông tin reviewer: " + e.getMessage());
            return result;
        }
    }

    @PostMapping(path = "/submit-for-approval")
    public String submitForApproval(@RequestParam("knowledgeId") String knowledgeId,
            @RequestParam("vaultId") String vaultId,
            @RequestParam("folderId") Integer folderId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            knowledgeItemService.submitForApproval(knowledgeId, userDetails.getId(), vaultId);
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Knowledge submitted for approval successfully!");
            redirectAttributes.addFlashAttribute("toastType", "success");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Error submitting knowledge: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
        }
        return "redirect:/vault-detail?id=" + vaultId + "&folder=" + folderId + "&private=true";
    }

    @PostMapping(path = "/approve-knowledge-with-folder")
    public String approveKnowledgeWithFolder(@RequestParam("knowledgeId") String knowledgeId,
            @RequestParam("vaultId") String vaultId,
            @RequestParam("folderId") Integer folderId,
            @RequestParam("targetFolderId") Integer targetFolderId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            knowledgeItemService.approveKnowledgeWithFolder(knowledgeId, userDetails.getId(), vaultId, targetFolderId);
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage",
                    "Knowledge approved and moved to official folder successfully!");
            redirectAttributes.addFlashAttribute("toastType", "success");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Error approving knowledge: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
        }
        return "redirect:/vault-detail?id=" + vaultId + "&folder=" + folderId + "&private=true";
    }

    @PostMapping(path = "/approve-knowledge")
    public String approveKnowledge(@RequestParam("knowledgeId") String knowledgeId,
            @RequestParam("vaultId") String vaultId,
            @RequestParam("folderId") Integer folderId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            knowledgeItemService.approveKnowledge(knowledgeId, userDetails.getId(), vaultId);
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Knowledge approved successfully!");
            redirectAttributes.addFlashAttribute("toastType", "success");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Error approving knowledge: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
        }
        return "redirect:/vault-detail?id=" + vaultId + "&folder=" + folderId + "&official=true";
    }

    @PostMapping("/assistant/ask")
    @ResponseBody
    public Map<String, Object> askAssistant(
            @RequestParam("vaultId") String vaultId,
            @RequestParam(value = "source", defaultValue = "all") String source,
            @RequestParam("question") String question,
            @RequestParam(value = "allowOnlineSearch", defaultValue = "false") boolean allowOnlineSearch,
            @RequestParam(value = "sessionId", required = false) String sessionId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<KnowledgeItem> knowledge = assistantService.getKnowledgeForAssistant(vaultId, userDetails.getId(), source);
        System.out.println("Knowledge source: " + source + ", Allow online search: " + allowOnlineSearch);
        System.out.println("Found " + knowledge.size() + " knowledge items for source: " + source);

        String aiAnswer = assistantService.askAI(question, knowledge, source, allowOnlineSearch);

        ChatSession session;
        if (sessionId != null && !sessionId.isEmpty()) {
            session = assistantService.getOrCreateSession(sessionId, userDetails.getId(), vaultId, source);
        } else {
            session = assistantService.createSession(userDetails.getId(), vaultId, source);
        }

        assistantService.saveMessage(session, "USER", question);
        assistantService.saveMessage(session, "ASSISTANT", aiAnswer);

        Map<String, Object> result = new HashMap<>();
        result.put("answer", aiAnswer);
        result.put("sessionId", session.getId());
        result.put("source", source);
        result.put("onlineSearchUsed", allowOnlineSearch);
        return result;
    }

    @GetMapping("/assistant/history")
    @ResponseBody
    public List<ChatSessionDTO> getAssistantHistory(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return assistantService.getUserChatSessions(userDetails.getId());
    }

    @GetMapping("/assistant/current-session")
    @ResponseBody
    public Map<String, Object> getCurrentSession(
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        ChatSession currentSession = assistantService.getCurrentSessionForVault(userDetails.getId(), vaultId);
        Map<String, Object> result = new HashMap<>();
        if (currentSession != null) {
            result.put("sessionId", currentSession.getId());
            result.put("hasHistory", true);
        } else {
            result.put("hasHistory", false);
        }
        return result;
    }

    @GetMapping("/assistant/session/{sessionId}/messages")
    @ResponseBody
    public List<ChatMessageDTO> getSessionMessages(
            @PathVariable String sessionId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            return assistantService.getSessionMessages(sessionId, userDetails.getId());
        } catch (Exception e) {
            System.err.println("Error getting session messages: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    @PostMapping("/assistant/sync-knowledge")
    @ResponseBody
    public String syncKnowledgeToQdrant(@AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            System.out.println("Starting sync for user: " + userDetails.getId());

            List<KnowledgeItem> allKnowledge = knowledgeItemService.getAllKnowledgeByUser(userDetails.getId());
            System.out.println("Found " + allKnowledge.size() + " knowledge items for user: " + userDetails.getId());

            if (allKnowledge.isEmpty()) {
                System.out.println("No knowledge items found for user");
                return "Không có knowledge nào để sync";
            }
            int successCount = 0;
            for (KnowledgeItem knowledge : allKnowledge) {
                try {
                    System.out.println(
                            "Processing knowledge: " + knowledge.getName() + " (ID: " + knowledge.getId() + ")");
                    assistantService.saveKnowledgeToQdrant(knowledge);
                    successCount++;
                } catch (Exception e) {
                    System.err.println("Failed to save knowledge " + knowledge.getName() + ": " + e.getMessage());
                }
            }
            System.out.println("Sync completed. Successfully processed " + successCount + " out of "
                    + allKnowledge.size() + " knowledge items");
            return "Đã sync " + successCount + " knowledge vào Qdrant";
        } catch (Exception e) {
            System.err.println("Error in syncKnowledgeToQdrant: " + e.getMessage());
            e.printStackTrace();
            return "Lỗi khi sync knowledge: " + e.getMessage();
        }
    }

    @GetMapping("/assistant/sessions")
    @ResponseBody
    public List<ChatSessionDTO> getChatSessions(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            return assistantService.getUserChatSessions(userDetails.getId());
        } catch (Exception e) {
            System.err.println("Error getting chat sessions: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    // Helper method to create user info map for display
    private Map<String, String> createUserInfoMap(List<KnowledgeItem> knowledgeItems) {
        Map<String, String> userInfoMap = new HashMap<>();

        for (KnowledgeItem item : knowledgeItems) {
            // Add creator info
            if (item.getCreatedBy() != null && !userInfoMap.containsKey("creator_" + item.getCreatedBy())) {
                try {
                    User creator = userService.findById(item.getCreatedBy());
                    String creatorInfo = creator.getEmail() != null ? creator.getEmail() : creator.getUsername();
                    userInfoMap.put("creator_" + item.getCreatedBy(), creatorInfo);
                } catch (Exception e) {
                    userInfoMap.put("creator_" + item.getCreatedBy(), "Unknown User");
                }
            }

            // Add approver info
            if (item.getApprovedBy() != null && !userInfoMap.containsKey("approver_" + item.getApprovedBy())) {
                try {
                    User approver = userService.findById(item.getApprovedBy());
                    String approverInfo = approver.getEmail() != null ? approver.getEmail() : approver.getUsername();
                    userInfoMap.put("approver_" + item.getApprovedBy(), approverInfo);
                } catch (Exception e) {
                    userInfoMap.put("approver_" + item.getApprovedBy(), "Unknown User");
                }
            }
        }

        return userInfoMap;
    }

    @PostMapping("/create-session")
    @ResponseBody
    public ResponseEntity<?> createSession(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("date") String date,
            @RequestParam("time") String time,
            @RequestParam("endDate") String endDate,
            @RequestParam("endTime") String endTime,
            @RequestParam("duration") int durationMinutes,
            @RequestParam("instructor") String instructorId,
            @RequestParam(value = "meetingLink", required = false) String meetingLink,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {

            knowledgeSessionService.createKnowledgeSession(
                    title, description, date, time, endDate, endTime, String.valueOf(durationMinutes),
                    instructorId, meetingLink, tags, vaultId, userDetails.getId());
            return ResponseEntity.ok("Session created successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/update-session")
    @ResponseBody
    public ResponseEntity<?> updateSession(
            @RequestParam("sessionId") String sessionId,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("date") String date,
            @RequestParam("time") String time,
            @RequestParam("endDate") String endDate,
            @RequestParam("endTime") String endTime,
            @RequestParam("duration") int durationMinutes,
            @RequestParam("instructor") String instructorId,
            @RequestParam(value = "meetingLink", required = false) String meetingLink,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam("vaultId") String vaultId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            knowledgeSessionService.updateKnowledgeSession(
                    Integer.parseInt(sessionId), title, description, date, time, endDate, endTime,
                    String.valueOf(durationMinutes), instructorId, meetingLink, tags, vaultId, userDetails.getId());
            return ResponseEntity.ok("Session updated successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    private int parseDurationToMinutes(String durationString) {
        if (durationString == null || durationString.trim().isEmpty()) {
            return 0;
        }

        int totalMinutes = 0;

        if (durationString.contains("h")) {
            String hoursStr = durationString.substring(0, durationString.indexOf("h"));
            try {
                totalMinutes += Integer.parseInt(hoursStr) * 60;
            } catch (NumberFormatException e) {
                // Ignore invalid hour format
            }
        }

        // Extract minutes
        if (durationString.contains("m")) {
            int mIndex = durationString.indexOf("m");
            int startIndex = 0;

            // If there's an "h", start after it
            if (durationString.contains("h")) {
                startIndex = durationString.indexOf("h") + 1;
            }

            String minutesStr = durationString.substring(startIndex, mIndex);
            try {
                totalMinutes += Integer.parseInt(minutesStr);
            } catch (NumberFormatException e) {
                // Ignore invalid minute format
            }
        }

        return totalMinutes;
    }

    @GetMapping("/experts")
    @ResponseBody
    public List<Map<String, String>> getExpertsInVault(@RequestParam("vaultId") String vaultId) {
        List<User> experts = userVaultRoleService.getExpertsInVault(vaultId);
        List<Map<String, String>> result = new ArrayList<>();
        for (User user : experts) {
            Map<String, String> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("name", user.getUsername());
            userInfo.put("email", user.getEmail());
            userInfo.put("avatar", user.getAvatar());
            result.add(userInfo);
        }
        return result;
    }

    @PostMapping("/delete-session")
    @ResponseBody
    public ResponseEntity<?> deleteSession(@RequestParam("sessionId") String sessionId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            knowledgeSessionService.deleteKnowledgeSession(Integer.parseInt(sessionId));
            return ResponseEntity.ok("Session deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // ================== MOVE KNOWLEDGE ENDPOINTS ==================

    @PostMapping("/move-knowledge")
    public String moveKnowledge(
            @RequestParam("knowledgeId") String knowledgeId,
            @RequestParam("targetFolderId") Integer targetFolderId,
            @RequestParam("vaultId") String vaultId,
            @RequestParam(value = "currentFolderId", required = false) Integer currentFolderId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            knowledgeItemService.moveKnowledge(knowledgeId, targetFolderId, userDetails.getId(), vaultId);

            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage", "Di chuyển knowledge thành công!");
            redirectAttributes.addFlashAttribute("toastType", "success");

            // Determine redirect URL based on target folder type
            boolean isTargetPublic = false;
            try {
                isTargetPublic = folderService.isPublicFolder(targetFolderId);
            } catch (Exception e) {
                isTargetPublic = false;
            }

            return "redirect:/vault-detail?id=" + vaultId + "&folder=" + targetFolderId
                    + (isTargetPublic ? "&official=true" : "&private=true");

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("showToast", true);
            redirectAttributes.addFlashAttribute("toastMessage",
                    "Có lỗi xảy ra khi di chuyển knowledge: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");

            // Redirect back to current location
            String redirectUrl = "redirect:/vault-detail?id=" + vaultId;
            if (currentFolderId != null) {
                boolean isCurrentPublic = false;
                try {
                    isCurrentPublic = folderService.isPublicFolder(currentFolderId);
                } catch (Exception ex) {
                    isCurrentPublic = false;
                }
                redirectUrl += "&folder=" + currentFolderId + (isCurrentPublic ? "&official=true" : "&private=true");
            } else {
                redirectUrl += "&private=true";
            }
            return redirectUrl;
        }
    }

    @GetMapping("/folder-tree")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getFolderTree(
            @RequestParam("vaultId") String vaultId,
            @RequestParam("type") String type, // "private" or "official"
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Map<String, Object> result = new HashMap<>();

            if ("private".equals(type)) {
                // Get private folders for current user
                List<Folder> privateFolders = folderService.getFolderTreeByParentIdAndVaultId(null, userDetails.getId(),
                        vaultId);
                result.put("folders", privateFolders);
                result.put("type", "private");
            } else if ("official".equals(type)) {
                // Get official (public) folders
                List<Folder> publicFolders = folderService.getPublicFolderTreeByVaultId(vaultId);
                result.put("folders", publicFolders);
                result.put("type", "official");
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid type parameter"));
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error retrieving folder tree: " + e.getMessage()));
        }
    }

    // ================== KNOWLEDGE INTERACTION ENDPOINTS ==================

    @PostMapping("/knowledge/{knowledgeId}/record-view")
    @ResponseBody
    public ResponseEntity<?> recordKnowledgeView(
            @PathVariable String knowledgeId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest request) {
        try {
            String userId = userDetails != null ? userDetails.getId() : null;
            knowledgeViewService.recordKnowledgeView(knowledgeId, userId, request);
            return ResponseEntity.ok(Map.of("success", true, "message", "View recorded successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error recording view: " + e.getMessage()));
        }
    }

    @GetMapping("/knowledge/{knowledgeId}/interactions")
    @ResponseBody
    public ResponseEntity<?> getKnowledgeInteractions(
            @PathVariable String knowledgeId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            com.capstone_project.capstone_project.dto.KnowledgeInteractionDTO interactions = knowledgeInteractionService
                    .getKnowledgeInteractions(knowledgeId, userDetails.getId());
            return ResponseEntity.ok(interactions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/knowledge/{knowledgeId}/comment")
    @ResponseBody
    public ResponseEntity<?> addComment(
            @PathVariable String knowledgeId,
            @RequestParam("content") String content,
            @RequestParam(value = "parentCommentId", required = false) Integer parentCommentId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Comment content cannot be empty"));
            }

            com.capstone_project.capstone_project.dto.CommentDTO comment = knowledgeInteractionService
                    .addComment(knowledgeId, userDetails.getId(), content, parentCommentId);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/comment/{commentId}/update")
    @ResponseBody
    public ResponseEntity<?> updateComment(
            @PathVariable Integer commentId,
            @RequestParam("content") String content,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Comment content cannot be empty"));
            }

            com.capstone_project.capstone_project.dto.CommentDTO comment = knowledgeInteractionService
                    .updateComment(commentId, userDetails.getId(), content);
            return ResponseEntity.ok(comment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/comment/{commentId}/delete")
    @ResponseBody
    public ResponseEntity<?> deleteComment(
            @PathVariable Integer commentId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            knowledgeInteractionService.deleteComment(commentId, userDetails.getId());
            return ResponseEntity.ok(Map.of("success", true, "message", "Comment deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/knowledge/{knowledgeId}/rating")
    @ResponseBody
    public ResponseEntity<?> addOrUpdateRating(
            @PathVariable String knowledgeId,
            @RequestParam("ratingValue") Integer ratingValue,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            if (ratingValue < 1 || ratingValue > 5) {
                return ResponseEntity.badRequest().body(Map.of("error", "Rating value must be between 1 and 5"));
            }

            knowledgeInteractionService.addOrUpdateRating(knowledgeId, userDetails.getId(), ratingValue);

            // Return updated rating info
            com.capstone_project.capstone_project.dto.KnowledgeInteractionDTO interactions = knowledgeInteractionService
                    .getKnowledgeInteractions(knowledgeId, userDetails.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Rating saved successfully");
            response.put("averageRating", interactions.getAverageRating());
            response.put("totalRatings", interactions.getTotalRatings());
            response.put("userRating", interactions.getUserRating());
            response.put("ratingStats", interactions.getRatingStats());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/knowledge/{knowledgeId}/rating/remove")
    @ResponseBody
    public ResponseEntity<?> removeRating(
            @PathVariable String knowledgeId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            knowledgeInteractionService.removeRating(knowledgeId, userDetails.getId());

            // Return updated rating info
            com.capstone_project.capstone_project.dto.KnowledgeInteractionDTO interactions = knowledgeInteractionService
                    .getKnowledgeInteractions(knowledgeId, userDetails.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Rating removed successfully");
            response.put("averageRating", interactions.getAverageRating());
            response.put("totalRatings", interactions.getTotalRatings());
            response.put("userRating", interactions.getUserRating());
            response.put("ratingStats", interactions.getRatingStats());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping(path = "/search")
    @ResponseBody
    public ResponseEntity<?> searchVault(
            @RequestParam("vaultId") String vaultId,
            @RequestParam("query") String query,
            @RequestParam(value = "sortBy", defaultValue = "relevance") String sortBy,
            @RequestParam(value = "searchTitleOnly", defaultValue = "true") boolean searchTitleOnly,
            @RequestParam(value = "createdBy", defaultValue = "all") String createdBy,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        try {
            Map<String, Object> results = new HashMap<>();
            String lowerQuery = query.toLowerCase();

            // Search folders (including subfolders)
            List<Map<String, Object>> folders = new ArrayList<>();

            // Search personal folders and their subfolders
            List<Folder> personalFolders = folderService.getFolderTreeByParentIdAndVaultId(null,
                    userDetails.getId(), vaultId);
            searchInFolderTree(personalFolders, lowerQuery, folders, "personal");

            // Search public folders and their subfolders
            List<Folder> publicFolders = folderService.getPublicFolderTreeByVaultId(vaultId);
            searchInFolderTree(publicFolders, lowerQuery, folders, "public");

            // Apply sorting to folders
            sortResults(folders, sortBy);

            results.put("folders", folders);

            // Search knowledge items
            List<Map<String, Object>> knowledge = new ArrayList<>();

            // Get all knowledge items in the vault
            List<KnowledgeItem> allKnowledge = knowledgeItemService.getKnowledgeItemsByVaultId(vaultId);

            for (KnowledgeItem item : allKnowledge) {
                // Apply created by filter
                if (!"all".equals(createdBy) && !createdBy.equals(String.valueOf(item.getCreatedBy()))) {
                    continue;
                }

                // Apply search filter (title only or full content)
                boolean matchesQuery = false;
                if (searchTitleOnly) {
                    matchesQuery = item.getName().toLowerCase().contains(lowerQuery);
                } else {
                    matchesQuery = item.getName().toLowerCase().contains(lowerQuery) ||
                            (item.getDescription() != null
                                    && item.getDescription().toLowerCase().contains(lowerQuery))
                            ||
                            (item.getContent() != null && item.getContent().toLowerCase().contains(lowerQuery));
                }

                if (matchesQuery) {

                    Map<String, Object> knowledgeData = new HashMap<>();
                    knowledgeData.put("id", item.getId());
                    knowledgeData.put("title", item.getName());
                    knowledgeData.put("description", item.getDescription());
                    knowledgeData.put("status", item.getApprovalStatus());
                    knowledgeData.put("createdAt", item.getCreatedAt());
                    knowledgeData.put("updatedAt", item.getUpdatedAt());

                    // Get folder info
                    if (item.getFolder() != null) {
                        knowledgeData.put("folderId", item.getFolder().getId());
                        knowledgeData.put("folderName", item.getFolder().getName());
                        knowledgeData.put("folderType", item.getFolder().getIsPublic() ? "public" : "personal");
                    } else {
                        knowledgeData.put("folderId", null);
                        knowledgeData.put("folderName", "Unknown folder");
                        knowledgeData.put("folderType", "unknown");
                    }

                    // Get creator name
                    try {
                        User creator = userService.findById(item.getCreatedBy());
                        knowledgeData.put("creatorName", creator.getUsername());
                    } catch (Exception e) {
                        knowledgeData.put("creatorName", "Unknown");
                    }

                    knowledge.add(knowledgeData);
                }
            }

            // Apply sorting
            sortResults(knowledge, sortBy);

            results.put("knowledgeItems", knowledge);

            // Search sessions
            List<Map<String, Object>> sessionsData = new ArrayList<>();

            // Get all sessions in the vault
            List<KnowledgeSession> allSessions = knowledgeSessionService.getKnowledgeSessionsByVault(vaultId);

            for (KnowledgeSession session : allSessions) {
                // Apply search filter (title only or full content)
                boolean matchesQuery = false;
                if (searchTitleOnly) {
                    matchesQuery = session.getTitle().toLowerCase().contains(lowerQuery);
                } else {
                    matchesQuery = session.getTitle().toLowerCase().contains(lowerQuery) ||
                            (session.getDescription() != null
                                    && session.getDescription().toLowerCase().contains(lowerQuery));
                }

                if (matchesQuery) {

                    Map<String, Object> sessionData = new HashMap<>();
                    sessionData.put("id", session.getId());
                    sessionData.put("title", session.getTitle());
                    sessionData.put("description", session.getDescription());
                    sessionData.put("date", session.getStartTime());
                    sessionData.put("endDate", session.getEndTime());
                    sessionData.put("duration", session.getDuration());
                    sessionData.put("meetingLink", session.getMeetingLink());
                    sessionData.put("status", session.getStatus());

                    // Get instructor name
                    if (session.getInstructor() != null) {
                        sessionData.put("instructorName", session.getInstructor().getUsername());
                    } else {
                        sessionData.put("instructorName", "Unknown");
                    }

                    // Get creator name
                    try {
                        User creator = userService.findById(session.getCreatedBy());
                        sessionData.put("creatorName", creator.getUsername());
                    } catch (Exception e) {
                        sessionData.put("creatorName", "Unknown");
                    }

                    sessionsData.add(sessionData);
                }
            }

            // Apply sorting to sessions
            sortResults(sessionsData, sortBy);

            results.put("sessions", sessionsData);

            return ResponseEntity.ok(results);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Search failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping(path = "/reject-knowledge")
    public String rejectKnowledge(@RequestParam("knowledgeId") String knowledgeId,
            @RequestParam("vaultId") String vaultId,
            @RequestParam("folderId") Integer folderId,
            @RequestParam("rejectionReason") String rejectionReason,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            RedirectAttributes redirectAttributes) {
        try {
            knowledgeItemService.rejectKnowledge(knowledgeId, userDetails.getId(), vaultId, rejectionReason);
            redirectAttributes.addFlashAttribute("toastMessage", "Knowledge rejected successfully!");
            redirectAttributes.addFlashAttribute("toastType", "success");
            redirectAttributes.addFlashAttribute("showToast", true);
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("toastMessage", "Error rejecting knowledge: " + e.getMessage());
            redirectAttributes.addFlashAttribute("toastType", "error");
            redirectAttributes.addFlashAttribute("showToast", true);
        }

        // Determine redirect URL based on current context
        String redirectUrl = "/vault-detail?id=" + vaultId;

        // Check if we're in private mode (based on current session or request context)
        // Add private=true to maintain the current view context
        if (folderId != null) {
            redirectUrl += "&folder=" + folderId + "&private=true";
        } else {
            redirectUrl += "&private=true";
        }

        return "redirect:" + redirectUrl;
    }

    @GetMapping("/calendar-sessions")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getCalendarSessionsByWeek(
            @RequestParam("vaultId") String vaultId,
            @RequestParam("weekStart") String weekStart) {
        try {
            // Parse the week start date
            LocalDate weekStartDate = LocalDate.parse(weekStart);
            LocalDate weekEndDate = weekStartDate.plusDays(6); // 7 days including start date

            List<Map<String, Object>> calendarSessions = knowledgeSessionService.getCalendarSessionsDataByWeek(vaultId,
                    weekStartDate, weekEndDate);
            return ResponseEntity.ok(calendarSessions);
        } catch (Exception e) {
            System.err.println("Error getting calendar sessions by week: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Helper method to sort search results
    private void sortResults(List<Map<String, Object>> results, String sortBy) {
        switch (sortBy) {
            case "last_edited_newest":
                results.sort((a, b) -> {
                    LocalDateTime dateA = getItemModifiedDate(a);
                    LocalDateTime dateB = getItemModifiedDate(b);
                    if (dateA == null)
                        return 1;
                    if (dateB == null)
                        return -1;
                    return dateB.compareTo(dateA); // Newest first
                });
                break;
            case "last_edited_oldest":
                results.sort((a, b) -> {
                    LocalDateTime dateA = getItemModifiedDate(a);
                    LocalDateTime dateB = getItemModifiedDate(b);
                    if (dateA == null)
                        return 1;
                    if (dateB == null)
                        return -1;
                    return dateA.compareTo(dateB); // Oldest first
                });
                break;
            case "created_newest":
                results.sort((a, b) -> {
                    LocalDateTime dateA = getItemCreatedDate(a);
                    LocalDateTime dateB = getItemCreatedDate(b);
                    if (dateA == null)
                        return 1;
                    if (dateB == null)
                        return -1;
                    return dateB.compareTo(dateA); // Newest first
                });
                break;
            case "created_oldest":
                results.sort((a, b) -> {
                    LocalDateTime dateA = getItemCreatedDate(a);
                    LocalDateTime dateB = getItemCreatedDate(b);
                    if (dateA == null)
                        return 1;
                    if (dateB == null)
                        return -1;
                    return dateA.compareTo(dateB); // Oldest first
                });
                break;
            // "relevance" is default, no sorting needed
        }
    }

    // Helper methods to get item properties for sorting
    private String getItemName(Map<String, Object> item) {
        return (String) (item.get("title") != null ? item.get("title") : item.get("name"));
    }

    private LocalDateTime getItemCreatedDate(Map<String, Object> item) {
        Object date = item.get("createdAt");
        if (date instanceof LocalDateTime) {
            return (LocalDateTime) date;
        } else if (date instanceof String) {
            try {
                return LocalDateTime.parse((String) date);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    private LocalDateTime getItemModifiedDate(Map<String, Object> item) {
        Object date = item.get("updatedAt");
        if (date instanceof LocalDateTime) {
            return (LocalDateTime) date;
        } else if (date instanceof String) {
            try {
                return LocalDateTime.parse((String) date);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    private String getItemType(Map<String, Object> item) {
        // For folders, use folderType; for knowledge items, use folderType; for
        // sessions, use "session"
        if (item.containsKey("folderType")) {
            return (String) item.get("folderType");
        } else if (item.containsKey("date")) {
            return "session";
        }
        return "unknown";
    }

    // Helper method to search in folder tree (including subfolders)
    private void searchInFolderTree(List<Folder> folders, String lowerQuery, List<Map<String, Object>> results,
            String type) {
        for (Folder folder : folders) {
            if (folder.getName().toLowerCase().contains(lowerQuery)) {
                Map<String, Object> folderData = new HashMap<>();
                folderData.put("id", folder.getId());
                folderData.put("name", folder.getName());
                folderData.put("type", type);
                folderData.put("parentId", folder.getParentId());

                // Count knowledge items in this folder
                try {
                    List<KnowledgeItem> items = knowledgeItemService
                            .getKnowledgeItemsByVaultIdAndFolderId(folder.getVaultId(), folder.getId().intValue());
                    folderData.put("itemCount", items.size());
                } catch (Exception e) {
                    folderData.put("itemCount", 0);
                }

                results.add(folderData);
            }

            // Recursively search in subfolders
            if (folder.getSubfolders() != null && !folder.getSubfolders().isEmpty()) {
                searchInFolderTree(folder.getSubfolders(), lowerQuery, results, type);
            }
        }
    }
}