package com.capstone_project.capstone_project.config;

import com.capstone_project.capstone_project.interceptor.VisitTrackingInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final VisitTrackingInterceptor visitTrackingInterceptor;

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        registry.addInterceptor(visitTrackingInterceptor)
                .addPathPatterns("/**") // Track all pages
                .excludePathPatterns(
                        "/css/**",
                        "/js/**",
                        "/images/**",
                        "/vendor/**",
                        "/favicon.ico",
                        "/error",
                        "/actuator/**");
    }
}
