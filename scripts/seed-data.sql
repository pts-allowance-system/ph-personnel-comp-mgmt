-- Insert demo users (passwords hashed for 'password123')
INSERT INTO users (id, national_id, name, email, password_hash, role, department, position, created_at)
VALUES
('1', '1234567890123', 'John Employee', 'john@example.com', '$2a$10$HWJXsBb3xHLZZAmU6AwLC.pn.AYFvx9HjwAk.3uf/Sj8egukOc/ZS', 'employee', 'Nursing', 'Staff Nurse', NOW()),
('2', '1234567890124', 'Jane Supervisor', 'jane@example.com', '$2a$10$HWJXsBb3xHLZZAmU6AwLC.pn.AYFvx9HjwAk.3uf/Sj8egukOc/ZS', 'supervisor', 'Nursing', 'Head Nurse', NOW()),
('3', '1234567890125', 'Bob HR', 'bob@example.com', '$2a$10$HWJXsBb3xHLZZAmU6AwLC.pn.AYFvx9HjwAk.3uf/Sj8egukOc/ZS', 'hr', 'Human Resources', 'HR Manager', NOW()),
('4', '1234567890126', 'Alice Finance', 'alice@example.com', '$2a$10$HWJXsBb3xHLZZAmU6AwLC.pn.AYFvx9HjwAk.3uf/Sj8egukOc/ZS', 'finance', 'Finance', 'Finance Officer', NOW()),
('5', '1234567890127', 'Admin User', 'admin@example.com', '$2a$10$HWJXsBb3xHLZZAmU6AwLC.pn.AYFvx9HjwAk.3uf/Sj8egukOc/ZS', 'admin', 'IT', 'System Administrator', NOW());

-- Insert allowance rates
INSERT INTO allowance_rates (id, group_name, tier, base_rate, effective_date, created_at)
VALUES
('rate1', 'Nursing', 'Level 1', 500.00, '2024-01-01', NOW()),
('rate2', 'Nursing', 'Level 2', 750.00, '2024-01-01', NOW()),
('rate3', 'Nursing', 'Level 3', 1000.00, '2024-01-01', NOW()),
('rate4', 'Medical', 'Level 1', 600.00, '2024-01-01', NOW()),
('rate5', 'Medical', 'Level 2', 900.00, '2024-01-01', NOW()),
('rate6', 'Medical', 'Level 3', 1200.00, '2024-01-01', NOW()),
('rate7', 'Technical', 'Level 1', 400.00, '2024-01-01', NOW()),
('rate8', 'Technical', 'Level 2', 600.00, '2024-01-01', NOW()),
('rate9', 'Technical', 'Level 3', 800.00, '2024-01-01', NOW()),
('rate10', 'Administrative', 'Level 1', 350.00, '2024-01-01', NOW()),
('rate11', 'Administrative', 'Level 2', 500.00, '2024-01-01', NOW()),
('rate12', 'Administrative', 'Level 3', 650.00, '2024-01-01', NOW());

-- Insert system rules
INSERT INTO system_rules (id, name, description, conditions, created_at)
VALUES
('rule1', 'Maximum Monthly Allowance', 'Limits the maximum allowance per month', 
'{"max_amount": 50000, "period": "monthly"}', NOW()),
('rule2', 'Minimum Service Period', 'Requires minimum service period for eligibility', 
'{"min_months": 6, "type": "service_period"}', NOW()),
('rule3', 'Document Requirements', 'Required documents for each request type', 
'{"required_docs": ["license", "id_card"], "optional_docs": ["certificate"]}', NOW()),
('rule4', 'Approval Hierarchy', 'Defines the approval workflow', 
'{"steps": ["supervisor", "hr", "finance"], "required": true}', NOW());
