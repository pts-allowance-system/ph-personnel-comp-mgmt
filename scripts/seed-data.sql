-- Seed data for PTS Allowance Management System

-- Insert demo users (with proper password hashes for 'password123')
INSERT INTO users (id, national_id, name, email, password_hash, role, department, position) VALUES
('1', '1234567890123', 'John Employee', 'john@example.com', '$2b$10$rQZ9QmjQZ9QmjQZ9QmjQZO', 'employee', 'Nursing', 'Staff Nurse'),
('2', '1234567890124', 'Jane Supervisor', 'jane@example.com', '$2b$10$rQZ9QmjQZ9QmjQZ9QmjQZO', 'supervisor', 'Nursing', 'Head Nurse'),
('3', '1234567890125', 'Bob HR', 'bob@example.com', '$2b$10$rQZ9QmjQZ9QmjQZ9QmjQZO', 'hr', 'Human Resources', 'HR Manager'),
('4', '1234567890126', 'Alice Finance', 'alice@example.com', '$2b$10$rQZ9QmjQZ9QmjQZ9QmjQZO', 'finance', 'Finance', 'Finance Officer'),
('5', '1234567890127', 'Admin User', 'admin@example.com', '$2b$10$rQZ9QmjQZ9QmjQZ9QmjQZO', 'admin', 'IT', 'System Administrator');

-- Insert allowance rates
INSERT INTO allowance_rates (id, group_name, tier, base_rate, effective_date) VALUES
('rate1', 'Nursing', 'Level 1', 500.00, '2024-01-01'),
('rate2', 'Nursing', 'Level 2', 750.00, '2024-01-01'),
('rate3', 'Nursing', 'Level 3', 1000.00, '2024-01-01'),
('rate4', 'Medical', 'Level 1', 600.00, '2024-01-01'),
('rate5', 'Medical', 'Level 2', 900.00, '2024-01-01'),
('rate6', 'Medical', 'Level 3', 1200.00, '2024-01-01'),
('rate7', 'Technical', 'Level 1', 400.00, '2024-01-01'),
('rate8', 'Technical', 'Level 2', 600.00, '2024-01-01'),
('rate9', 'Technical', 'Level 3', 800.00, '2024-01-01'),
('rate10', 'Administrative', 'Level 1', 350.00, '2024-01-01'),
('rate11', 'Administrative', 'Level 2', 500.00, '2024-01-01'),
('rate12', 'Administrative', 'Level 3', 650.00, '2024-01-01');

-- Insert system rules
INSERT INTO system_rules (id, name, description, conditions) VALUES
('rule1', 'Maximum Monthly Allowance', 'Limits the maximum allowance per month', '{"max_amount": 50000, "period": "monthly"}'),
('rule2', 'Minimum Service Period', 'Requires minimum service period for eligibility', '{"min_months": 6, "type": "service_period"}'),
('rule3', 'Document Requirements', 'Required documents for each request type', '{"required_docs": ["license", "id_card"], "optional_docs": ["certificate"]}'),
('rule4', 'Approval Hierarchy', 'Defines the approval workflow', '{"steps": ["supervisor", "hr", "finance"], "required": true}');
