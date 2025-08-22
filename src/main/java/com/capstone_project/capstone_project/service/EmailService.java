package com.capstone_project.capstone_project.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EmailService {

    JavaMailSender mailSender;

    @Async
    public void sendVerificationCodeEmail(String to, String code) throws MessagingException, IOException {
        String subject = "Mã xác thực email";
        String body = loadHtmlTemplate("templates/email-verification-code.html")
                .replace("{{code}}", code);
        sendHtmlEmail(to, subject, body);
    }

    @Async
    public void sendRegitrationSuccessEmail(String to) throws MessagingException, IOException {
        String subject = "Đăng ký thành công";
        String link = "http://localhost:8080/auth/log-in";
        String body = loadHtmlTemplate("templates/email-noti-regitration.html")
                .replace("{{link}}", link);
        sendHtmlEmail(to, subject, body);
    }

    @Async
    public void sendVerificationEmail(String to, String token) throws MessagingException, IOException {
        String subject = "Xác nhận tài khoản";
        String link = "http://localhost:8080/auth/verify?token=" + token;
        String body = loadHtmlTemplate("templates/email-verify-email.html")
                .replace("{{link}}", link);
        sendHtmlEmail(to, subject, body);
    }

    @Async
    public void sendResetPasswordEmail(String to, String token) throws MessagingException, IOException {
        String subject = "Đặt lại mật khẩu";
        String link = "http://localhost:8080/auth/reset-password?token=" + token;
        String body = loadHtmlTemplate("templates/email-reset-password.html")
                .replace("{{link}}", link);
        sendHtmlEmail(to, subject, body);
    }

    @Async
    public void sendWelcomeEmail(String to, String username, String name) throws MessagingException, IOException {
        String subject = "Chào mừng bạn đến với HiveWise KMS";
        String displayName = (name != null && !name.trim().isEmpty()) ? name : username;
        String body = loadHtmlTemplate("templates/email-welcome.html")
                .replace("{{username}}", username)
                .replace("{{name}}", displayName)
                .replace("{{loginLink}}", "http://localhost:8080/auth/log-in");
        sendHtmlEmail(to, subject, body);
    }

    @Async
    public void sendWelcomeEmailWithPassword(String to, String username, String name, String password) throws MessagingException, IOException {
        String subject = "Chào mừng bạn đến với HiveWise KMS - Thông tin đăng nhập";
        String displayName = (name != null && !name.trim().isEmpty()) ? name : username;
        String body = loadHtmlTemplate("templates/email-welcome-with-password.html")
                .replace("{{username}}", username)
                .replace("{{name}}", displayName)
                .replace("{{password}}", password)
                .replace("{{loginLink}}", "http://localhost:8080/auth/log-in");
        sendHtmlEmail(to, subject, body);
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlBody, true); // true = HTML content

        mailSender.send(message);
    }

    private String loadHtmlTemplate(String path) throws IOException {
        ClassPathResource resource = new ClassPathResource(path);
        return Files.readString(resource.getFile().toPath(), StandardCharsets.UTF_8);
    }
}
