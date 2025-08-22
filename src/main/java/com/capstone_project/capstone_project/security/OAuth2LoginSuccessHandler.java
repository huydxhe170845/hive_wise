package com.capstone_project.capstone_project.security;

import com.capstone_project.capstone_project.enums.AuthProvider;
import com.capstone_project.capstone_project.enums.PurposeToken;
import com.capstone_project.capstone_project.model.SystemRole;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.model.VerificationToken;
import com.capstone_project.capstone_project.repository.SystemRoleRepository;
import com.capstone_project.capstone_project.repository.UserRepository;
import com.capstone_project.capstone_project.repository.VerificationTokenRepository;
import com.capstone_project.capstone_project.service.EmailService;
import com.capstone_project.capstone_project.util.JwtUtil;
import com.capstone_project.capstone_project.util.TokenGenerator;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    UserRepository userRepository;
    SystemRoleRepository systemRoleRepository;
    TokenGenerator tokenGenerator;
    VerificationTokenRepository tokenRepository;
    EmailService emailService;
    JwtUtil jwtUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException {
        CustomOAuth2User oauthUser = (CustomOAuth2User) authentication.getPrincipal();
        String email = oauthUser.getEmail();
        Optional<User> optionalUser = userRepository.findByEmail(email);
        User user;
        SystemRole defaultRole = systemRoleRepository.findById(2)
                .orElseThrow(() -> new RuntimeException("System role not found"));
        if (optionalUser.isEmpty()) {
            user = User.builder()
                    .email(email)
                    .username(email)
                    .googleId(oauthUser.getGoogleId())
                    .googleFirstName(oauthUser.getFirstName())
                    .googleFamilyName(oauthUser.getLastName())
                    .avatar(oauthUser.getPicture())
                    .authProvider(AuthProvider.GOOGLE)
                    .isVerifiedEmailGoogle(oauthUser.isEmailVerified())
                    .isActivated(false)
                    .createdAt(LocalDateTime.now())
                    .systemRole(defaultRole)
                    .build();
            userRepository.save(user);
            String token = tokenGenerator.generateToken();
            LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);

            VerificationToken verificationToken = VerificationToken.builder()
                    .token(token)
                    .user(user)
                    .purposeToken(PurposeToken.ACTIVATION)
                    .expiryDate(expiry)
                    .build();
            tokenRepository.save(verificationToken);
            HttpSession session = request.getSession();
            session.setAttribute("email", user.getEmail());
            session.setAttribute("expiry", expiry);
            try {
                emailService.sendVerificationEmail(user.getEmail(), token);
            } catch (Exception e) {
                session.setAttribute("errorMessage",
                        "Gửi email xác thực thất bại. Vui lòng kiểm tra lại địa chỉ email hoặc thử lại sau.");
            }
            response.sendRedirect("/auth/active-account");
            return;
        } else {
            user = optionalUser.get();
        }
        if (user.getAuthProvider() == AuthProvider.LOCAL) {
            response.sendRedirect("/auth/log-in");
            return;
        }
        if (!user.isActivated()) {
            HttpSession session = request.getSession();
            session.setAttribute("email", user.getEmail());
            Optional<VerificationToken> tokenOpt = tokenRepository
                    .findTopByUserAndPurposeTokenOrderByExpiryDateDesc(user, PurposeToken.ACTIVATION);
            tokenOpt.ifPresent(token -> session.setAttribute("expiry", token.getExpiryDate()));
            response.sendRedirect("/auth/active-account");
            return;
        }

        String token = jwtUtil.generateToken(user.getUsername());
        Cookie tokenCookie = new Cookie("jwtToken", token);
        tokenCookie.setHttpOnly(true);
        tokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7 ngày
        tokenCookie.setPath("/");
        response.addCookie(tokenCookie);

        // Kiểm tra role và chuyển hướng phù hợp
        if (user.getSystemRole().getId() == 1) {
            response.sendRedirect("/dashboard");
        } else {
            response.sendRedirect("/vault-management");
        }
    }

}
