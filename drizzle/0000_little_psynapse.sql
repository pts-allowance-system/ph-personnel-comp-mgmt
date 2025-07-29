CREATE TABLE `allowance_rates` (
	`id` char(36) NOT NULL,
	`group_name` varchar(100) NOT NULL,
	`tier` varchar(100) NOT NULL,
	`base_rate` decimal(10,2) NOT NULL,
	`effective_date` date NOT NULL,
	`isActive` boolean DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT '2025-07-29 11:15:56.918',
	`updated_at` datetime NOT NULL,
	CONSTRAINT `allowance_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `allowance_requests` (
	`id` char(36) NOT NULL,
	`employee_id` char(36) NOT NULL,
	`status` varchar(50) DEFAULT 'draft',
	`created_at` datetime DEFAULT '2025-07-29 11:15:56.919',
	`updated_at` datetime,
	`employee_type` varchar(100),
	`request_type` varchar(100),
	`position` varchar(255),
	`department` varchar(255),
	`main_duties` text,
	`standard_duties` json,
	`assigned_task` text,
	`monthly_rate` decimal(10,2),
	`total_amount` decimal(12,2),
	`effective_date` date,
	`start_date` date,
	`end_date` date,
	`total_days` int,
	`allowance_group` varchar(100),
	`tier` varchar(100),
	`notes` text,
	`hr_override` boolean DEFAULT false,
	`rule_check_results` text,
	`disbursement_date` date,
	`reference_number` varchar(100),
	`approved_at` datetime,
	`approved_by` char(36),
	CONSTRAINT `allowance_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `allowance_rules` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`priority` int NOT NULL DEFAULT 0,
	`conditions` json NOT NULL,
	`outcome` json NOT NULL,
	`isActive` boolean DEFAULT true,
	`created_at` datetime DEFAULT '2025-07-29 11:15:56.919',
	`updated_at` datetime,
	CONSTRAINT `allowance_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` char(36) NOT NULL,
	`user_id` char(36),
	`action` varchar(100) NOT NULL,
	`target_type` varchar(50) NOT NULL,
	`target_id` char(36),
	`metadata` text,
	`ip_address` varchar(45),
	`user_agent` text,
	`created_at` datetime DEFAULT '2025-07-29 11:15:56.921',
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `request_comments` (
	`id` char(36) NOT NULL,
	`request_id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`message` text NOT NULL,
	`created_at` datetime DEFAULT '2025-07-29 11:15:56.920',
	CONSTRAINT `request_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `request_documents` (
	`id` char(36) NOT NULL,
	`request_id` char(36) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_url` varchar(500) NOT NULL,
	`file_path` varchar(500) NOT NULL,
	`file_size` bigint NOT NULL,
	`file_type` varchar(100) NOT NULL,
	`document_type` varchar(50) DEFAULT 'supporting',
	`uploaded_at` datetime DEFAULT '2025-07-29 11:15:56.920',
	CONSTRAINT `request_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_rules` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`conditions` text NOT NULL,
	`isActive` boolean DEFAULT true,
	`created_at` datetime DEFAULT '2025-07-29 11:15:56.920',
	`updated_at` datetime,
	CONSTRAINT `system_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` char(36) NOT NULL,
	`national_id` varchar(13) NOT NULL,
	`firstName` varchar(128) NOT NULL,
	`lastName` varchar(128) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('employee','supervisor','hr','finance','admin') NOT NULL,
	`department` varchar(255),
	`position` varchar(255),
	`hasSpecialOrder` boolean DEFAULT false,
	`certifications` json,
	`specialTasks` json,
	`isActive` boolean DEFAULT true,
	`created_at` datetime NOT NULL DEFAULT '2025-07-29 11:15:56.916',
	`updated_at` datetime NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_national_id_unique` UNIQUE(`national_id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
