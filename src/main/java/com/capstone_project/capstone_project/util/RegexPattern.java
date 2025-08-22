package com.capstone_project.capstone_project.util;

public class RegexPattern {
    public static final String USERNAME = "^[a-zA-Z0-9._-]{3,20}$";

    public static final String EMAIL = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$";

    public static final String PASSWORD = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$";

    private RegexPattern() {
        // private constructor để không tạo được instance
    }
}
