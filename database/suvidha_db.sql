-- ============================================================
-- SUVIDHA - Unified Database Schema
-- Complete database setup for Electricity, Water & Gas services
-- ============================================================
-- This single file creates both databases and all tables.
-- Run: mysql -u root -p < suvidha_db.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================================
-- DATABASE 1: suvidha_db
-- Used by: Electricity Admin, Gas Admin, Frontend Kiosk
-- Tables: 29
-- ============================================================

CREATE DATABASE IF NOT EXISTS `suvidha_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `suvidha_db`;

-- --------------------
-- Auth & Admin Tables
-- --------------------

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('customer','admin','staff') DEFAULT 'customer',
  `full_name` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('super_admin','electricity_admin','water_admin','gas_admin','staff') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'staff',
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changes` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` longtext COLLATE utf8mb4_unicode_ci,
  `setting_type` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`),
  KEY `idx_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------
-- Generic / Legacy Tables
-- --------------------

CREATE TABLE IF NOT EXISTS `customers` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `area` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plot_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `service_type` enum('water','electricity','gas') COLLATE utf8mb4_unicode_ci NOT NULL,
  `meter_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `connection_status` enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `connection_date` date DEFAULT NULL,
  `aadhar_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pan_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_country_code` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT '+91',
  `account_created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `verification_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile` (`mobile`),
  KEY `idx_mobile` (`mobile`),
  KEY `idx_state_city` (`state`, `city`),
  KEY `idx_area_pincode` (`area`, `pincode`),
  KEY `idx_service_type` (`service_type`),
  KEY `idx_customer_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `applicant_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aadhar_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `service_type` enum('electricity','water','gas') COLLATE utf8mb4_unicode_ci NOT NULL,
  `application_type` enum('new_connection','modification','reconnection','disconnection','load_change','meter_change','name_transfer') COLLATE utf8mb4_unicode_ci DEFAULT 'new_connection',
  `application_status` enum('submitted','under_review','approved','rejected','installed') COLLATE utf8mb4_unicode_ci DEFAULT 'submitted',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `documents` text COLLATE utf8mb4_unicode_ci,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `submitted_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `application_number` (`application_number`),
  KEY `idx_mobile` (`mobile`),
  KEY `idx_service_type` (`service_type`),
  KEY `idx_status` (`application_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `complaints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `complaint_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_mobile` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_type` enum('electricity','water','gas') COLLATE utf8mb4_unicode_ci NOT NULL,
  `complaint_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachment_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complaint_status` enum('open','assigned','under_investigation','resolved','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `assigned_to` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolution_notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `complaint_number` (`complaint_number`),
  KEY `idx_mobile` (`customer_mobile`),
  KEY `idx_service_type` (`service_type`),
  KEY `idx_status` (`complaint_status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_type` enum('electricity','water','gas') COLLATE utf8mb4_unicode_ci NOT NULL,
  `meter_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `billing_period_start` date NOT NULL,
  `billing_period_end` date NOT NULL,
  `previous_reading` decimal(10,2) DEFAULT NULL,
  `current_reading` decimal(10,2) DEFAULT NULL,
  `units_consumed` decimal(10,2) DEFAULT NULL,
  `base_amount` decimal(10,2) DEFAULT NULL,
  `tax_amount` decimal(10,2) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `bill_status` enum('pending','paid','overdue','disputed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `due_date` date NOT NULL,
  `paid_date` date DEFAULT NULL,
  `paid_amount` decimal(10,2) DEFAULT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issued_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_bill_status` (`bill_status`),
  KEY `idx_service_type` (`service_type`),
  CONSTRAINT `bills_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `meter_readings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meter_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `previous_reading` decimal(10,2) DEFAULT NULL,
  `current_reading` decimal(10,2) NOT NULL,
  `reading_date` date NOT NULL,
  `consumption` decimal(10,2) DEFAULT NULL,
  `reading_type` enum('meter_visit','self_reading','estimated') COLLATE utf8mb4_unicode_ci DEFAULT 'meter_visit',
  `meter_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meter_image_data` longblob,
  `status` enum('pending','verified','disputed','approved') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `submitted_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `verified_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_reading_date` (`reading_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `meter_readings_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `payment_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_mobile` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_type` enum('electricity','water','gas') COLLATE utf8mb4_unicode_ci NOT NULL,
  `bill_id` int DEFAULT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_method` enum('cash','cheque','online','bank_transfer','card') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('success','pending','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `receipt_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `payment_reference` (`payment_reference`),
  KEY `idx_mobile` (`customer_mobile`),
  KEY `idx_service_type` (`service_type`),
  KEY `idx_payment_date` (`payment_date`),
  KEY `idx_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tariff_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service_type` enum('water','electricity','gas') COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slab_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slab_start` decimal(10,2) DEFAULT NULL,
  `slab_end` decimal(10,2) DEFAULT NULL,
  `rate` decimal(10,2) NOT NULL,
  `fixed_charge` decimal(10,2) DEFAULT '0.00',
  `meter_charge` decimal(10,2) DEFAULT '0.00',
  `tax_percentage` decimal(5,2) DEFAULT '0.00',
  `effective_from` date DEFAULT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_service_state` (`service_type`, `state`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------
-- Electricity Tables
-- --------------------

CREATE TABLE IF NOT EXISTS `electricity_customers` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consumer_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aadhar_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pan_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `area` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plot_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `meter_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meter_phase` enum('single','three') COLLATE utf8mb4_unicode_ci DEFAULT 'single',
  `connection_type` enum('domestic','industrial','commercial','agricultural') COLLATE utf8mb4_unicode_ci DEFAULT 'domestic',
  `sanctioned_load` int DEFAULT NULL,
  `connection_status` enum('active','inactive','suspended','disconnected') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `connection_date` date DEFAULT NULL,
  `account_created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `consumer_id` (`consumer_id`),
  UNIQUE KEY `meter_number` (`meter_number`),
  KEY `idx_mobile` (`mobile`),
  KEY `idx_consumer_id` (`consumer_id`),
  KEY `idx_state_city_pincode` (`state`, `city`, `pincode`),
  KEY `idx_meter_number` (`meter_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `electricity_bills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bill_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meter_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `billing_period_start` date NOT NULL,
  `billing_period_end` date NOT NULL,
  `bill_month` int DEFAULT NULL,
  `bill_year` int DEFAULT NULL,
  `units_consumed` decimal(10,2) DEFAULT NULL,
  `slab_category` enum('domestic','industrial','commercial','agricultural') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consumption_charges` decimal(10,2) DEFAULT NULL,
  `fixed_charges` decimal(10,2) DEFAULT NULL,
  `tax_amount` decimal(10,2) DEFAULT NULL,
  `previous_due` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `bill_status` enum('issued','pending','partially_paid','paid','overdue','disputed') COLLATE utf8mb4_unicode_ci DEFAULT 'issued',
  `issue_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `paid_date` date DEFAULT NULL,
  `paid_amount` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bill_number` (`bill_number`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_bill_month_year` (`bill_year`, `bill_month`),
  KEY `idx_status` (`bill_status`),
  CONSTRAINT `electricity_bills_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `electricity_customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `electricity_meter_readings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meter_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reading_date` date NOT NULL,
  `previous_reading` decimal(10,2) DEFAULT NULL,
  `current_reading` decimal(10,2) NOT NULL,
  `units_consumed` decimal(10,2) DEFAULT NULL,
  `reading_type` enum('meter_visit','self_reading','estimated') COLLATE utf8mb4_unicode_ci DEFAULT 'meter_visit',
  `meter_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','verified','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `submitted_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `verified_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_reading_date` (`reading_date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `electricity_meter_readings_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `electricity_customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `electricity_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bill_id` int DEFAULT NULL,
  `customer_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_method` enum('cash','cheque','online','bank_transfer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('success','pending','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `receipt_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bill_id` (`bill_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_payment_date` (`payment_date`),
  CONSTRAINT `electricity_payments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `electricity_customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `electricity_payments_ibfk_2` FOREIGN KEY (`bill_id`) REFERENCES `electricity_bills` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `electricity_tariff_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('domestic','industrial','commercial','agricultural') COLLATE utf8mb4_unicode_ci NOT NULL,
  `slab_from` int DEFAULT NULL,
  `slab_to` int DEFAULT NULL,
  `rate_per_unit` decimal(10,4) NOT NULL,
  `fixed_charge` decimal(10,2) DEFAULT NULL,
  `tax_percentage` decimal(5,2) DEFAULT NULL,
  `effective_from` date DEFAULT NULL,
  `effective_to` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tariff` (`state`, `city`, `category`, `slab_from`, `slab_to`),
  KEY `idx_state_city` (`state`, `city`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------
-- Water Tables (suvidha_db)
-- --------------------

CREATE TABLE IF NOT EXISTS `water_customers` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consumer_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aadhar_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pan_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `area` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plot_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `meter_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meter_type` enum('domestic','commercial','industrial') COLLATE utf8mb4_unicode_ci DEFAULT 'domestic',
  `connection_status` enum('active','inactive','suspended','disconnected') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `connection_date` date DEFAULT NULL,
  `account_created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `consumer_id` (`consumer_id`),
  UNIQUE KEY `meter_number` (`meter_number`),
  KEY `idx_mobile` (`mobile`),
  KEY `idx_consumer_id` (`consumer_id`),
  KEY `idx_state_city_pincode` (`state`, `city`, `pincode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `water_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_number` varchar(50) DEFAULT NULL,
  `application_type` varchar(50) DEFAULT 'new_connection',
  `applicant_category` varchar(50) DEFAULT 'individual',
  `full_name` varchar(100) NOT NULL,
  `father_spouse_name` varchar(100) DEFAULT NULL,
  `aadhaar_number` varchar(20) DEFAULT NULL,
  `mobile` varchar(15) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `property_id` varchar(50) DEFAULT NULL,
  `house_flat_no` varchar(50) DEFAULT NULL,
  `building_name` varchar(100) DEFAULT NULL,
  `ward` varchar(10) DEFAULT NULL,
  `address` text,
  `landmark` varchar(255) DEFAULT NULL,
  `property_type` varchar(50) DEFAULT 'residential',
  `ownership_status` varchar(50) DEFAULT 'owner',
  `connection_purpose` varchar(50) DEFAULT 'drinking',
  `pipe_size_requested` varchar(20) DEFAULT '15mm',
  `connection_type_requested` varchar(50) DEFAULT 'permanent',
  `status` enum('submitted','under_review','approved','rejected','installed') DEFAULT 'submitted',
  `current_stage` varchar(100) DEFAULT 'Application Submitted',
  `stage_history` json DEFAULT NULL,
  `documents` json DEFAULT NULL,
  `application_fee` decimal(10,2) DEFAULT '500.00',
  `connection_fee` decimal(10,2) DEFAULT '2000.00',
  `security_deposit` decimal(10,2) DEFAULT '2000.00',
  `total_fee` decimal(10,2) DEFAULT '4500.00',
  `fee_paid` tinyint(1) DEFAULT '0',
  `assigned_engineer` varchar(100) DEFAULT NULL,
  `remarks` text,
  `rejection_reason` text,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `application_number` (`application_number`),
  KEY `idx_mobile` (`mobile`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `water_bills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bill_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meter_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `billing_period_start` date NOT NULL,
  `billing_period_end` date NOT NULL,
  `bill_month` int DEFAULT NULL,
  `bill_year` int DEFAULT NULL,
  `water_consumed` decimal(10,2) DEFAULT NULL,
  `consumption_charges` decimal(10,2) DEFAULT NULL,
  `fixed_charges` decimal(10,2) DEFAULT NULL,
  `tax_amount` decimal(10,2) DEFAULT NULL,
  `previous_due` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `bill_status` enum('issued','pending','partially_paid','paid','overdue','disputed') COLLATE utf8mb4_unicode_ci DEFAULT 'issued',
  `issue_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `paid_date` date DEFAULT NULL,
  `paid_amount` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bill_number` (`bill_number`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_bill_month_year` (`bill_year`, `bill_month`),
  KEY `idx_status` (`bill_status`),
  CONSTRAINT `water_bills_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `water_customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `water_complaints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `complaint_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complaint_type` enum('low_pressure','contamination','leakage','billing','meter_issue','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachment_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('open','assigned','under_investigation','resolved','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `assigned_to` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolution_notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `complaint_number` (`complaint_number`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `water_complaints_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `water_customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `water_meter_readings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meter_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reading_date` date NOT NULL,
  `previous_reading` decimal(10,2) DEFAULT NULL,
  `current_reading` decimal(10,2) NOT NULL,
  `water_consumed` decimal(10,2) DEFAULT NULL,
  `reading_type` enum('meter_visit','self_reading','estimated') COLLATE utf8mb4_unicode_ci DEFAULT 'meter_visit',
  `meter_photo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','verified','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `submitted_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `verified_by` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_reading_date` (`reading_date`),
  CONSTRAINT `water_meter_readings_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `water_customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `water_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bill_id` int DEFAULT NULL,
  `customer_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_method` enum('cash','cheque','online','bank_transfer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('success','pending','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `receipt_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bill_id` (`bill_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_payment_date` (`payment_date`),
  CONSTRAINT `water_payments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `water_customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `water_payments_ibfk_2` FOREIGN KEY (`bill_id`) REFERENCES `water_bills` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `water_tariff_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slab_from` int DEFAULT NULL,
  `slab_to` int DEFAULT NULL,
  `rate_per_unit` decimal(10,4) NOT NULL,
  `unit_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '1000_liters',
  `fixed_charge` decimal(10,2) DEFAULT NULL,
  `tax_percentage` decimal(5,2) DEFAULT NULL,
  `effective_from` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_state_city` (`state`, `city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------
-- Gas / LPG Tables
-- --------------------

CREATE TABLE IF NOT EXISTS `gas_customers` (
  `id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `consumer_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aadhar_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pan_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `area` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pincode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `lpg_consumer_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cylinder_type` enum('14kg','19kg','commercial') COLLATE utf8mb4_unicode_ci DEFAULT '14kg',
  `connection_type` enum('domestic','pmuy','commercial') COLLATE utf8mb4_unicode_ci DEFAULT 'domestic',
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_ifsc` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_verified` tinyint(1) DEFAULT '0',
  `connection_status` enum('active','suspended','inactive','disconnected') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `connection_date` date DEFAULT NULL,
  `account_created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_verified` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `consumer_id` (`consumer_id`),
  UNIQUE KEY `lpg_consumer_id` (`lpg_consumer_id`),
  KEY `idx_mobile` (`mobile`),
  KEY `idx_consumer_id` (`consumer_id`),
  KEY `idx_state_city_pincode` (`state`, `city`, `pincode`),
  KEY `idx_lpg_consumer_id` (`lpg_consumer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gas_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aadhar_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pan_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pincode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `plot_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cylinder_type` enum('14kg','19kg','commercial') COLLATE utf8mb4_unicode_ci DEFAULT '14kg',
  `connection_type` enum('domestic','pmuy','commercial') COLLATE utf8mb4_unicode_ci DEFAULT 'domestic',
  `gst_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trade_license` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `documents` longtext COLLATE utf8mb4_unicode_ci,
  `photo_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fire_noc_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `distributor_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `distributor_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `application_status` enum('submitted','under_review','approved','rejected','installed') COLLATE utf8mb4_unicode_ci DEFAULT 'submitted',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `application_number` (`application_number`),
  KEY `idx_mobile` (`mobile`),
  KEY `idx_state_city` (`state`, `city`),
  KEY `idx_pincode` (`pincode`),
  KEY `idx_status` (`application_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gas_complaints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `complaint_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complaint_type` enum('delivery_issue','billing','safety','quality','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `attachment_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('open','assigned','under_investigation','resolved','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `assigned_to` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolution_notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `complaint_number` (`complaint_number`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `gas_complaints_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `gas_customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gas_cylinder_bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cylinder_type` enum('14kg','19kg','commercial') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int DEFAULT '1',
  `booking_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `delivery_date` date DEFAULT NULL,
  `delivery_type` enum('home_delivery','self_pickup') COLLATE utf8mb4_unicode_ci DEFAULT 'home_delivery',
  `booking_status` enum('placed','confirmed','dispatched','delivered','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'placed',
  `total_amount` decimal(10,2) DEFAULT NULL,
  `payment_status` enum('pending','paid','partially_paid') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `delivery_address` text COLLATE utf8mb4_unicode_ci,
  `delivery_phone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_number` (`booking_number`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_booking_date` (`booking_date`),
  KEY `idx_status` (`booking_status`),
  CONSTRAINT `gas_cylinder_bookings_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `gas_customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gas_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int DEFAULT NULL,
  `customer_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `payment_method` enum('cash','online','bank_transfer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `subsidy_amount` decimal(10,2) DEFAULT '0.00',
  `transaction_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('success','pending','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `receipt_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_payment_date` (`payment_date`),
  CONSTRAINT `gas_payments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `gas_customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gas_payments_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `gas_cylinder_bookings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `gas_tariff_rates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cylinder_type` enum('14kg','19kg','commercial') COLLATE utf8mb4_unicode_ci NOT NULL,
  `price_per_cylinder` decimal(10,2) NOT NULL,
  `base_price` decimal(10,2) DEFAULT NULL,
  `subsidy_amount` decimal(10,2) DEFAULT NULL,
  `effective_from` date DEFAULT NULL,
  `supplier` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_gas_rate` (`state`, `city`, `cylinder_type`),
  KEY `idx_state_city` (`state`, `city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- DATABASE 2: suvidha
-- Used by: Water Admin Panel
-- Tables: 8
-- ============================================================

CREATE DATABASE IF NOT EXISTS `suvidha`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE `suvidha`;

CREATE TABLE IF NOT EXISTS `water_admin_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `role` enum('super_admin','admin','manager','engineer','billing_officer','field_staff','viewer') NOT NULL DEFAULT 'viewer',
  `department` varchar(100) DEFAULT 'Water Supply',
  `designation` varchar(100) DEFAULT NULL,
  `ward_assigned` varchar(50) DEFAULT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `water_consumers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `consumer_number` varchar(50) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `father_spouse_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `mobile` varchar(15) NOT NULL,
  `alternate_mobile` varchar(15) DEFAULT NULL,
  `aadhaar_number` varchar(12) DEFAULT NULL,
  `property_id` varchar(100) DEFAULT NULL,
  `house_flat_no` varchar(50) DEFAULT NULL,
  `building_name` varchar(255) DEFAULT NULL,
  `ward` varchar(20) DEFAULT NULL,
  `address` text NOT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT 'Nashik',
  `district` varchar(100) DEFAULT 'Nashik',
  `state` varchar(100) DEFAULT 'Maharashtra',
  `pincode` varchar(10) DEFAULT NULL,
  `connection_type` enum('permanent','temporary') DEFAULT 'permanent',
  `connection_status` enum('active','inactive','disconnected','pending') DEFAULT 'active',
  `property_type` enum('residential','commercial','industrial','institutional','construction') DEFAULT 'residential',
  `ownership_status` enum('owner','tenant','leaseholder') DEFAULT 'owner',
  `pipe_size` enum('15mm','20mm','25mm','40mm','50mm') DEFAULT '15mm',
  `meter_number` varchar(50) DEFAULT NULL,
  `meter_type` enum('mechanical','digital','smart') DEFAULT 'mechanical',
  `tariff_category` varchar(50) DEFAULT 'domestic',
  `billing_cycle` enum('monthly','bi-monthly','quarterly') DEFAULT 'monthly',
  `outstanding_amount` decimal(12,2) DEFAULT '0.00',
  `last_payment_date` date DEFAULT NULL,
  `last_payment_amount` decimal(12,2) DEFAULT NULL,
  `connection_date` date DEFAULT NULL,
  `last_meter_reading_date` date DEFAULT NULL,
  `last_meter_reading` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `consumer_number` (`consumer_number`),
  KEY `idx_consumer_number` (`consumer_number`),
  KEY `idx_mobile` (`mobile`),
  KEY `idx_ward` (`ward`),
  KEY `idx_status` (`connection_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `water_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `application_number` varchar(50) NOT NULL,
  `application_type` enum('new_connection','reconnection','disconnection','transfer','pipe_size_change','meter_change') NOT NULL,
  `applicant_category` enum('individual','housing_society','firm','private_company','trust','government') DEFAULT 'individual',
  `full_name` varchar(255) NOT NULL,
  `father_spouse_name` varchar(255) DEFAULT NULL,
  `aadhaar_number` varchar(12) DEFAULT NULL,
  `mobile` varchar(15) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `property_id` varchar(100) DEFAULT NULL,
  `house_flat_no` varchar(50) DEFAULT NULL,
  `building_name` varchar(255) DEFAULT NULL,
  `ward` varchar(20) DEFAULT NULL,
  `address` text NOT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `property_type` enum('residential','commercial','industrial','institutional','construction') DEFAULT 'residential',
  `ownership_status` enum('owner','tenant','leaseholder') DEFAULT 'owner',
  `connection_purpose` enum('drinking','construction','gardening','industrial') DEFAULT 'drinking',
  `pipe_size_requested` enum('15mm','20mm','25mm','40mm','50mm') DEFAULT '15mm',
  `connection_type_requested` enum('permanent','temporary') DEFAULT 'permanent',
  `status` enum('submitted','document_verification','site_inspection','approval_pending','approved','rejected','work_in_progress','completed') DEFAULT 'submitted',
  `current_stage` varchar(100) DEFAULT 'Application Submitted',
  `stage_history` json DEFAULT NULL,
  `documents` json DEFAULT NULL,
  `application_fee` decimal(10,2) DEFAULT '0.00',
  `connection_fee` decimal(10,2) DEFAULT '0.00',
  `security_deposit` decimal(10,2) DEFAULT '0.00',
  `total_fee` decimal(10,2) DEFAULT '0.00',
  `fee_paid` tinyint(1) DEFAULT '0',
  `payment_date` date DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `assigned_engineer` varchar(255) DEFAULT NULL,
  `remarks` text,
  `rejection_reason` text,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `application_number` (`application_number`),
  KEY `idx_app_number` (`application_number`),
  KEY `idx_status` (`status`),
  KEY `idx_mobile` (`mobile`),
  KEY `idx_submitted_at` (`submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `water_bills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bill_number` varchar(50) NOT NULL,
  `consumer_id` int NOT NULL,
  `consumer_number` varchar(50) NOT NULL,
  `bill_month` varchar(20) NOT NULL,
  `bill_year` int NOT NULL,
  `bill_date` date NOT NULL,
  `due_date` date NOT NULL,
  `meter_number` varchar(50) DEFAULT NULL,
  `previous_reading` int DEFAULT '0',
  `current_reading` int DEFAULT '0',
  `consumption_kl` decimal(10,2) DEFAULT '0.00',
  `reading_date` date DEFAULT NULL,
  `water_charges` decimal(10,2) DEFAULT '0.00',
  `sewerage_charges` decimal(10,2) DEFAULT '0.00',
  `service_tax` decimal(10,2) DEFAULT '0.00',
  `meter_rent` decimal(10,2) DEFAULT '0.00',
  `other_charges` decimal(10,2) DEFAULT '0.00',
  `arrears` decimal(10,2) DEFAULT '0.00',
  `late_fee` decimal(10,2) DEFAULT '0.00',
  `gross_amount` decimal(12,2) DEFAULT '0.00',
  `discount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL,
  `amount_paid` decimal(12,2) DEFAULT '0.00',
  `balance_amount` decimal(12,2) DEFAULT '0.00',
  `status` enum('generated','sent','paid','partially_paid','overdue','disputed') DEFAULT 'generated',
  `payment_status` enum('unpaid','paid','partial') DEFAULT 'unpaid',
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` timestamp NULL DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bill_number` (`bill_number`),
  KEY `idx_bill_number` (`bill_number`),
  KEY `idx_consumer_id` (`consumer_id`),
  KEY `idx_consumer_number` (`consumer_number`),
  KEY `idx_bill_month` (`bill_month`, `bill_year`),
  KEY `idx_status` (`status`),
  KEY `idx_due_date` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `water_complaints` (
  `id` int NOT NULL AUTO_INCREMENT,
  `complaint_number` varchar(50) NOT NULL,
  `consumer_number` varchar(50) DEFAULT NULL,
  `consumer_id` int DEFAULT NULL,
  `contact_name` varchar(255) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text,
  `ward` varchar(20) DEFAULT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `location_coordinates` varchar(100) DEFAULT NULL,
  `complaint_category` enum('no-water','low-pressure','contaminated','pipeline-leak','meter-stopped','high-bill','illegal-connection','sewerage','other') NOT NULL,
  `description` text NOT NULL,
  `urgency` enum('low','medium','high','critical') DEFAULT 'medium',
  `status` enum('open','assigned','in_progress','resolved','closed','reopened') DEFAULT 'open',
  `priority` int DEFAULT '5',
  `assigned_to` int DEFAULT NULL,
  `assigned_engineer` varchar(255) DEFAULT NULL,
  `assignment_date` timestamp NULL DEFAULT NULL,
  `resolution_notes` text,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `resolution_time_hours` int DEFAULT NULL,
  `customer_feedback` text,
  `rating` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `complaint_number` (`complaint_number`),
  KEY `idx_complaint_number` (`complaint_number`),
  KEY `idx_consumer_number` (`consumer_number`),
  KEY `idx_status` (`status`),
  KEY `idx_category` (`complaint_category`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `water_payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_id` varchar(100) NOT NULL,
  `consumer_id` int DEFAULT NULL,
  `consumer_number` varchar(50) NOT NULL,
  `bill_id` int DEFAULT NULL,
  `bill_number` varchar(50) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('upi','card','netbanking','cash','cheque','wallet','pos') NOT NULL,
  `payment_gateway` varchar(50) DEFAULT NULL,
  `gateway_reference` varchar(100) DEFAULT NULL,
  `status` enum('initiated','processing','success','failed','refunded') DEFAULT 'initiated',
  `receipt_number` varchar(50) DEFAULT NULL,
  `receipt_generated` tinyint(1) DEFAULT '0',
  `ip_address` varchar(45) DEFAULT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `initiated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_id` (`transaction_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_consumer_id` (`consumer_id`),
  KEY `idx_consumer_number` (`consumer_number`),
  KEY `idx_status` (`status`),
  KEY `idx_initiated_at` (`initiated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `water_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` varchar(500) DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `water_tariffs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `property_type` enum('residential','commercial','industrial','institutional') NOT NULL,
  `slab_1_limit` int DEFAULT '10',
  `slab_1_rate` decimal(10,2) NOT NULL,
  `slab_2_limit` int DEFAULT '20',
  `slab_2_rate` decimal(10,2) NOT NULL,
  `slab_3_limit` int DEFAULT '30',
  `slab_3_rate` decimal(10,2) NOT NULL,
  `slab_4_rate` decimal(10,2) NOT NULL,
  `minimum_charge` decimal(10,2) DEFAULT '0.00',
  `meter_rent` decimal(10,2) DEFAULT '0.00',
  `service_charge` decimal(10,2) DEFAULT '0.00',
  `sewerage_percentage` decimal(5,2) DEFAULT '20.00',
  `is_active` tinyint(1) DEFAULT '1',
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_property_type` (`property_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ============================================================
-- SEED DATA
-- ============================================================

USE `suvidha_db`;

-- Default admin user (password: admin123)
INSERT IGNORE INTO `users` (`email`, `password`, `role`, `full_name`, `phone`, `is_active`)
VALUES ('admin@electricity.gov.in', '$2b$10$YourHashHere', 'admin', 'System Administrator', '9999999999', 1);

-- Admin users for all departments (password: admin123)
INSERT IGNORE INTO `admin_users` (`email`, `password_hash`, `role`, `full_name`, `phone`, `is_active`)
VALUES
  ('superadmin@suvidha.gov.in', '$2b$10$YourHashHere', 'super_admin', 'Super Administrator', '9000000001', 1),
  ('admin@electricity.gov.in', '$2b$10$YourHashHere', 'electricity_admin', 'Electricity Admin', '9000000002', 1),
  ('admin@water.gov.in', '$2b$10$YourHashHere', 'water_admin', 'Water Admin', '9000000003', 1),
  ('admin@gas.gov.in', '$2b$10$YourHashHere', 'gas_admin', 'Gas Admin', '9000000004', 1);

-- Sample electricity tariff rates
INSERT IGNORE INTO `electricity_tariff_rates` (`state`, `city`, `category`, `slab_from`, `slab_to`, `rate_per_unit`, `fixed_charge`, `tax_percentage`, `effective_from`)
VALUES
  ('Maharashtra', 'Mumbai', 'domestic', 0, 100, 3.5000, 50.00, 16.00, '2024-04-01'),
  ('Maharashtra', 'Mumbai', 'domestic', 101, 300, 5.5000, 100.00, 16.00, '2024-04-01'),
  ('Maharashtra', 'Mumbai', 'domestic', 301, 500, 7.0000, 150.00, 16.00, '2024-04-01'),
  ('Maharashtra', 'Mumbai', 'commercial', 0, 500, 8.5000, 200.00, 18.00, '2024-04-01');

-- Sample water tariff rates
INSERT IGNORE INTO `water_tariff_rates` (`state`, `city`, `slab_from`, `slab_to`, `rate_per_unit`, `unit_type`, `fixed_charge`, `tax_percentage`, `effective_from`)
VALUES
  ('Maharashtra', 'Nashik', 0, 10, 5.0000, '1000_liters', 50.00, 5.00, '2024-04-01'),
  ('Maharashtra', 'Nashik', 11, 25, 8.0000, '1000_liters', 50.00, 5.00, '2024-04-01'),
  ('Maharashtra', 'Nashik', 26, 999, 12.0000, '1000_liters', 50.00, 5.00, '2024-04-01');

-- Sample gas tariff rates
INSERT IGNORE INTO `gas_tariff_rates` (`state`, `city`, `cylinder_type`, `price_per_cylinder`, `base_price`, `subsidy_amount`, `effective_from`, `supplier`)
VALUES
  ('Maharashtra', 'Mumbai', '14kg', 903.00, 1103.00, 200.00, '2024-04-01', 'Indian Oil'),
  ('Maharashtra', 'Mumbai', '19kg', 1850.00, 1850.00, 0.00, '2024-04-01', 'Indian Oil'),
  ('Maharashtra', 'Mumbai', 'commercial', 2100.00, 2100.00, 0.00, '2024-04-01', 'Indian Oil');

-- Water admin default admin user (password: admin123)
USE `suvidha`;

INSERT IGNORE INTO `water_admin_users` (`employee_id`, `username`, `password_hash`, `full_name`, `email`, `mobile`, `role`, `department`, `status`)
VALUES
  ('EMP001', 'super_admin', '$2b$10$YourHashHere', 'Super Admin', 'admin@water.gov.in', '9000000005', 'super_admin', 'Water Supply', 'active'),
  ('EMP002', 'water_admin', '$2b$10$YourHashHere', 'Water Admin', 'wateradmin@suvidha.gov.in', '9000000006', 'admin', 'Water Supply', 'active');

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- NOTE: The seed data uses placeholder password hashes.
-- After importing, update passwords using bcrypt:
--   node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('admin123',10).then(h=>console.log(h))"
-- Then: UPDATE users SET password='<hash>' WHERE email='admin@electricity.gov.in';
-- ============================================================
