-- PTS Allowance Management System Database Schema

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    national_id VARCHAR(13) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM(
        'employee',
        'supervisor',
        'hr',
        'finance',
        'admin'
    ) NOT NULL,
    department VARCHAR(255),
    position VARCHAR(255),
    isActive BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Allowance rates table
CREATE TABLE allowance_rates (
    id VARCHAR(36) PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    tier VARCHAR(100) NOT NULL,
    base_rate DECIMAL(10, 2) NOT NULL,
    effective_date DATE NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_group_tier_date (
        group_name,
        tier,
        effective_date
    )
);

-- Allowance requests table
CREATE TABLE allowance_requests (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    tier VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM(
        'draft',
        'submitted',
        'approved',
        'hr-checked',
        'disbursed',
        'rejected'
    ) DEFAULT 'draft',
    base_rate DECIMAL(10, 2) NOT NULL,
    zone_multiplier DECIMAL(4, 2) DEFAULT 1.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    hr_override BOOLEAN DEFAULT FALSE,
    rule_check_results JSON,
    disbursement_date DATE,
    reference_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_employee_id (employee_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Request documents table (metadata only, files stored in Supabase)
CREATE TABLE request_documents (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    document_type VARCHAR(50) DEFAULT 'supporting',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES allowance_requests (id) ON DELETE CASCADE,
    INDEX idx_request_id (request_id)
);

-- Request comments table
CREATE TABLE request_comments (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES allowance_requests (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_request_id (request_id),
    INDEX idx_created_at (created_at)
);

-- System rules table
CREATE TABLE system_rules (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    conditions JSON NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(36),
    metadata JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at)
);