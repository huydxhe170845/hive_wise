package com.capstone_project.capstone_project.util;

import org.springframework.stereotype.Component;

@Component
public class RoleFormatter {
    
    /**
     * Convert role name from database format to display format
     * Examples:
     * - VAULT_OWNER -> Vault Owner
     * - EXPERT -> Expert
     * - BUILDER -> Builder
     * - EXPLORER -> Explorer
     */
    public static String formatRoleName(String roleName) {
        if (roleName == null || roleName.trim().isEmpty()) {
            return "";
        }
        
        // Handle special cases
        switch (roleName.toUpperCase()) {
            case "VAULT_OWNER":
                return "Vault Owner";
            case "EXPERT":
                return "Expert";
            case "BUILDER":
                return "Builder";
            case "EXPLORER":
                return "Explorer";
            default:
                // Generic conversion: convert SNAKE_CASE to Title Case
                return convertSnakeCaseToTitleCase(roleName);
        }
    }
    
    /**
     * Convert SNAKE_CASE to Title Case
     * Example: "SOME_ROLE_NAME" -> "Some Role Name"
     */
    private static String convertSnakeCaseToTitleCase(String snakeCase) {
        if (snakeCase == null || snakeCase.trim().isEmpty()) {
            return "";
        }
        
        String[] words = snakeCase.toLowerCase().split("_");
        StringBuilder result = new StringBuilder();
        
        for (int i = 0; i < words.length; i++) {
            if (i > 0) {
                result.append(" ");
            }
            if (words[i].length() > 0) {
                result.append(Character.toUpperCase(words[i].charAt(0)));
                if (words[i].length() > 1) {
                    result.append(words[i].substring(1));
                }
            }
        }
        
        return result.toString();
    }
}
