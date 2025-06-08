-- PTS Allowance Management System Database Schema

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    national_id VARCHAR(13) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('employee', 'supervisor', 'hr', 'finance', 'admin')),
    department VARCHAR(255),
    position VARCHAR(255),
    isActive BIT DEFAULT 1, -- Using BIT for boolean
    created_at DATETIME DEFAULT GETDATE(), -- Using DATETIME and GETDATE()
    updated_at DATETIME DEFAULT GETDATE() -- Will need a trigger for ON UPDATE functionality
);

-- Trigger for users.updated_at
-- This should be created after the table
/*
CREATE TRIGGER trg_users_updated_at
ON users
AFTER UPDATE
AS
BEGIN
    UPDATE u
    SET updated_at = GETDATE()
    FROM users u
    INNER JOIN inserted i ON u.id = i.id;
END;
*/

-- Allowance rates table
CREATE TABLE allowance_rates (
    id VARCHAR(36) PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    tier VARCHAR(100) NOT NULL,
    base_rate DECIMAL(10, 2) NOT NULL,
    effective_date DATE NOT NULL,
    isActive BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT unique_group_tier_date UNIQUE (group_name, tier, effective_date) -- MSSQL uses CONSTRAINT for unique keys
);

-- Trigger for allowance_rates.updated_at
/*
CREATE TRIGGER trg_allowance_rates_updated_at
ON allowance_rates
AFTER UPDATE
AS
BEGIN
    UPDATE ar
    SET updated_at = GETDATE()
    FROM allowance_rates ar
    INNER JOIN inserted i ON ar.id = i.id;
END;
*/

-- Allowance requests table
CREATE TABLE allowance_requests (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    tier VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'hr-checked', 'disbursed', 'rejected')),
    base_rate DECIMAL(10, 2) NOT NULL,
    zone_multiplier DECIMAL(4, 2) DEFAULT 1.00,
    total_amount DECIMAL(12, 2) NOT NULL,
    notes TEXT, -- Or VARCHAR(MAX) for MSSQL
    hr_override BIT DEFAULT 0,
    rule_check_results NVARCHAR(MAX), -- Storing JSON as NVARCHAR(MAX)
    disbursement_date DATE,
    reference_number VARCHAR(100),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (employee_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_employee_id (employee_id), -- MSSQL typically uses NONCLUSTERED INDEX separately
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Separate index creation for MSSQL
/*
CREATE NONCLUSTERED INDEX idx_employee_id ON allowance_requests (employee_id);
CREATE NONCLUSTERED INDEX idx_status ON allowance_requests (status);
CREATE NONCLUSTERED INDEX idx_created_at ON allowance_requests (created_at);
*/

-- Trigger for allowance_requests.updated_at
/*
CREATE TRIGGER trg_allowance_requests_updated_at
ON allowance_requests
AFTER UPDATE
AS
BEGIN
    UPDATE ar
    SET updated_at = GETDATE()
    FROM allowance_requests ar
    INNER JOIN inserted i ON ar.id = i.id;
END;
*/

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
    uploaded_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (request_id) REFERENCES allowance_requests (id) ON DELETE CASCADE,
    INDEX idx_request_id (request_id)
);

-- Separate index creation for MSSQL
/*
CREATE NONCLUSTERED INDEX idx_request_id ON request_documents (request_id);
*/

-- Request comments table
CREATE TABLE request_comments (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    message TEXT NOT NULL, -- Or VARCHAR(MAX)
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (request_id) REFERENCES allowance_requests (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_request_id (request_id),
    INDEX idx_created_at (created_at)
);

-- Separate index creation for MSSQL
/*
CREATE NONCLUSTERED INDEX idx_request_id ON request_comments (request_id);
CREATE NONCLUSTERED INDEX idx_created_at ON request_comments (created_at);
*/

-- System rules table
CREATE TABLE system_rules (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT, -- Or VARCHAR(MAX)
    conditions NVARCHAR(MAX) NOT NULL, -- Storing JSON as NVARCHAR(MAX)
    isActive BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- Trigger for system_rules.updated_at
/*
CREATE TRIGGER trg_system_rules_updated_at
ON system_rules
AFTER UPDATE
AS
BEGIN
    UPDATE sr
    SET updated_at = GETDATE()
    FROM system_rules sr
    INNER JOIN inserted i ON sr.id = i.id;
END;
*/

-- Audit logs table
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(36),
    metadata NVARCHAR(MAX), -- Storing JSON as NVARCHAR(MAX)
    ip_address VARCHAR(45),
    user_agent TEXT, -- Or VARCHAR(MAX)
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at)
);

-- Separate index creation for MSSQL
/*
CREATE NONCLUSTERED INDEX idx_user_id ON audit_logs (user_id);
CREATE NONCLUSTERED INDEX idx_action ON audit_logs (action);
CREATE NONCLUSTERED INDEX idx_target ON audit_logs (target_type, target_id);
CREATE NONCLUSTERED INDEX idx_created_at ON audit_logs (created_at);
*/