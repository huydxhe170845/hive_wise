package com.capstone_project.capstone_project.controller;

import com.capstone_project.capstone_project.dto.request.*;
import com.capstone_project.capstone_project.dto.response.*;
import com.capstone_project.capstone_project.exception.FieldValidationException;
import com.capstone_project.capstone_project.security.CustomUserDetails;
import com.capstone_project.capstone_project.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.BindingResult;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private BindingResult bindingResult;

    @InjectMocks
    private AuthenticationController authenticationController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authenticationController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void changePassword_ValidRequest_ReturnsSuccessResponse() throws Exception {
        // Arrange
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldpassword")
                .newPassword("newpassword123")
                .confirmNewPassword("newpassword123")
                .build();

        CustomUserDetails user = mock(CustomUserDetails.class);
        when(user.getId()).thenReturn("user123");

        when(bindingResult.hasErrors()).thenReturn(false);
        doNothing().when(authService).changePassword(anyString(), any(ChangePasswordRequest.class));

        // Act & Assert
        mockMvc.perform(post("/auth/change-password")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("currentPassword", "oldpassword")
                .param("newPassword", "newpassword123")
                .param("confirmNewPassword", "newpassword123")
                .sessionAttr("changePasswordRequest", request)
                .sessionAttr("org.springframework.validation.BindingResult.changePasswordRequest", bindingResult)
                .requestAttr("user", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(authService).changePassword("user123", request);
    }

    @Test
    void changePassword_InvalidRequest_ReturnsErrorResponse() throws Exception {
        // Arrange
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("oldpassword")
                .newPassword("newpassword123")
                .confirmNewPassword("differentpassword")
                .build();

        CustomUserDetails user = mock(CustomUserDetails.class);
        when(user.getId()).thenReturn("user123");

        when(bindingResult.hasErrors()).thenReturn(true);
        doThrow(new FieldValidationException("confirmNewPassword", "Mật khẩu không khớp"))
                .when(authService).changePassword(anyString(), any(ChangePasswordRequest.class));

        // Act & Assert
        mockMvc.perform(post("/auth/change-password")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("currentPassword", "oldpassword")
                .param("newPassword", "newpassword123")
                .param("confirmNewPassword", "differentpassword")
                .sessionAttr("changePasswordRequest", request)
                .sessionAttr("org.springframework.validation.BindingResult.changePasswordRequest", bindingResult)
                .requestAttr("user", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Mật khẩu không khớp"));
    }

    @Test
    void addPassword_ValidRequest_ReturnsSuccessResponse() throws Exception {
        // Arrange
        AddPasswordRequest request = AddPasswordRequest.builder()
                .newPassword("newpassword123")
                .confirmNewPassword("newpassword123")
                .build();

        CustomUserDetails user = mock(CustomUserDetails.class);
        when(user.getId()).thenReturn("user123");

        when(bindingResult.hasErrors()).thenReturn(false);
        doNothing().when(authService).addPassword(anyString(), any(AddPasswordRequest.class));

        // Act & Assert
        mockMvc.perform(post("/auth/add-password")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("newPassword", "newpassword123")
                .param("confirmNewPassword", "newpassword123")
                .sessionAttr("addPasswordRequest", request)
                .sessionAttr("org.springframework.validation.BindingResult.addPasswordRequest", bindingResult)
                .requestAttr("user", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(authService).addPassword("user123", request);
    }

    @Test
    void addPassword_InvalidRequest_ReturnsErrorResponse() throws Exception {
        // Arrange
        AddPasswordRequest request = AddPasswordRequest.builder()
                .newPassword("newpassword123")
                .confirmNewPassword("differentpassword")
                .build();

        CustomUserDetails user = mock(CustomUserDetails.class);
        when(user.getId()).thenReturn("user123");

        when(bindingResult.hasErrors()).thenReturn(true);

        // Act & Assert
        mockMvc.perform(post("/auth/add-password")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("newPassword", "newpassword123")
                .param("confirmNewPassword", "differentpassword")
                .sessionAttr("addPasswordRequest", request)
                .sessionAttr("org.springframework.validation.BindingResult.addPasswordRequest", bindingResult)
                .requestAttr("user", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Dữ liệu không hợp lệ."));
    }

    @Test
    void updateProfile_ValidRequest_ReturnsSuccessResponse() throws Exception {
        // Arrange
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setName("John Doe");
        request.setGender("Male");
        request.setPhoneNumber("1234567890");

        CustomUserDetails user = mock(CustomUserDetails.class);
        when(user.getId()).thenReturn("user123");

        doNothing().when(authService).updateProfile(anyString(), any(UpdateProfileRequest.class));

        // Act & Assert
        mockMvc.perform(post("/auth/update-profile")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("name", "John Doe")
                .param("gender", "Male")
                .param("phoneNumber", "1234567890")
                .sessionAttr("updateProfileRequest", request)
                .requestAttr("user", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Cập nhật thông tin thành công"));

        verify(authService).updateProfile("user123", request);
    }

    @Test
    void updateProfile_Exception_ReturnsErrorResponse() throws Exception {
        // Arrange
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setName("John Doe");
        request.setPhoneNumber("invalid-phone");

        CustomUserDetails user = mock(CustomUserDetails.class);
        when(user.getId()).thenReturn("user123");

        doThrow(new RuntimeException("Invalid phone format"))
                .when(authService).updateProfile(anyString(), any(UpdateProfileRequest.class));

        // Act & Assert
        mockMvc.perform(post("/auth/update-profile")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("name", "John Doe")
                .param("phoneNumber", "invalid-phone")
                .sessionAttr("updateProfileRequest", request)
                .requestAttr("user", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Lỗi hệ thống: Invalid phone format"));
    }

    @Test
    void verifyAccount_ValidToken_RedirectsToLogin() throws Exception {
        // Arrange
        String token = "valid-verification-token";
        doNothing().when(authService).verifyAccount(token);

        // Act & Assert
        mockMvc.perform(get("/auth/verify")
                .param("token", token))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/auth/log-in"));

        verify(authService).verifyAccount(token);
    }

    @Test
    void verifyAccount_InvalidToken_RedirectsToActiveAccount() throws Exception {
        // Arrange
        String token = "invalid-verification-token";
        doThrow(new RuntimeException("Invalid token"))
                .when(authService).verifyAccount(token);

        // Act & Assert
        mockMvc.perform(get("/auth/verify")
                .param("token", token))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/auth/active-account"));

        verify(authService).verifyAccount(token);
    }

    @Test
    void resetPassword_ValidToken_ShowsResetPage() throws Exception {
        // Arrange
        String token = "valid-reset-token";
        when(authService.isTokenValid(token)).thenReturn(true);

        // Act & Assert
        mockMvc.perform(get("/auth/reset-password")
                .param("token", token))
                .andExpect(status().isOk())
                .andExpect(view().name("reset-password"))
                .andExpect(model().attribute("token", token));

        verify(authService).isTokenValid(token);
    }

    @Test
    void resetPassword_InvalidToken_RedirectsToForgotPassword() throws Exception {
        // Arrange
        String token = "invalid-reset-token";
        when(authService.isTokenValid(token)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(get("/auth/reset-password")
                .param("token", token))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/auth/forgot-password"));

        verify(authService).isTokenValid(token);
    }
}
