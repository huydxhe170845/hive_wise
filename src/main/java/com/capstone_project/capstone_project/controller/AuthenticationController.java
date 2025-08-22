package com.capstone_project.capstone_project.controller;

import com.capstone_project.capstone_project.dto.request.*;
import com.capstone_project.capstone_project.dto.response.*;
import com.capstone_project.capstone_project.exception.FieldValidationException;
import com.capstone_project.capstone_project.security.CustomUserDetails;
import com.capstone_project.capstone_project.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthService authService;

    // -----------------------------Get Mapping-----------------------------

    @GetMapping("/sign-up")
    public String showSignupForm(Model model) {
        model.addAttribute("registerRequest", new SignUpRequest());
        return "sign-up";
    }

    @GetMapping("/active-account")
    public String showActiveAccountPage(HttpSession session, Model model) {
        String email = (String) session.getAttribute("email");
        LocalDateTime expiry = (LocalDateTime) session.getAttribute("expiry");
        String errorMessage = (String) session.getAttribute("errorMessage");

        if (email == null || expiry == null) {
            return "redirect:/auth/log-in";
        }
        if (errorMessage != null) {
            model.addAttribute("errorMessage", errorMessage);
            session.removeAttribute("errorMessage");
        }
        long remainingSeconds = Duration.between(LocalDateTime.now(), expiry).getSeconds();
        if (remainingSeconds < 0)
            remainingSeconds = 0;
        model.addAttribute("email", email);
        model.addAttribute("remainingSeconds", remainingSeconds);
        return "active-account";
    }

    @GetMapping("/log-in")
    public String showLoginPage(Model model,
            @CookieValue(value = "rememberedUsername", defaultValue = "") String rememberedUsername) {
        LogInRequest loginRequest = new LogInRequest();
        loginRequest.setUsername(rememberedUsername);
        model.addAttribute("loginRequest", loginRequest);
        return "log-in";
    }

    @GetMapping("/forgot-password")
    public String showForgotPasswordForm(Model model) {
        model.addAttribute("forgotPasswordRequest", new ForgotPasswordRequest());
        return "forgot-password";
    }

    @GetMapping("/log-out")
    public String logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("jwtToken", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);
        return "redirect:/auth/log-in";
    }

    @GetMapping("/verify")
    public String verifyAccount(@RequestParam("token") String token, RedirectAttributes redirectAttributes) {
        try {
            authService.verifyAccount(token);
            redirectAttributes.addFlashAttribute("successMessage",
                    "Tài khoản của bạn đã được kích hoạt. Vui lòng đăng nhập.");
            return "redirect:/auth/log-in";
        } catch (RuntimeException ex) {
            redirectAttributes.addFlashAttribute("errorMessage", ex.getMessage());
            return "redirect:/auth/active-account";
        }
    }

    @GetMapping("/reset-password")
    public String showResetPasswordPage(@RequestParam("token") String token,
            Model model,
            RedirectAttributes redirectAttributes) {
        if (!authService.isTokenValid(token)) {
            redirectAttributes.addFlashAttribute("error", "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
            return "redirect:/auth/forgot-password";
        }
        model.addAttribute("token", token);
        model.addAttribute("error", null);
        model.addAttribute("resetPasswordRequest", new ResetPasswordRequest());
        return "reset-password";
    }

    @GetMapping("/oauth2/login")
    public String loginWithGoogle() {
        return "redirect:/oauth2/authorization/google";
    }

    // -----------------------------Post Mapping-----------------------------

    @PostMapping("/sign-up")
    public String processSignup(@ModelAttribute("registerRequest") @Valid SignUpRequest request,
            BindingResult bindingResult,
            RedirectAttributes redirectAttributes,
            HttpSession session) {
        if (!bindingResult.hasErrors()) {
            try {
                SignUpResponse response = authService.signup(request);
                session.setAttribute("email", response.getEmail());
                session.setAttribute("expiry", response.getExpiry());
                redirectAttributes.addFlashAttribute("sendSuccess", true);
                return "redirect:/auth/active-account";
            } catch (FieldValidationException e) {
                bindingResult.rejectValue(e.getField(), "error." + e.getField(), e.getMessage());
            }
        }
        return "sign-up";
    }

    @PostMapping("/resend-verification")
    public String resendEmail(@RequestParam String email,
            RedirectAttributes redirectAttributes,
            HttpSession session) {
        try {
            long remainingSeconds = authService.resendVerificationEmail(email);
            session.setAttribute("email", email);
            session.setAttribute("expiry", LocalDateTime.now().plusSeconds(remainingSeconds));
            redirectAttributes.addFlashAttribute("resendSuccess", true);
        } catch (IllegalStateException e) {
            redirectAttributes.addFlashAttribute("errorMessage", e.getMessage());
            redirectAttributes.addFlashAttribute("isActivated", true);
        } catch (RuntimeException e) {
            redirectAttributes.addFlashAttribute("errorMessage", "Đã xảy ra lỗi: " + e.getMessage());
        }
        return "redirect:/auth/active-account";
    }

    @PostMapping("/log-in")
    public String processLogin(@ModelAttribute("loginRequest") @Valid LogInRequest request,
            BindingResult bindingResult,
            Model model,
            HttpServletResponse response) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("loginRequest", request);
            return "log-in";
        }
        try {
            LoginResponse loginResponse = authService.login(request);
            if (request.isRememberMe()) {
                Cookie usernameCookie = new Cookie("rememberedUsername", request.getUsername());
                usernameCookie.setMaxAge(7 * 24 * 60 * 60);
                usernameCookie.setPath("/");
                response.addCookie(usernameCookie);

            } else {
                Cookie usernameCookie = new Cookie("rememberedUsername", null);
                usernameCookie.setMaxAge(0);
                usernameCookie.setPath("/");
                response.addCookie(usernameCookie);
            }
            Cookie tokenCookie = new Cookie("jwtToken", loginResponse.getToken());
            tokenCookie.setHttpOnly(true);
            tokenCookie.setMaxAge(7 * 24 * 60 * 60);
            tokenCookie.setPath("/");
            response.addCookie(tokenCookie);

            if ("ADMIN".equals(loginResponse.getRole())) {
                return "redirect:/dashboard";
            } else if ("USER".equals(loginResponse.getRole())) {
                return "redirect:/vault-management";
            } else {
                return "redirect:/access-denied";
            }

        } catch (IllegalArgumentException | IllegalStateException e) {
            model.addAttribute("error", e.getMessage());
            model.addAttribute("loginRequest", request);
            return "log-in";
        } catch (Exception e) {
            model.addAttribute("error", "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.");
            return "log-in";
        }
    }

    @PostMapping("/forgot-password")
    public String processForgotPassword(
            @Valid @ModelAttribute("forgotPasswordRequest") ForgotPasswordRequest request,
            BindingResult bindingResult,
            Model model) {

        if (bindingResult.hasErrors()) {
            return "forgot-password";
        }
        try {
            authService.forgotPassword(request.getEmail());
            model.addAttribute("success", true);
            model.addAttribute("message", "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.");
        } catch (RuntimeException ex) {
            bindingResult.rejectValue("email", "email.notfound", ex.getMessage());
        }
        return "forgot-password";
    }

    @PostMapping("/reset-password")
    public String handleResetPassword(@RequestParam("token") String token,
            @Valid @ModelAttribute("resetPasswordRequest") ResetPasswordRequest request,
            BindingResult bindingResult,
            Model model) {
        model.addAttribute("token", token);
        if (bindingResult.hasErrors()) {
            return "reset-password";
        }
        try {
            authService.resetPassword(token, request);
            model.addAttribute("noti", "Đổi mật khẩu thành công");
            model.addAttribute("loginRequest", new LogInRequest());
        } catch (FieldValidationException ex) {
            bindingResult.rejectValue("confirmPassword", "error.confirmPassword", "Mật khẩu không khớp");
        }
        return "reset-password";
    }

    @PostMapping("/change-password")
    @ResponseBody
    public Map<String, Object> changePassword(
            @ModelAttribute("changePasswordRequest") @Valid ChangePasswordRequest request,
            BindingResult bindingResult,
            @AuthenticationPrincipal CustomUserDetails user) {
        Map<String, Object> result = new HashMap<>();
        if (!bindingResult.hasErrors()) {
            try {
                authService.changePassword(user.getId(), request);
                result.put("success", true);
                return result;
            } catch (FieldValidationException e) {
                result.put("success", false);
                result.put("error", e.getMessage());
            } catch (Exception e) {
                result.put("success", false);
                result.put("error", "Lỗi hệ thống.");
            }
        } else {
            result.put("success", false);
            result.put("error", "Dữ liệu không hợp lệ.");
        }
        return result;
    }

    @PostMapping("/add-password")
    @ResponseBody
    public Map<String, Object> addPassword(
            @ModelAttribute("addPasswordRequest") @Valid AddPasswordRequest request,
            BindingResult bindingResult,
            @AuthenticationPrincipal CustomUserDetails user) {
        Map<String, Object> result = new HashMap<>();
        if (!bindingResult.hasErrors()) {
            try {
                authService.addPassword(user.getId(), request);
                result.put("success", true);
                return result;
            } catch (FieldValidationException e) {
                result.put("success", false);
                result.put("error", e.getMessage());
            } catch (Exception e) {
                result.put("success", false);
                result.put("error", "Lỗi hệ thống.");
            }
        } else {
            result.put("success", false);
            result.put("error", "Dữ liệu không hợp lệ.");
        }
        return result;
    }

    @PostMapping("/update-profile")
    @ResponseBody
    public Map<String, Object> updateProfile(
            @ModelAttribute UpdateProfileRequest request,
            @AuthenticationPrincipal CustomUserDetails user) {
        Map<String, Object> result = new HashMap<>();
        try {
            authService.updateProfile(user.getId(), request);
            result.put("success", true);
            result.put("message", "Cập nhật thông tin thành công");
            return result;
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", "Lỗi hệ thống: " + e.getMessage());
        }
        return result;
    }

}
