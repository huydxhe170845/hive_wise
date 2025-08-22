package com.capstone_project.capstone_project.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;

public class CustomOAuth2User implements OAuth2User {
    private final OAuth2User oauth2User;

    public CustomOAuth2User(OAuth2User oauth2User) {
        this.oauth2User = oauth2User;
    }

    public String getEmail() {
        return oauth2User.getAttribute("email");
    }

    public String getGoogleId() {
        return oauth2User.getAttribute("sub");
    }

    public String getFirstName() {
        return oauth2User.getAttribute("given_name");
    }

    public String getLastName() {
        return oauth2User.getAttribute("family_name");
    }

    public String getPicture() {
        return oauth2User.getAttribute("picture");
    }

    public boolean isEmailVerified() {
        Boolean verified = oauth2User.getAttribute("email_verified");
        return verified != null && verified;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return oauth2User.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return oauth2User.getAuthorities();
    }

    @Override
    public String getName() {
        return oauth2User.getName();
    }
}

