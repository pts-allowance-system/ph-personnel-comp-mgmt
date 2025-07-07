-- This script adds a composite index to the allowance_rates table to optimize queries
-- that filter by isActive, group_name, and tier. This is a common query pattern
-- in the RatesDAL, and this index will significantly improve its performance.

ALTER TABLE `allowance_rates` ADD INDEX `idx_active_group_tier` (`isActive`, `group_name`, `tier`);
