package com.capstone_project.capstone_project.service;

import com.capstone_project.capstone_project.model.User;
import com.capstone_project.capstone_project.repository.UserRepository;
import com.capstone_project.capstone_project.security.CustomUserDetails;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomUserDetailsService implements UserDetailsService {

    UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail)
            throws UsernameNotFoundException, DisabledException {

        User user = userRepository.findByUsernameOrEmailWithRole(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user: " + usernameOrEmail));

        if (user.isDeleted()) {
            throw new UsernameNotFoundException("Tài khoản không tồn tại.");
        }

        if (!user.isActivated()) {
            throw new DisabledException("Tài khoản của bạn đã bị vô hiệu hóa.");
        }

        return new CustomUserDetails(user);
    }
}
