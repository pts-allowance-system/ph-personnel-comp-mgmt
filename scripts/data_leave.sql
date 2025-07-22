/*
 Navicat Premium Data Transfer

 Source Server         : hr-utth-new
 Source Server Type    : MySQL
 Source Server Version : 100427 (10.4.27-MariaDB-log)
 Source Host           : 172.17.1.228:3306
 Source Schema         : leave_db

 Target Server Type    : MySQL
 Target Server Version : 100427 (10.4.27-MariaDB-log)
 File Encoding         : 65001

 Date: 22/01/2025 09:08:54
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for data_leave
-- ----------------------------
DROP TABLE IF EXISTS `data_leave`;
CREATE TABLE `data_leave`  (
  `ID` int NOT NULL AUTO_INCREMENT,
  `LEAVE_ID` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `EMPLOYEE_ID` varchar(13) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `TYPE_LEAVE` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `START_DATE` date NOT NULL,
  `END_DATE` date NOT NULL,
  `TOTAL_DATE` float NOT NULL,
  `DETAIL` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT 'รายละเอียดการลา',
  `country` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `DETAIL_CANCEL` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL,
  `LEAVE_CONTACT` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT 'รายละเอียดติดต่อระหว่างลา',
  `DETAIL_RESULT` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `APPROVE_RESULT` enum('Pending','Approve','Disapprove') CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT 'Pending',
  `ACCEPT_DATE` datetime NULL DEFAULT NULL,
  `START_DATE_DETAIL` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `END_DATE_DETAIL` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `HALF_DAY` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `LEAVE_RAISING` tinyint(1) NULL DEFAULT 0,
  `LEAVE_HELP_RAISING` tinyint(1) NULL DEFAULT 0,
  `LEAVE_TRAVEL` tinyint NULL DEFAULT 0,
  `APPROVE_C` enum('Approve','Disapproved','Pending') CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT 'Pending',
  `APPROVE_B` enum('Approve','Disapproved','Pending') CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT 'Pending',
  `APPROVE_A` enum('Approve','Disapproved','Pending') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Pending',
  `APPROVE_H` enum('Approve','Disapproved','Pending') CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `APPROVE_A_COMMENT` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `APPROVE_B_COMMENT` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `APPROVE_C_COMMENT` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `APPROVE_H_COMMENT` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `HEADER_C` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'ชื่อผู้อนุมัติระดับ C',
  `HEADER_B` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'ชื่อผู้อนุมัติระดับ B',
  `HEADER_A` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT 'ชื่อผู้อนุมัติระดับ A',
  `HEADER_H` varchar(13) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `HEADER_DIRECTOR` varchar(13) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `APPROVE_C_DATE` datetime NULL DEFAULT NULL,
  `APPROVE_B_DATE` datetime NULL DEFAULT NULL,
  `APPROVE_A_DATE` datetime NULL DEFAULT NULL,
  `APPROVE_H_DATE` datetime NULL DEFAULT NULL,
  `HEADER_C_CANCEL` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `HEADER_B_CANCEL` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `HEADER_A_CANCEL` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `HEADER_H_CANCEL` varchar(13) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `CANCEL_C_STATE` enum('Pending','Approve','Disapproved') CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `CANCEL_B_STATE` enum('Pending','Approve','Disapproved') CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `CANCEL_A_STATE` enum('Pending','Approve','Disapproved') CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `CANCEL_H_STATE` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `CANCEL_C_DATE` datetime NULL DEFAULT NULL,
  `CANCEL_B_DATE` datetime NULL DEFAULT NULL,
  `CANCEL_A_DATE` datetime NULL DEFAULT NULL,
  `CANCEL_H_DATE` datetime NULL DEFAULT NULL,
  `CANCEL_C_COMMENT` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `CANCEL_B_COMMENT` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `CANCEL_A_COMMENT` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `CANCEL_DOCUMENT` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `ordain` int NULL DEFAULT NULL,
  `temple` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `address_temple` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL,
  `FILES` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'เอกสารอื่นๆ',
  `FILES_SIGNATURE` text CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL COMMENT 'เอกสารลายเซ็น',
  `YEAR` char(4) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'ประจำปีงบประมาณ',
  `YEAR2` char(4) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `STATUS` enum('Approve','Disapproved','Pending','Cancel') CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL DEFAULT 'Pending',
  `USED` tinyint(1) NULL DEFAULT 1,
  `DATE_CANCEL` datetime NULL DEFAULT NULL,
  `CREATE_DATE` datetime NOT NULL,
  `TYPE` enum('คำขออนุมัติ','คำขอยกเลิก','อนุมัติแล้ว','ยกเลิกแล้ว') CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT 'คำขออนุมัติ',
  `ACCEPT_LEAVE_WORK` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `NAME_WIFE` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL COMMENT 'ชื่อภรรยา',
  `BIRTH_DAY` date NULL DEFAULT NULL COMMENT 'วันคลอด',
  `monitor` int NULL DEFAULT 1,
  PRIMARY KEY (`ID`) USING BTREE,
  UNIQUE INDEX `LEAVE_ID`(`LEAVE_ID` ASC) USING BTREE,
  INDEX `ID`(`ID` ASC) USING BTREE,
  INDEX `EMPLOYEE_ID`(`EMPLOYEE_ID` ASC) USING BTREE,
  INDEX `TYPE_LEAVE`(`TYPE_LEAVE` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 91976 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci ROW_FORMAT = DYNAMIC;

SET FOREIGN_KEY_CHECKS = 1;
