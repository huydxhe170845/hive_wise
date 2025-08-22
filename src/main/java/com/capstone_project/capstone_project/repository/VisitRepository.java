package com.capstone_project.capstone_project.repository;

import com.capstone_project.capstone_project.model.Visit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface VisitRepository extends JpaRepository<Visit, Long> {

    @Query("SELECT COUNT(DISTINCT v.userId) FROM Visit v WHERE DATE(v.visitTime) = CURRENT_DATE AND v.userId IS NOT NULL")
    long countUniqueVisitorsToday();

    @Query("SELECT COUNT(v) FROM Visit v WHERE DATE(v.visitTime) = CURRENT_DATE")
    long countTotalVisitsToday();

    @Query("SELECT COUNT(v) FROM Visit v WHERE YEAR(v.visitTime) = YEAR(CURRENT_DATE) AND MONTH(v.visitTime) = MONTH(CURRENT_DATE)")
    long countTotalVisitsThisMonth();

    @Query("SELECT COUNT(DISTINCT v.userId) FROM Visit v WHERE YEAR(v.visitTime) = YEAR(CURRENT_DATE) AND MONTH(v.visitTime) = MONTH(CURRENT_DATE) AND v.userId IS NOT NULL")
    long countUniqueVisitorsThisMonth();

    @Query("SELECT COUNT(v) FROM Visit v WHERE v.visitTime BETWEEN :startDate AND :endDate")
    long countVisitsBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(DISTINCT v.userId) FROM Visit v WHERE v.visitTime BETWEEN :startDate AND :endDate AND v.userId IS NOT NULL")
    long countUniqueVisitorsBetween(@Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(v) FROM Visit v WHERE DATE(v.visitTime) = CURRENT_DATE AND v.isLogin = true")
    long countLoginVisitsToday();

    @Query("SELECT COUNT(v) FROM Visit v WHERE v.userId = :userId AND DATE(v.visitTime) = CURRENT_DATE")
    long countVisitsByUserToday(@Param("userId") String userId);

    @Query("SELECT COUNT(v) > 0 FROM Visit v WHERE v.userId = :userId AND DATE(v.visitTime) = CURRENT_DATE")
    boolean hasUserVisitedToday(@Param("userId") String userId);

    @Query("SELECT COUNT(v) FROM Visit v WHERE DATE(v.visitTime) = DATE(:date)")
    long countVisitsByDate(@Param("date") LocalDateTime date);

    @Query("SELECT COUNT(DISTINCT v.userId) FROM Visit v WHERE DATE(v.visitTime) = DATE(:date) AND v.userId IS NOT NULL")
    long countUniqueVisitorsByDate(@Param("date") LocalDateTime date);
}
