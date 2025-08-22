package com.capstone_project.capstone_project.security;

import com.capstone_project.capstone_project.security.filter.JwtAuthenticationFilter;
import com.capstone_project.capstone_project.service.CustomOAuth2UserService;
import com.capstone_project.capstone_project.util.JwtUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SecurityConfig {

        CustomOAuth2UserService customOAuth2UserService;
        OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
        JwtUtil jwtUtil;
        UserDetailsService userDetailsService;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtUtil, userDetailsService);

                http
                                .csrf(csrf -> csrf.disable())
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/",
                                                                "/auth/**",
                                                                "/css/**",
                                                                "/js/**",
                                                                "/images/**",
                                                                "/static/**",
                                                                "/resources/**",
                                                                "/access-denied")
                                                .permitAll()
                                                .requestMatchers("/dashboard/**")
                                                .hasAuthority("ADMIN")
                                                .requestMatchers("/vault-management/**", "/api/folders/**",
                                                                "/vault-detail/**", "/notification/**")
                                                .hasAnyAuthority("USER", "ADMIN")
                                                .anyRequest().permitAll())
                                .exceptionHandling(ex -> ex
                                                .accessDeniedPage("/access-denied"))
                                .oauth2Login(oauth2 -> oauth2
                                                .loginPage("/auth/log-in")
                                                .userInfoEndpoint(userInfo -> userInfo
                                                                .userService(customOAuth2UserService))
                                                .successHandler(oAuth2LoginSuccessHandler))
                                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}
