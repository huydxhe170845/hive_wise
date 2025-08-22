package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.dto.request.*;
import com.capstone_project.capstone_project.dto.response.*;
import com.capstone_project.capstone_project.enums.AuthProvider;
import com.capstone_project.capstone_project.enums.PurposeToken;
import com.capstone_project.capstone_project.exception.FieldValidationException;
import com.capstone_project.capstone_project.model.SystemRole;
import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.model.VerificationToken;
import com.capstone_project.capstone_project.repository.UserRepository;
import com.capstone_project.capstone_project.repository.SystemRoleRepository;
import com.capstone_project.capstone_project.repository.VerificationTokenRepository;
import com.capstone_project.capstone_project.util.JwtUtil;
import com.capstone_project.capstone_project.util.TokenGenerator;
import jakarta.mail.MessagingException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthService {

    UserRepository userRepository;
    SystemRoleRepository systemRoleRepository;
    VerificationTokenRepository tokenRepository;
    EmailService emailService;
    JwtUtil jwtUtil;
    TokenGenerator tokenGenerator;
    PasswordEncoder passwordEncoder;

    // -----------------------------Sign up-----------------------------

    public SignUpResponse signup(SignUpRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new FieldValidationException("email", "Email đã được sử dụng.");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new FieldValidationException("username", "Username đã được sử dụng.");
        }
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new FieldValidationException("confirmPassword", "Confirm password không khớp với password");
        }
        String encodedPassword = new BCryptPasswordEncoder(10).encode(request.getPassword());
        SystemRole defaultRole = systemRoleRepository.findById(2)
                .orElseThrow(() -> new RuntimeException("System role not found"));
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(encodedPassword)
                .isActivated(false)
                .authProvider(AuthProvider.LOCAL)
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
        try {
            emailService.sendVerificationEmail(user.getEmail(), token);
        } catch (MessagingException | IOException e) {
            throw new RuntimeException("Lỗi gửi email xác nhận", e);
        }
        return new SignUpResponse(user.getEmail(), expiry);
    }

    // -----------------------------Verify account-----------------------------

    public void verifyAccount(String token) {
        VerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("YOUR ACCOUNT VERIFICATION LINK HAS EXPIRED.."));
        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("YOUR ACCOUNT VERIFICATION LINK HAS EXPIRED.");
        }
        User user = verificationToken.getUser();
        user.setActivated(true);
        userRepository.save(user);
        tokenRepository.delete(verificationToken);
    }

    // -----------------------------Resend verification email
    // -----------------------------

    public long resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email).get();
        if (user.isActivated()) {
            throw new IllegalStateException("Tài khoản đã được kích hoạt vui lòng đăng nhập.");
        }
        Optional<VerificationToken> existingTokenOpt = tokenRepository
                .findTopByUserAndPurposeTokenOrderByExpiryDateDesc(user, PurposeToken.ACTIVATION);
        if (existingTokenOpt.isPresent()) {
            VerificationToken existingToken = existingTokenOpt.get();
            if (existingToken.getExpiryDate().isAfter(LocalDateTime.now())) {
                Duration duration = Duration.between(LocalDateTime.now(), existingToken.getExpiryDate());
                return duration.getSeconds();
            } else {
                tokenRepository.delete(existingToken);
            }
        }
        String token = tokenGenerator.generateToken();
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(5);

        VerificationToken newToken = VerificationToken.builder()
                .token(token)
                .user(user)
                .purposeToken(PurposeToken.ACTIVATION)
                .expiryDate(expiry)
                .build();
        tokenRepository.save(newToken);
        try {
            emailService.sendVerificationEmail(email, token);
        } catch (MessagingException | IOException e) {
            throw new RuntimeException("Lỗi khi gửi email xác nhận.", e);
        }
        return Duration.between(LocalDateTime.now(), expiry).getSeconds();
    }

    // -----------------------------log in-----------------------------

    public LoginResponse login(LogInRequest request) {
        String input = request.getUsername();

        // 1. Tìm user trong database trước với eager loading SystemRole
        User user = userRepository.findByUsernameOrEmailWithRole(input, input)
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản hoặc mật khẩu không đúng."));

        // 2. KIỂM TRA TRẠNG THÁI NGAY SAU KHI TÌM THẤY USER
        if (!user.isActivated()) {
            // Nếu tài khoản không hoạt động, báo lỗi ngay lập tức
            throw new IllegalStateException("Tài khoản của bạn đã bị vô hiệu hóa.");
        }

        // 3. Nếu tài khoản hoạt động, MỚI kiểm tra đến mật khẩu
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Tài khoản hoặc mật khẩu không đúng.");
        }

        // 4. Nếu mọi thứ hợp lệ, tạo token và trả về response
        String token = jwtUtil.generateToken(user.getUsername());
        String role = user.getSystemRole().getName();
        return new LoginResponse(token, role);
    }
    // -----------------------------Forgot password-----------------------------

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email này"));

        String token = tokenGenerator.generateToken();

        VerificationToken verificationToken = VerificationToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusMinutes(5))
                .purposeToken(PurposeToken.RESET_PASSWORD)
                .build();

        tokenRepository.save(verificationToken);
        try {
            emailService.sendResetPasswordEmail(email, token);
        } catch (MessagingException | IOException e) {
            System.err.println("Lỗi gửi email xác minh: " + e.getMessage());
        }
    }

    // -----------------------------Reset password-----------------------------

    public void resetPassword(String token, ResetPasswordRequest request) {
        VerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("YOUR PASSWORD RESET LINK IS INVALID."));
        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("YOUR PASSWORD RESET LINK HAS EXPIRED.");
        }
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new FieldValidationException("Mật khẩu và xác nhận không khớp.");
        }
        User user = verificationToken.getUser();
        String encodedPassword = new BCryptPasswordEncoder(10).encode(request.getPassword());
        user.setPassword(encodedPassword);
        userRepository.save(user);
        tokenRepository.delete(verificationToken);
    }

    public boolean isTokenValid(String token) {
        VerificationToken verificationToken = tokenRepository.findByToken(token)
                .orElse(null);
        if (verificationToken == null) {
            return false;
        }
        return !verificationToken.getExpiryDate().isBefore(LocalDateTime.now());
    }

    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new FieldValidationException("currentPassword", "Mật khẩu hiện tại không đúng.");
        }
        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new FieldValidationException("confirmNewPassword", "Mật khẩu xác nhận không khớp.");
        }
        String encodedPassword = new BCryptPasswordEncoder(10).encode(request.getNewPassword());
        user.setPassword(encodedPassword);
        userRepository.save(user);
    }

    public void addPassword(String userId, AddPasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new FieldValidationException("confirmNewPassword", "Mật khẩu xác nhận không khớp.");
        }
        String encodedPassword = new BCryptPasswordEncoder(10).encode(request.getNewPassword());
        user.setPassword(encodedPassword);
        userRepository.save(user);
    }

    public void updateProfile(String userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng."));

        user.setName(request.getName());
        user.setGender(request.getGender());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setDateOfBirth(request.getDateOfBirth());

        userRepository.save(user);
    }

}
