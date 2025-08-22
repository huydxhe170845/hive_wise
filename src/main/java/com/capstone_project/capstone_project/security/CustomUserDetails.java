package com.capstone_project.capstone_project.security;

import com.capstone_project.capstone_project.enums.AuthProvider;
import com.capstone_project.capstone_project.model.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Getter
public class CustomUserDetails implements UserDetails {

    String id;
    String name;
    String username;
    String email;
    String password;
    String avatar;
    String department;
    String gender;
    String phoneNumber;
    LocalDate dateOfBirth;
    boolean enabled;
    AuthProvider authProvider;
    String systemRoleName;

    public CustomUserDetails(User user) {
        this.id = user.getId();
        this.name = user.getName();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.avatar = user.getAvatar();
        this.department = user.getDepartment();
        this.gender = user.getGender();
        this.phoneNumber = user.getPhoneNumber();
        this.dateOfBirth = user.getDateOfBirth();
        this.enabled = user.isActivated();
        this.authProvider = user.getAuthProvider();
        this.systemRoleName = user.getSystemRole() != null ? user.getSystemRole().getName() : null;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (systemRoleName != null) {
            return List.of(new SimpleGrantedAuthority(systemRoleName));
        }
        return Collections.emptyList();
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

}
