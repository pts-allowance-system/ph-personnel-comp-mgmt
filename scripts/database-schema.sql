-- Users table
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    national_id VARCHAR(13) UNIQUE NOT NULL,
    firstName VARCHAR(128) NOT NULL,
    lastName VARCHAR(128) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('employee', 'supervisor', 'hr', 'finance', 'admin') NOT NULL,
    department VARCHAR(255),
    position VARCHAR(255),
    hasSpecialOrder BOOLEAN DEFAULT FALSE,
    certifications JSON,
    specialTasks JSON,
    isActive BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Allowance rates table
CREATE TABLE allowance_rates (
    id CHAR(36) PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    tier VARCHAR(100) NOT NULL,
    base_rate DECIMAL(10,2) NOT NULL,
    effective_date DATE NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_group_tier_date (group_name, tier, effective_date)
);

-- Allowance rules table
CREATE TABLE allowance_rules (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    priority INT NOT NULL DEFAULT 0,
    conditions JSON NOT NULL,
    outcome JSON NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Allowance requests table
CREATE TABLE allowance_requests (
    id CHAR(36) PRIMARY KEY,
    employee_id CHAR(36) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft', -- Using VARCHAR to accommodate more descriptive statuses
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- New form fields
    employee_type VARCHAR(100),
    request_type VARCHAR(100),
    position VARCHAR(255),
    department VARCHAR(255),
    main_duties TEXT,
    standard_duties JSON, -- Storing as JSON
    assigned_task TEXT,
    monthly_rate DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    effective_date DATE,
    start_date DATE, -- Made nullable
    end_date DATE, -- Made nullable
    total_days INT,
    allowance_group VARCHAR(100),
    tier VARCHAR(100),
    notes TEXT,

    -- Fields for processing and auditing
    hr_override BOOLEAN DEFAULT FALSE,
    rule_check_results LONGTEXT,
    disbursement_date DATE,
    reference_number VARCHAR(100),

    -- Approval tracking
    approved_at DATETIME,
    approved_by CHAR(36),

    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_employee_id (employee_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Request documents table
CREATE TABLE request_documents (
    id CHAR(36) PRIMARY KEY,
    request_id CHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    document_type VARCHAR(50) DEFAULT 'supporting',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES allowance_requests(id) ON DELETE CASCADE,
    INDEX idx_request_id (request_id)
);

-- Request comments table
CREATE TABLE request_comments (
    id CHAR(36) PRIMARY KEY,
    request_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES allowance_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_request_id (request_id),
    INDEX idx_created_at (created_at)
);

-- System rules table
CREATE TABLE system_rules (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    conditions LONGTEXT NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id CHAR(36),
    metadata LONGTEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at)
);
