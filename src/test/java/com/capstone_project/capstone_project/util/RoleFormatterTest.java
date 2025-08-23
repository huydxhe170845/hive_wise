package com.capstone_project.capstone_project.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class RoleFormatterTest {

    @Test
    void testFormatRoleName_VaultOwner() {
        String result = RoleFormatter.formatRoleName("VAULT_OWNER");
        assertEquals("Vault Owner", result);
    }

    @Test
    void testFormatRoleName_Expert() {
        String result = RoleFormatter.formatRoleName("EXPERT");
        assertEquals("Expert", result);
    }

    @Test
    void testFormatRoleName_Builder() {
        String result = RoleFormatter.formatRoleName("BUILDER");
        assertEquals("Builder", result);
    }

    @Test
    void testFormatRoleName_Explorer() {
        String result = RoleFormatter.formatRoleName("EXPLORER");
        assertEquals("Explorer", result);
    }

    @Test
    void testFormatRoleName_CaseInsensitive() {
        String result = RoleFormatter.formatRoleName("vault_owner");
        assertEquals("Vault Owner", result);
    }

    @Test
    void testFormatRoleName_GenericSnakeCase() {
        String result = RoleFormatter.formatRoleName("SOME_ROLE_NAME");
        assertEquals("Some Role Name", result);
    }

    @Test
    void testFormatRoleName_Null() {
        String result = RoleFormatter.formatRoleName(null);
        assertEquals("", result);
    }

    @Test
    void testFormatRoleName_Empty() {
        String result = RoleFormatter.formatRoleName("");
        assertEquals("", result);
    }

    @Test
    void testFormatRoleName_Whitespace() {
        String result = RoleFormatter.formatRoleName("   ");
        assertEquals("", result);
    }
}
