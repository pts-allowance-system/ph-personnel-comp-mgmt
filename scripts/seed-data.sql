-- =================================================================
-- Clean up existing data to prevent duplicate entry errors
-- =================================================================
-- Disable foreign key checks to allow for table truncation in any order
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE allowance_requests;
TRUNCATE TABLE request_documents;
TRUNCATE TABLE request_comments;
TRUNCATE TABLE system_rules;
TRUNCATE TABLE allowance_rates;
TRUNCATE TABLE users;
TRUNCATE TABLE audit_logs;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;


-- =================================================================
-- Users (บุคลากร)
-- Password for all users is 'password123'
-- =================================================================
INSERT INTO users (id, national_id, firstName, lastName, email, password_hash, role, department, position, certifications, specialTasks, hasSpecialOrder, isActive, created_at)
VALUES
-- 1. Nurse, Tier 1 (OPD)
('1', '1102003344551', 'สมชาย', 'ใจดี', 'somchai.jd@example.com', '$2a$10$HWJXsBb3xHLZZAmU6AwLC.pn.AYFvx9HjwAk.3uf/Sj8egukOc/ZS', 'employee', 'แผนกผู้ป่วยนอก', 'พยาบาลวิชาชีพ', NULL, NULL, FALSE, TRUE, NOW()),
-- 2. Nurse, Tier 3 (ICU) + Supervisor
('2', '1102003344552', 'สมหญิง', 'เก่งมาก', 'somyhing.km@example.com', '$2a$10$HWJXsBb3xHLZZAmU6AwLC.pn.AYFvx9HjwAk.3uf/Sj8egukOc/ZS', 'supervisor', 'แผนกผู้ป่วยหนัก', 'พยาบาลวิชาชีพ', '["APN"]', NULL, FALSE, TRUE, NOW()),
-- 3. HR
('3', '1102003344553', 'บดินทร์', 'มีคุณ', 'bodin.mk@example.com', '$2a$10$HWJXsBb3xHLZZAmU6AwLC.pn.AYFvx9HjwAk.3uf/Sj8egukOc/ZS', 'hr', 'ฝ่ายทรัพยากรบุคคล', 'ผู้จัดการฝ่ายบุคคล', NULL, NULL, FALSE, TRUE, NOW()),
-- 4. Doctor, Tier 2 (Has certificate)
('4', '1102003344554', 'นพ. อาทิตย์', 'เชี่ยวชาญ', 'arthit.c@example.com', '$2a$10$HWJXsBb3xHLZZAmU6AwLC.pn.AYFvx9HjwAk.3uf/Sj8egukOc/ZS', 'employee', 'แผนกอายุรกรรม', 'นายแพทย์', '["วุฒิบัตรสาขาอายุรศาสตร์"]', NULL, FALSE, TRUE, NOW()),
-- 5. Admin
('5', '1102003344555', 'แอดมิน', 'ระบบ', 'admin@example.com', '$2a$10$HWJXsBb3xHLZZAmU6AwLC.pn.AYFvx9HjwAk.3uf/Sj8egukOc/ZS', 'admin', 'ฝ่ายเทคโนโลยีสารสนเทศ', 'ผู้ดูแลระบบ', NULL, NULL, FALSE, TRUE, NOW()),
-- 6. Pharmacist, Tier 2 (Chemo prep)
('6', '1102003344556', 'ภญ. จันทรา', 'ปรุงยา', 'chantra.p@example.com', '$2a$10$HWJXsBb3xHLZZAmU6AwLC.pn.AYFvx9HjwAk.3uf/Sj8egukOc/ZS', 'employee', 'กลุ่มงานเภสัชกรรม', 'เภสัชกร', NULL, '["การเตรียมยาหรือวิเคราะห์ยาเคมีบำบัด"]', FALSE, TRUE, NOW()),
-- 7. Dentist, Tier 1 (Base rate)
('7', '1102003344557', 'ทพญ. วิมล', 'ยิ้มสวย', 'vimol.ys@example.com', '$2a$10$HWJXsBb3xHLZZAmU6AwLC.pn.AYFvx9HjwAk.3uf/Sj8egukOc/ZS', 'employee', 'กลุ่มงานทันตกรรม', 'ทันตแพทย์', NULL, NULL, FALSE, TRUE, NOW()),
-- 8. Allied Health, Tier 1
('8', '1102003344558', 'เทคนิค', 'แล็บดี', 'technic.ld@example.com', '$2a$10$HWJXsBb3xHLZZAmU6AwLC.pn.AYFvx9HjwAk.3uf/Sj8egukOc/ZS', 'employee', 'กลุ่มงานเทคนิคการแพทย์', 'นักเทคนิคการแพทย์', NULL, NULL, FALSE, TRUE, NOW());

-- =================================================================
-- Allowance Rates (อัตราค่าตอบแทน พ.ต.ส.)
-- =================================================================
INSERT INTO allowance_rates (id, group_name, tier, base_rate, effective_date, created_at)
VALUES
-- แพทย์
('rate-doc-1', 'แพทย์', '1', 5000.00, '2024-01-01', NOW()),
('rate-doc-2', 'แพทย์', '2', 10000.00, '2024-01-01', NOW()),
('rate-doc-3', 'แพทย์', '3', 15000.00, '2024-01-01', NOW()),
-- ทันตแพทย์
('rate-den-1', 'ทันตแพทย์', '1', 5000.00, '2024-01-01', NOW()),
('rate-den-2', 'ทันตแพทย์', '2', 10000.00, '2024-01-01', NOW()),
('rate-den-3', 'ทันตแพทย์', '3', 15000.00, '2024-01-01', NOW()),
-- เภสัชกร
('rate-pha-1', 'เภสัชกร', '1', 3000.00, '2024-01-01', NOW()),
('rate-pha-2', 'เภสัชกร', '2', 5000.00, '2024-01-01', NOW()),
-- พยาบาลวิชาชีพ
('rate-nur-1', 'พยาบาลวิชาชีพ', '1', 1500.00, '2024-01-01', NOW()),
('rate-nur-2', 'พยาบาลวิชาชีพ', '2', 2500.00, '2024-01-01', NOW()),
('rate-nur-3', 'พยาบาลวิชาชีพ', '3', 3000.00, '2024-01-01', NOW()),
-- สหวิชาชีพ
('rate-all-1', 'สหวิชาชีพ', '1', 1500.00, '2024-01-01', NOW());

-- =================================================================
-- System Rules (กฎและระเบียบของระบบ)
-- =================================================================
INSERT INTO system_rules (id, name, description, conditions, created_at)
VALUES
('rule1', 'วงเงินค่าตอบแทนสูงสุดต่อเดือน', 'กำหนดเพดานเงิน พ.ต.ส. สูงสุดต่อเดือน', 
'{"max_amount": 50000, "period": "monthly"}', NOW()),
('rule2', 'ระยะเวลาปฏิบัติงานขั้นต่ำ', 'กำหนดระยะเวลาการทำงานขั้นต่ำเพื่อรับสิทธิ์', 
'{"min_months": 6, "type": "service_period"}', NOW()),
('rule3', 'ข้อกำหนดเอกสารแนบ', 'เอกสารที่ต้องใช้ในการเบิกแต่ละประเภท', 
'{"required_docs": ["ใบอนุญาตประกอบวิชาชีพ", "บัตรประชาชน"], "optional_docs": ["ใบรับรองการฝึกอบรม"]}', NOW()),
('rule4', 'ลำดับขั้นการอนุมัติ', 'กำหนดขั้นตอนและสายการอนุมัติคำขอ', 
'{"steps": ["supervisor", "hr", "finance"], "required": true}', NOW());

-- =================================================================
-- Sample Allowance Requests (ตัวอย่างคำขอเบิก พ.ต.ส.)
-- =================================================================
INSERT INTO allowance_requests (id, employee_id, status, employee_type, request_type, position, department, main_duties, standard_duties, assigned_task, monthly_rate, total_amount, effective_date, start_date, end_date, total_days, allowance_group, tier, notes, created_at, updated_at)
VALUES 
('req001', '2', 'pending_supervisor', 'ข้าราชการพลเรือน', 'ปฏิบัติงานในพื้นที่พิเศษ', 'พยาบาลวิชาชีพ', 'แผนกผู้ป่วยหนัก', 'ดูแลผู้ป่วยในหอผู้ป่วยหนัก (ICU)', '{"operations": true, "coordination": true, "service": true, "planning": false}', 'เวรบ่าย-ดึก ICU', 3000.00, 3000.00, '2024-07-01', '2024-07-01', '2024-07-31', 31, 'พยาบาลวิชาชีพ', '3', 'คำขอเบิกสำหรับเวร ICU เดือนกรกฎาคม', NOW(), NOW()),
('req002', '4', 'approved', 'ข้าราชการพลเรือน', 'ภาระงานเฉพาะทาง', 'นายแพทย์', 'แผนกอายุรกรรม', 'ปฏิบัติงานคลินิกเฉพาะทางโรคหัวใจ', '{"operations": true, "service": true, "planning": true, "coordination": false}', 'คลินิกเฉพาะทาง', 10000.00, 4838.71, '2024-06-01', '2024-06-15', '2024-06-30', 15, 'แพทย์', '2', 'เบิกค่าตอบแทนสำหรับคลินิกเฉพาะทาง', NOW(), NOW());

