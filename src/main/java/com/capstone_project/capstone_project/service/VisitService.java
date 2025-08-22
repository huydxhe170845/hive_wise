package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.model.Visit;
import com.capstone_project.capstone_project.repository.VisitRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VisitService {

    VisitRepository visitRepository;

    public void recordVisit(String userId, String pageUrl, HttpServletRequest request, boolean isLogin) {
        String sessionId = getSessionId(request);
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");

        Visit visit = Visit.builder()
                .userId(userId)
                .sessionId(sessionId)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .pageUrl(pageUrl)
                .isLogin(isLogin)
                .visitTime(LocalDateTime.now())
                .build();

        visitRepository.save(visit);
    }

    public void recordAnonymousVisit(String pageUrl, HttpServletRequest request) {
        recordVisit(null, pageUrl, request, false);
    }

    public void recordLoginVisit(String userId, HttpServletRequest request) {
        recordVisit(userId, "/auth/log-in", request, true);
    }

    public long getTotalVisitsToday() {
        return visitRepository.countTotalVisitsToday();
    }

    public long getUniqueVisitorsToday() {
        return visitRepository.countUniqueVisitorsToday();
    }

    public long getTotalVisitsThisMonth() {
        return visitRepository.countTotalVisitsThisMonth();
    }

    public long getUniqueVisitorsThisMonth() {
        return visitRepository.countUniqueVisitorsThisMonth();
    }

    public double getAverageVisitsPerDay() {
        long totalVisitsThisMonth = getTotalVisitsThisMonth();
        LocalDateTime now = LocalDateTime.now();
        int dayOfMonth = now.getDayOfMonth();

        if (dayOfMonth == 0)
            return 0.0;
        return (double) totalVisitsThisMonth / dayOfMonth;
    }

    public long getLoginVisitsToday() {
        return visitRepository.countLoginVisitsToday();
    }

    public boolean hasUserVisitedToday(String userId) {
        if (userId == null)
            return false;
        return visitRepository.hasUserVisitedToday(userId);
    }

    public long getUserVisitsToday(String userId) {
        if (userId == null)
            return 0;
        return visitRepository.countVisitsByUserToday(userId);
    }

    public List<Long> getDailyVisitsLast7Days() {
        List<Long> dailyVisits = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 6; i >= 0; i--) {
            LocalDateTime date = now.minusDays(i);
            long visits = visitRepository.countVisitsByDate(date);
            dailyVisits.add(visits);
        }

        return dailyVisits;
    }

    private String getSessionId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        return session != null ? session.getId() : null;
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
}
