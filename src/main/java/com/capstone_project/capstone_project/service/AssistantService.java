package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.model.*;
import com.capstone_project.capstone_project.model.KnowledgeItemTag;
import com.capstone_project.capstone_project.repository.*;
import com.capstone_project.capstone_project.dto.ChatSessionDTO;
import com.capstone_project.capstone_project.dto.ChatMessageDTO;
import com.capstone_project.capstone_project.enums.KnowledgeVisibility;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssistantService {
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final VaultRepository vaultRepository;
    private final KnowledgeItemRepository knowledgeItemRepository;
    private final KnowledgeItemTagRepository knowledgeItemTagRepository;
    private final KnowledgeViewRepository knowledgeViewRepository;
    private final CommentRepository commentRepository;
    private final RatingRepository ratingRepository;
    private final FolderRepository folderRepository;
    private final QdrantService qdrantService;
    private final GeminiService geminiService;
    private final GeminiEmbeddingService geminiEmbeddingService;

    public List<KnowledgeItem> getKnowledgeForAssistant(String vaultId, String userId, String source) {
        if ("all".equalsIgnoreCase(source)) {
            List<KnowledgeItem> official = knowledgeItemRepository
                    .findByVaultIdAndCreatedByAndVisibilityAndIsDeletedFalse(
                            vaultId, userId, KnowledgeVisibility.OFFICIAL);
            List<KnowledgeItem> priv = knowledgeItemRepository.findByVaultIdAndCreatedByAndVisibilityAndIsDeletedFalse(
                    vaultId, userId, KnowledgeVisibility.PRIVATE);

            // Gộp cả hai danh sách
            List<KnowledgeItem> allKnowledge = new ArrayList<>();
            allKnowledge.addAll(official);
            allKnowledge.addAll(priv);
            return allKnowledge;

        } else if ("official".equalsIgnoreCase(source)) {
            return knowledgeItemRepository.findByVaultIdAndCreatedByAndVisibilityAndIsDeletedFalse(
                    vaultId, userId, KnowledgeVisibility.OFFICIAL);
        } else if ("private".equalsIgnoreCase(source)) {
            return knowledgeItemRepository.findByVaultIdAndCreatedByAndVisibilityAndIsDeletedFalse(
                    vaultId, userId, KnowledgeVisibility.PRIVATE);
        } else {
            return getKnowledgeForAssistant(vaultId, userId, "all");
        }
    }

    @Transactional
    public ChatSession createSession(String userId, String vaultId, String source) {
        ChatSession session = new ChatSession();
        session.setUser(userRepository.findById(userId).orElseThrow());
        session.setVault(vaultRepository.findById(vaultId).orElseThrow());
        session.setKnowledgeSource(source);
        return chatSessionRepository.save(session);
    }

    public ChatSession getOrCreateSession(String sessionId, String userId, String vaultId, String source) {
        try {
            Long sessionIdLong = Long.parseLong(sessionId);
            Optional<ChatSession> existingSession = chatSessionRepository.findById(sessionIdLong);

            // Kiểm tra session tồn tại và thuộc về user và vault
            if (existingSession.isPresent() &&
                    existingSession.get().getUser().getId().equals(userId) &&
                    existingSession.get().getVault().getId().equals(vaultId)) {
                return existingSession.get();
            }
        } catch (NumberFormatException e) {
            System.err.println("Invalid session ID format: " + sessionId);
        }

        // Nếu session không tồn tại hoặc không hợp lệ, tạo mới
        return createSession(userId, vaultId, source);
    }

    @Transactional
    public ChatMessage saveMessage(ChatSession session, String sender, String message) {
        ChatMessage msg = new ChatMessage();
        msg.setSession(session);
        msg.setSender(sender);
        msg.setMessage(message);
        return chatMessageRepository.save(msg);
    }

    public List<ChatSessionDTO> getUserChatSessions(String userId) {
        List<ChatSession> sessions = chatSessionRepository.findByUserIdOrderByStartedAtDesc(userId);
        return sessions.stream()
                .map(session -> {
                    // Tìm câu hỏi đầu tiên của user
                    String firstQuestion = session.getMessages() != null
                            ? session.getMessages().stream()
                                    .filter(msg -> "USER".equals(msg.getSender()))
                                    .map(ChatMessage::getMessage)
                                    .findFirst()
                                    .orElse(null)
                            : null;

                    return ChatSessionDTO.builder()
                            .id(session.getId())
                            .knowledgeSource(session.getKnowledgeSource())
                            .startedAt(session.getStartedAt())
                            .vaultName(session.getVault() != null ? session.getVault().getName() : "Unknown")
                            .userName(session.getUser() != null ? session.getUser().getUsername() : "Unknown")
                            .firstQuestion(firstQuestion)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public ChatSession getCurrentSessionForVault(String userId, String vaultId) {
        List<ChatSession> sessions = chatSessionRepository.findByUserIdOrderByStartedAtDesc(userId);
        return sessions.stream()
                .filter(session -> session.getVault().getId().equals(vaultId))
                .findFirst()
                .orElse(null);
    }

    public List<ChatMessageDTO> getSessionMessages(String sessionId, String userId) {
        try {
            // Kiểm tra xem session có thuộc về user không
            Long sessionIdLong = Long.parseLong(sessionId);
            Optional<ChatSession> session = chatSessionRepository.findById(sessionIdLong);
            if (session.isPresent() && session.get().getUser().getId().equals(userId)) {
                List<ChatMessage> messages = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionIdLong);
                return messages.stream()
                        .map(message -> ChatMessageDTO.builder()
                                .id(message.getId())
                                .sender(message.getSender())
                                .message(message.getMessage())
                                .createdAt(message.getCreatedAt())
                                .build())
                        .collect(Collectors.toList());
            }
        } catch (NumberFormatException e) {
            System.err.println("Invalid session ID format: " + sessionId);
        }
        return new ArrayList<>();
    }

    private float[] embedText(String text) {
        return geminiEmbeddingService.embedText(text);
    }

    // Helper method để search Qdrant với filter theo source
    private List<Map<String, Object>> searchQdrantBySource(String collection, float[] queryVector, int limit,
            String knowledgeSource) {
        // Tạo filter cho Qdrant search dựa trên knowledge source
        Map<String, Object> filter = null;
        if ("official".equalsIgnoreCase(knowledgeSource)) {
            filter = Map.of("visibility", "OFFICIAL");
        } else if ("private".equalsIgnoreCase(knowledgeSource)) {
            filter = Map.of("visibility", "PRIVATE");
        }
        // Nếu là "all" thì không cần filter

        return qdrantService.searchWithFilter(collection, queryVector, limit, filter);
    }

    // Helper method để convert source thành display name
    private String getSourceDisplayName(String source) {
        switch (source.toLowerCase()) {
            case "official":
                return "Kiến thức chính thức";
            case "private":
                return "Kiến thức cá nhân";
            case "all":
            default:
                return "Tất cả kiến thức";
        }
    }

    // Helper method để search online
    private String searchOnline(String question) {
        try {
            // Sử dụng Gemini để search online
            String prompt = "Hãy tìm kiếm thông tin về: " + question +
                    "\nCung cấp thông tin chi tiết và đáng tin cậy. " +
                    "Nếu có thể, hãy ghi rõ nguồn thông tin.";

            String response = geminiService.askGemini(prompt);
            System.out.println("Online search completed for question: " + question);
            return response;
        } catch (Exception e) {
            System.err.println("Error during online search: " + e.getMessage());
            return null;
        }
    }

    // Helper method để kiểm tra câu hỏi greeting hoặc general
    private boolean isGreetingOrGeneralQuestion(String question) {
        String lowerQuestion = question.toLowerCase().trim();

        // Các pattern greeting
        String[] greetingPatterns = {
                "xin chào", "chào", "hello", "hi", "hey",
                "bạn là ai", "bạn là gì", "giới thiệu", "tên bạn",
                "cảm ơn", "thank you", "thanks", "cám ơn"
        };

        // Các pattern general conversation
        String[] generalPatterns = {
                "bạn có thể làm gì", "bạn giúp được gì", "chức năng",
                "hướng dẫn", "cách sử dụng", "làm thế nào để",
                "bạn có thể", "what can you do", "how to use"
        };

        for (String pattern : greetingPatterns) {
            if (lowerQuestion.contains(pattern)) {
                return true;
            }
        }

        for (String pattern : generalPatterns) {
            if (lowerQuestion.contains(pattern)) {
                return true;
            }
        }

        return false;
    }

    // Helper method để tạo system prompt
    private String buildSystemPrompt(String knowledgeSource, boolean allowOnlineSearch) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("=== VÀI TRÒ CỦA BẠN ===\n");
        prompt.append(
                "Bạn là HiveWise Assistant - Trợ lý tri thức thông minh của hệ thống quản lý kiến thức HiveWise.\n\n");

        prompt.append("🎯 **VAI TRÒ CHÍNH:**\n");
        prompt.append("• Trợ lý tri thức chuyên nghiệp và thân thiện\n");
        prompt.append("• Hỗ trợ người dùng tìm kiếm và hiểu thông tin trong vault\n");
        prompt.append("• Có thể chào hỏi, trò chuyện và hướng dẫn sử dụng hệ thống\n");
        prompt.append("• Trả lời các câu hỏi tổng quát khi được yêu cầu\n\n");

        prompt.append("📚 **NGUỒN KIẾN THỨC HIỆN TẠI:**\n");
        prompt.append("• ").append(getSourceDisplayName(knowledgeSource)).append("\n");
        if (allowOnlineSearch) {
            prompt.append("• Có thể tìm kiếm thông tin online nếu cần thiết\n");
        }
        prompt.append("\n");

        prompt.append("💬 **PHONG CÁCH GIAO TIẾP:**\n");
        prompt.append("• Thân thiện, chuyên nghiệp và hữu ích\n");
        prompt.append("• Sử dụng emoji phù hợp để làm rõ nội dung\n");
        prompt.append("• Trả lời rõ ràng, có cấu trúc và dễ hiểu\n");
        prompt.append("• Luôn ghi rõ nguồn thông tin ở cuối câu trả lời\n\n");

        return prompt.toString();
    }

    // Helper method để tạo hướng dẫn trả lời
    private String buildAnswerGuidelines(boolean hasVaultResults, boolean allowOnlineSearch, String sourceInfo) {
        StringBuilder guidelines = new StringBuilder();

        if (hasVaultResults) {
            guidelines.append("📋 **HƯỚNG DẪN:**\n");
            guidelines.append("1. Trả lời dựa trên kiến thức vault được cung cấp ở trên\n");
            guidelines.append("2. Tóm tắt thông tin một cách rõ ràng và có cấu trúc\n");
            guidelines.append("3. Sử dụng formatting phù hợp và emoji để làm rõ nội dung\n");
            guidelines.append("4. Ở cuối, ghi rõ: '📍 *Nguồn: ").append(sourceInfo).append("*'\n");
        } else if (allowOnlineSearch) {
            guidelines.append("📋 **HƯỚNG DẪN:**\n");
            guidelines.append("1. Không tìm thấy thông tin trong vault\n");
            guidelines.append("2. Hãy tìm kiếm thông tin online để trả lời\n");
            guidelines.append("3. Cung cấp câu trả lời chi tiết và đáng tin cậy\n");
            guidelines.append("4. Ghi rõ: '📍 *Nguồn: Tìm kiếm online (không có trong vault)*'\n");
        } else {
            guidelines.append("📋 **HƯỚNG DẪN:**\n");
            guidelines.append("1. Trả lời như một trợ lý tri thức thông minh và thân thiện\n");
            guidelines.append("2. Nếu là câu chào hỏi: Chào hỏi vui vẻ và giới thiệu vai trò của bạn\n");
            guidelines.append("3. Nếu không có thông tin trong vault: Giải thích lịch sự và đưa ra gợi ý\n");
            guidelines.append("4. Sử dụng emoji phù hợp để tạo cảm giác thân thiện\n");
            guidelines.append("5. Đề xuất các hành động người dùng có thể thử:\n");
            guidelines.append("   • Thử từ khóa tìm kiếm khác\n");
            guidelines.append("   • Bật tìm kiếm online nếu muốn tìm thông tin tổng quát\n");
            guidelines.append("   • Thêm kiến thức vào vault để tôi hỗ trợ tốt hơn\n");
        }

        return guidelines.toString();
    }

    public void saveKnowledgeToQdrant(KnowledgeItem knowledge) {
        try {
            System.out.println("Starting to save knowledge to Qdrant: " + knowledge.getName());

            String text = knowledge.getName() + " " + knowledge.getContent();
            System.out.println("Text to embed: " + text.substring(0, Math.min(100, text.length())) + "...");

            float[] vector = embedText(text);
            System.out.println("Generated vector with size: " + vector.length);

            // Tạo payload với đầy đủ thông tin
            Map<String, Object> payload = new HashMap<>();

            // Thông tin cơ bản của knowledge
            payload.put("title", knowledge.getName());
            payload.put("content", knowledge.getContent());
            payload.put("description", knowledge.getDescription());
            payload.put("id", knowledge.getId());
            payload.put("vaultId", knowledge.getVaultId());
            payload.put("visibility", knowledge.getVisibility().toString());
            payload.put("approvalStatus", knowledge.getApprovalStatus().toString());
            payload.put("createdAt", knowledge.getCreatedAt());
            payload.put("updatedAt", knowledge.getUpdatedAt());

            // Thông tin người tạo
            payload.put("createdBy", knowledge.getCreatedBy());
            payload.put("approvedBy", knowledge.getApprovedBy());
            payload.put("approvedAt", knowledge.getApprovedAt());

            // Thông tin folder
            if (knowledge.getFolder() != null) {
                payload.put("folderId", knowledge.getFolder().getId());
                payload.put("folderName", knowledge.getFolder().getName());
                payload.put("folderPath", getFolderPath(knowledge.getFolder()));
                payload.put("isPublicFolder", knowledge.getFolder().getIsPublic());
            }

            // Thông tin vault
            try {
                var vault = vaultRepository.findById(knowledge.getVaultId()).orElse(null);
                if (vault != null) {
                    payload.put("vaultName", vault.getName());
                    payload.put("vaultDescription", vault.getDescription());
                }
            } catch (Exception e) {
                System.err.println("Error getting vault info: " + e.getMessage());
            }

            // Thông tin người tạo (user details)
            try {
                var creator = userRepository.findById(knowledge.getCreatedBy()).orElse(null);
                if (creator != null) {
                    payload.put("creatorName", creator.getName());
                    payload.put("creatorEmail", creator.getEmail());
                    payload.put("creatorUsername", creator.getUsername());
                    payload.put("creatorAvatar", creator.getAvatar());
                }
            } catch (Exception e) {
                System.err.println("Error getting creator info: " + e.getMessage());
            }

            // Thông tin người approve (nếu có)
            if (knowledge.getApprovedBy() != null) {
                try {
                    var approver = userRepository.findById(knowledge.getApprovedBy()).orElse(null);
                    if (approver != null) {
                        payload.put("approverName", approver.getName());
                        payload.put("approverEmail", approver.getEmail());
                        payload.put("approverUsername", approver.getUsername());
                    }
                } catch (Exception e) {
                    System.err.println("Error getting approver info: " + e.getMessage());
                }
            }

            // Thông tin tags
            try {
                List<KnowledgeItemTag> knowledgeItemTags = knowledgeItemTagRepository
                        .findByKnowledgeItemId(knowledge.getId());
                List<String> tagNames = knowledgeItemTags.stream()
                        .map(kit -> kit.getTag().getName())
                        .collect(Collectors.toList());
                payload.put("tags", tagNames);
                payload.put("tagCount", tagNames.size());
            } catch (Exception e) {
                System.err.println("Error getting tags: " + e.getMessage());
                payload.put("tags", new ArrayList<>());
                payload.put("tagCount", 0);
            }

            // Thông tin thống kê (views, comments, ratings)
            try {
                long viewCount = knowledgeViewRepository.countViewsByKnowledgeItem(knowledge.getId());
                long commentCount = commentRepository.countByKnowledgeItemId(knowledge.getId());
                Double averageRating = ratingRepository.getAverageRatingByKnowledgeItemId(knowledge.getId());
                long ratingCount = ratingRepository.countByKnowledgeItemId(knowledge.getId());

                payload.put("viewCount", viewCount);
                payload.put("commentCount", commentCount);
                payload.put("averageRating", averageRating != null ? averageRating : 0.0);
                payload.put("ratingCount", ratingCount);

                // Tính engagement score
                double engagementScore = (viewCount * 1.0) + (commentCount * 5.0)
                        + ((averageRating != null ? averageRating : 0.0) * 2.0);
                payload.put("engagementScore", engagementScore);
            } catch (Exception e) {
                System.err.println("Error getting statistics: " + e.getMessage());
                payload.put("viewCount", 0L);
                payload.put("commentCount", 0L);
                payload.put("averageRating", 0.0);
                payload.put("ratingCount", 0L);
                payload.put("engagementScore", 0.0);
            }

            System.out.println("Created comprehensive payload for knowledge: " + knowledge.getId());
            System.out.println("Payload contains " + payload.size() + " fields");

            qdrantService.upsertKnowledge("knowledge", knowledge.getId(), vector, payload);
            System.out.println("Successfully saved knowledge to Qdrant: " + knowledge.getName());
        } catch (Exception e) {
            System.err.println("Error saving knowledge to Qdrant: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Lấy đường dẫn đầy đủ của folder
     */
    private String getFolderPath(Folder folder) {
        if (folder == null) {
            return "";
        }

        List<String> pathParts = new ArrayList<>();
        Folder currentFolder = folder;

        // Đi ngược lên từ folder hiện tại đến root
        while (currentFolder != null) {
            pathParts.add(0, currentFolder.getName()); // Thêm vào đầu list
            if (currentFolder.getParentId() != null) {
                currentFolder = folderRepository.findById(currentFolder.getParentId()).orElse(null);
            } else {
                currentFolder = null;
            }
        }

        return String.join(" / ", pathParts);
    }

    public String askAI(String question, List<KnowledgeItem> knowledge, String knowledgeSource,
            boolean allowOnlineSearch) {
        // 1. Tạo embedding cho câu hỏi
        float[] questionVector = embedText(question);
        System.out.println("Generated question vector with size: " + questionVector.length);

        // 2. Kiểm tra xem có phải câu hỏi chào hỏi hoặc general không
        boolean isGreetingOrGeneral = isGreetingOrGeneralQuestion(question);

        // 3. Truy vấn Qdrant để lấy knowledge liên quan (filtered by source) - chỉ khi
        // không phải greeting
        List<Map<String, Object>> results = new ArrayList<>();
        if (!isGreetingOrGeneral) {
            results = searchQdrantBySource("knowledge", questionVector, 5, knowledgeSource);
            System.out.println("Qdrant search returned " + results.size() + " results for source: " + knowledgeSource);
        }

        // 4. Ghép context knowledge từ vault
        StringBuilder context = new StringBuilder();
        boolean hasQdrantResults = false;
        String sourceInfo = "";

        // Thêm system prompt cho Gemini
        String systemPrompt = buildSystemPrompt(knowledgeSource, allowOnlineSearch);
        context.append(systemPrompt).append("\n\n");

        if (!results.isEmpty() && !isGreetingOrGeneral) {
            context.append("=== KIẾN THỨC TRONG VAULT ===\n");
            context.append("Nguồn: " + getSourceDisplayName(knowledgeSource) + "\n\n");
            sourceInfo = "vault (" + getSourceDisplayName(knowledgeSource) + ")";

            for (Map<String, Object> item : results) {
                System.out.println("Processing search result item: " + item);
                @SuppressWarnings("unchecked")
                Map<String, Object> payload = (Map<String, Object>) item.get("payload");
                if (payload != null) {
                    System.out.println("Payload keys: " + payload.keySet());
                    String title = (String) payload.get("title");
                    String content = (String) payload.get("content");

                    System.out.println("Extracted title: " + title);
                    System.out.println("Extracted content length: " + (content != null ? content.length() : "null"));

                    // Chỉ cần content không null là đủ, title có thể null
                    if (content != null && !content.trim().isEmpty()) {
                        if (title != null && !title.trim().isEmpty()) {
                            context.append("📄 ").append(title).append("\n");
                        }
                        context.append(content).append("\n\n");
                        hasQdrantResults = true;
                        System.out.println("Added Qdrant result: " + (title != null ? title : "[No title]"));
                    } else {
                        System.out.println("Warning: payload contains null or empty content");
                        System.out.println("Payload content: " + content);
                    }
                } else {
                    System.out.println("Warning: payload is null for item: " + item);
                }
            }
        }

        // Nếu không có kết quả từ Qdrant và không phải greeting, thử fallback knowledge
        // từ database
        if (!hasQdrantResults && knowledge != null && !knowledge.isEmpty() && !isGreetingOrGeneral) {
            System.out.println("No valid results from Qdrant, using fallback knowledge from database");
            context.append("=== KIẾN THỨC TRONG VAULT ===\n");
            context.append("Nguồn: " + getSourceDisplayName(knowledgeSource) + "\n\n");
            sourceInfo = "vault (" + getSourceDisplayName(knowledgeSource) + ")";

            for (KnowledgeItem item : knowledge) {
                context.append("📄 ").append(item.getName()).append("\n");
                context.append(item.getContent()).append("\n\n");
                System.out.println("Added database knowledge: " + item.getName());
                hasQdrantResults = true;
            }
        }

        // 5. Nếu vẫn không có kết quả từ vault và được phép search online
        if (!hasQdrantResults && allowOnlineSearch && !isGreetingOrGeneral) {
            System.out.println("No knowledge found in vault, performing online search");
            String onlineInfo = searchOnline(question);
            if (onlineInfo != null && !onlineInfo.trim().isEmpty()) {
                context.append("=== THÔNG TIN TỪ TÌM KIẾM ONLINE ===\n");
                context.append(onlineInfo).append("\n\n");
                sourceInfo = "Tìm kiếm online (không có trong vault)";
                hasQdrantResults = true;
            }
        }

        // 6. Tạo prompt cuối cùng
        String finalPrompt = context.toString() +
                "=== CÂU HỎI CỦA NGƯỜI DÙNG ===\n" +
                question + "\n\n" +
                "=== HƯỚNG DẪN TRẢ LỜI ===\n" +
                buildAnswerGuidelines(hasQdrantResults, allowOnlineSearch, sourceInfo);

        System.out.println(
                "Sending prompt to Gemini: " + finalPrompt.substring(0, Math.min(300, finalPrompt.length())) + "...");
        String rawResponse = geminiService.askGemini(finalPrompt);

        // 7. Format response thành HTML đẹp
        return formatResponseToHtml(rawResponse);
    }

    private String formatResponseToHtml(String rawResponse) {
        if (rawResponse == null || rawResponse.trim().isEmpty()) {
            return "<p>Không nhận được câu trả lời từ AI.</p>";
        }

        // Clean up response
        String cleanedResponse = rawResponse.trim();

        // Convert markdown-like formatting thành HTML
        StringBuilder html = new StringBuilder();
        html.append(
                "<div style='font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #374151;'>");

        // Split thành paragraphs by double newlines
        String[] paragraphs = cleanedResponse.split("\n\n");

        for (String paragraph : paragraphs) {
            paragraph = paragraph.trim();
            if (paragraph.isEmpty())
                continue;

            // Handle bold text with **
            if (paragraph.contains("**")) {
                paragraph = paragraph.replaceAll("\\*\\*(.*?)\\*\\*",
                        "<strong style='font-weight: 600; color: #1f2937;'>$1</strong>");
            }

            // Check if it's a list paragraph (contains bullet points with *)
            if (paragraph.contains(" * ")) {
                String[] parts = paragraph.split(" \\* ");

                // First part is the intro text
                if (parts[0].trim().length() > 0) {
                    html.append("<p style='margin: 10px 0;'>").append(parts[0].trim()).append("</p>");
                }

                // Remaining parts are list items
                if (parts.length > 1) {
                    html.append("<ul style='margin: 10px 0; padding-left: 24px; list-style-type: disc;'>");
                    for (int i = 1; i < parts.length; i++) {
                        String listItem = parts[i].trim();
                        if (!listItem.isEmpty()) {
                            html.append("<li style='margin: 8px 0; padding-left: 4px;'>").append(listItem)
                                    .append("</li>");
                        }
                    }
                    html.append("</ul>");
                }
            }
            // Check if it starts with bullet point
            else if (paragraph.startsWith("* ") || paragraph.startsWith("- ")) {
                if (!html.toString().endsWith("</ul>")) {
                    html.append("<ul style='margin: 10px 0; padding-left: 24px; list-style-type: disc;'>");
                }
                String listItem = paragraph.substring(2).trim(); // Remove "* " or "- "
                html.append("<li style='margin: 8px 0; padding-left: 4px;'>").append(listItem).append("</li>");

                // Note: We'll close this ul tag later if needed
            }
            // Handle headers (lines ending with : or containing **)
            else if (paragraph.endsWith(":") && paragraph.length() < 100) {
                html.append("<h4 style='margin: 20px 0 10px 0; font-weight: 600; color: #1f2937; font-size: 1.1em;'>")
                        .append(paragraph).append("</h4>");
            }
            // Regular paragraph
            else {
                // Close any open ul tag first
                if (html.toString().contains("<ul") && !html.toString().endsWith("</ul>")) {
                    html.append("</ul>");
                }
                html.append("<p style='margin: 12px 0;'>").append(paragraph).append("</p>");
            }
        }

        // Close any remaining open ul tag
        if (html.toString().contains("<ul") && !html.toString().endsWith("</ul>")) {
            html.append("</ul>");
        }

        html.append("</div>");

        return html.toString();
    }
}