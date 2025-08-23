package com.capstone_project.capstone_project.interceptor;

import com.capstone_project.capstone_project.security.CustomUserDetails;
import com.capstone_project.capstone_project.service.VisitService;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class VisitTrackingInterceptor implements HandlerInterceptor {

    private final VisitService visitService;

    // In-memory cache to track visits per user per day
    // Key: userId_date, Value: last visit timestamp
    private final ConcurrentHashMap<String, LocalDateTime> userVisitCache = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull Object handler) {
        // Skip tracking for static resources, API calls, and health checks
        String requestURI = request.getRequestURI();

        if (shouldSkipTracking(requestURI)) {
            return true;
        }

        try {
            // Get current user if authenticated
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userId = null;
            boolean isLogin = false;

            if (authentication != null && authentication.isAuthenticated()
                    && !authentication.getName().equals("anonymousUser")) {

                // Properly extract userId from CustomUserDetails
                if (authentication.getPrincipal() instanceof CustomUserDetails) {
                    CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
                    userId = userDetails.getId();
                } else {
                    // Fallback to username if CustomUserDetails is not available
                    userId = authentication.getName();
                }

                // Check if this is a login action
                isLogin = requestURI.contains("/auth/log-in") && "POST".equals(request.getMethod());
            }

            // Check if we should record this visit (avoid duplicate visits in same day)
            if (shouldRecordVisit(request, userId, isLogin)) {
                // Record the visit
                if (isLogin) {
                    visitService.recordLoginVisit(userId, request);
                } else {
                    visitService.recordVisit(userId, requestURI, request, false);
                }
            }

        } catch (Exception e) {
            // Log error but don't interrupt the request
            System.err.println("Error tracking visit: " + e.getMessage());
        }

        return true;
    }

    private boolean shouldRecordVisit(HttpServletRequest request, String userId, boolean isLogin) {
        // Clean up old cache entries periodically
        cleanupOldCacheEntries();

        // For login visits, always record
        if (isLogin) {
            return true;
        }

        // For anonymous users, use IP-based tracking with time limit
        if (userId == null) {
            String ipAddress = getClientIpAddress(request);
            String ipKey = "ip_" + ipAddress + "_" + LocalDate.now();

            LocalDateTime lastVisit = userVisitCache.get(ipKey);
            LocalDateTime now = LocalDateTime.now();

            // Allow visit if no previous visit today or if more than 30 minutes have passed
            if (lastVisit == null || now.isAfter(lastVisit.plusMinutes(30))) {
                userVisitCache.put(ipKey, now);
                return true;
            }

            return false;
        }

        // For authenticated users, use user-based tracking with time limit
        String userKey = userId + "_" + LocalDate.now();
        LocalDateTime lastVisit = userVisitCache.get(userKey);
        LocalDateTime now = LocalDateTime.now();

        // Allow visit if no previous visit today or if more than 30 minutes have passed
        if (lastVisit == null || now.isAfter(lastVisit.plusMinutes(30))) {
            userVisitCache.put(userKey, now);
            return true;
        }

        return false;
    }

    private void cleanupOldCacheEntries() {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);

        // Remove entries from yesterday and earlier
        userVisitCache.entrySet().removeIf(entry -> {
            String key = entry.getKey();
            if (key.contains("_")) {
                String datePart = key.substring(key.lastIndexOf("_") + 1);
                try {
                    LocalDate entryDate = LocalDate.parse(datePart);
                    return entryDate.isBefore(today);
                } catch (Exception e) {
                    // If we can't parse the date, remove the entry
                    return true;
                }
            }
            return false;
        });
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    private boolean shouldSkipTracking(String requestURI) {
        return requestURI.startsWith("/css/") ||
                requestURI.startsWith("/js/") ||
                requestURI.startsWith("/images/") ||
                requestURI.startsWith("/vendor/") ||
                requestURI.startsWith("/api/") ||
                requestURI.startsWith("/actuator/") ||
                requestURI.equals("/favicon.ico") ||
                requestURI.equals("/health") ||
                requestURI.endsWith(".css") ||
                requestURI.endsWith(".js") ||
                requestURI.endsWith(".ico") ||
                requestURI.endsWith(".png") ||
                requestURI.endsWith(".jpg") ||
                requestURI.endsWith(".jpeg") ||
                requestURI.endsWith(".gif") ||
                requestURI.endsWith(".svg");
    }
}
