package com.capstone_project.capstone_project.interceptor;

import com.capstone_project.capstone_project.service.VisitService;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@RequiredArgsConstructor
public class VisitTrackingInterceptor implements HandlerInterceptor {

    private final VisitService visitService;

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
                // Get user ID from authentication - you might need to adjust this based on your
                // auth implementation
                userId = authentication.getName(); // or extract from principal

                // Check if this is a login action
                isLogin = requestURI.contains("/auth/log-in") && "POST".equals(request.getMethod());
            }

            // Record the visit
            if (isLogin) {
                visitService.recordLoginVisit(userId, request);
            } else {
                visitService.recordVisit(userId, requestURI, request, false);
            }

        } catch (Exception e) {
            // Log error but don't interrupt the request
            System.err.println("Error tracking visit: " + e.getMessage());
        }

        return true;
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
