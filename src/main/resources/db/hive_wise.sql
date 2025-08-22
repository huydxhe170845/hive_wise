CREATE DATABASE hive_wise;

USE hive_wise;

-- RUN COMMAND IN ORDER
-- --------------------------------------------------------------------------------create table section--------------------------------------------------------------------------------

CREATE TABLE system_roles (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    description TEXT NULL
);

CREATE TABLE vault_roles (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    description TEXT NULL
);

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    system_role_id INT NOT NULL DEFAULT 2,
    name VARCHAR(255),
    username VARCHAR(255) NULL,
    password VARCHAR(255) NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(50),
    department VARCHAR(255),
    date_of_birth DATE NULL,
    avatar VARCHAR(255),
    auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    deactivated_at DATETIME NULL,
    deleted_at DATETIME NULL,
    is_activated TINYINT NOT NULL DEFAULT 1,
    is_deleted TINYINT NOT NULL DEFAULT 0,
    google_id VARCHAR(255) NULL,
    google_first_name VARCHAR(255) NULL,
    google_given_name VARCHAR(255) NULL,
    google_family_name VARCHAR(255) NULL,
    is_verified_email_google TINYINT NULL DEFAULT 1,
    gender VARCHAR(45),
    position VARCHAR(255),
    FOREIGN KEY (system_role_id) REFERENCES system_roles (id)
);

CREATE TABLE verification_token (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    purpose VARCHAR(20) NOT NULL,
    expiry_date DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE vaults (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT NULL,
    photo_url VARCHAR(500) NULL,
    created_by_user_id VARCHAR(255) NULL,
    created_by_email VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    deactivated_at DATETIME NULL,
    is_activated TINYINT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE user_vault_role (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id VARCHAR(36) NOT NULL,
    vault_id VARCHAR(36) NOT NULL,
    vault_role_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (vault_id) REFERENCES vaults (id) ON DELETE CASCADE,
    FOREIGN KEY (vault_role_id) REFERENCES vault_roles (id) ON DELETE CASCADE
);

CREATE TABLE folder (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id BIGINT DEFAULT NULL,
    vault_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) DEFAULT NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_folder_parent FOREIGN KEY (parent_id) REFERENCES folder (id) ON DELETE CASCADE,
    CONSTRAINT fk_folder_vault FOREIGN KEY (vault_id) REFERENCES vaults (id) ON DELETE CASCADE,
    CONSTRAINT fk_folder_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE knowledge_item (
    id VARCHAR(50) PRIMARY KEY,
    vault_id VARCHAR(36) NOT NULL,
    folder_id BIGINT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content LONGTEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    type VARCHAR(50) DEFAULT 'ARTICLE',
    visibility VARCHAR(20) DEFAULT 'PRIVATE',
    approval_status VARCHAR(50) DEFAULT 'DRAFT',
    approved_by VARCHAR(36) NULL,
    approved_at DATETIME NULL,
    rejected_by VARCHAR(36) NULL,
    rejected_at DATETIME NULL,
    rejection_reason TEXT NULL,
    reviewing_by VARCHAR(36) NULL,
    reviewing_started_at DATETIME NULL,
    review_lock_expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NOT NULL,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    deleted_by VARCHAR(36) NULL,
    deleted_at DATETIME NULL,
    FOREIGN KEY (vault_id) REFERENCES vaults (id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES folder (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users (id),
    FOREIGN KEY (updated_by) REFERENCES users (id),
    FOREIGN KEY (deleted_by) REFERENCES users (id),
    FOREIGN KEY (approved_by) REFERENCES users (id),
    FOREIGN KEY (rejected_by) REFERENCES users (id)
);

CREATE TABLE knowledge_item_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    knowledge_item_id VARCHAR(50) NOT NULL,
    tag_id INT NOT NULL,
    FOREIGN KEY (knowledge_item_id) REFERENCES knowledge_item (id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
);

CREATE TABLE knowledge_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_link VARCHAR(500),
    vault_id VARCHAR(36) NOT NULL,
    instructor_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
    location VARCHAR(255) NULL,
    start_time DATETIME NOT NULL,
    duration INT NOT NULL,
    end_time DATETIME NOT NULL,
    created_by VARCHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vault_id) REFERENCES vaults (id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE knowledge_session_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    knowledge_session_id BIGINT NOT NULL,
    tag_id INT NOT NULL,
    FOREIGN KEY (knowledge_session_id) REFERENCES knowledge_sessions (id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    knowledge_item_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    parent_comment_id INT NULL,
    content TEXT NOT NULL,
    is_edited TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (knowledge_item_id) REFERENCES knowledge_item (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments (id) ON DELETE CASCADE
);

CREATE TABLE ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    knowledge_item_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    rating_value TINYINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (knowledge_item_id, user_id),
    FOREIGN KEY (knowledge_item_id) REFERENCES knowledge_item (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    knowledge_item_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    upload_by VARCHAR(36),
    upload_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (knowledge_item_id) REFERENCES knowledge_item (id) ON DELETE CASCADE,
    FOREIGN KEY (upload_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE chat_session (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    vault_id VARCHAR(36) NOT NULL,
    knowledge_source VARCHAR(20) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (vault_id) REFERENCES vaults (id) ON DELETE CASCADE
);

CREATE TABLE chat_message (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    sender VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_session (id)
);

CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    vault_id VARCHAR(36) NULL,
    recipient_id VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    related_entity_id VARCHAR(36),
    related_entity_type VARCHAR(50),
    is_read TINYINT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL,
    FOREIGN KEY (vault_id) REFERENCES vaults (id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_recipient_vault (recipient_id, vault_id),
    INDEX idx_recipient_unread (recipient_id, is_read),
    INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS visits (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NULL,
    session_id VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    page_url VARCHAR(1000) NULL,
    visit_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    visit_date DATE AS (DATE(visit_time)) STORED,
    is_login BOOLEAN NOT NULL DEFAULT FALSE,
    INDEX idx_visits_user_id (user_id),
    INDEX idx_visits_visit_time (visit_time),
    INDEX idx_visits_date (visit_date),
    INDEX idx_visits_session (session_id),
    INDEX idx_visits_login (is_login)
);

CREATE TABLE IF NOT EXISTS knowledge_views (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    knowledge_item_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NULL,
    session_id VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    view_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    view_duration_seconds INT NULL,
    INDEX idx_knowledge_views_item_id (knowledge_item_id),
    INDEX idx_knowledge_views_user_id (user_id),
    INDEX idx_knowledge_views_view_time (view_time),
    INDEX idx_knowledge_views_session (session_id),
    FOREIGN KEY (knowledge_item_id) REFERENCES knowledge_item (id) ON DELETE CASCADE
);

CREATE INDEX idx_knowledge_views_date ON knowledge_views ((DATE(view_time)));

CREATE INDEX idx_vaults_is_deleted ON vaults (is_deleted);

CREATE INDEX idx_vaults_created_by_user_id_is_deleted ON vaults (
    created_by_user_id,
    is_deleted
);

-- --------------------------------------------------------------------------------insert data into section--------------------------------------------------------------------------------

INSERT INTO
    system_roles (name, description)
VALUES (
        'ADMIN',
        'Manages the overall system, including user accounts, system configuration, and has full access to all features and permissions across the platform.'
    ),
    (
        'USER',
        'Regular user role with limited access'
    );

INSERT INTO
    vault_roles (name, description)
VALUES (
        'VAULT_OWNER',
        'Owns and manages a knowledge vault, with full control over content creation, approval, member roles, discussions, ratings, and internal exams.'
    ),
    (
        'EXPERT',
        'A domain specialist who can create and approve knowledge without review, manage vault exams, and contribute through comments and ratings.'
    ),
    (
        'BUILDER',
        'Creates and edits knowledge content pending approval, can view and participate in discussions, rate content, and take vault-related exams.'
    ),
    (
        'EXPLORER',
        'Users who can view approved knowledge within vaults, participate in discussions, rate content, and take exams, but cannot create knowledge.'
    );