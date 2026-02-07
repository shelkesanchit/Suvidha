-- Migration to add LPG connection type for kiosk implementation
-- Run this on the suvidha_electricity database

-- Add connection_type column to gas_applications for Domestic/PMUY/Commercial
ALTER TABLE gas_applications 
ADD COLUMN IF NOT EXISTS lpg_connection_type ENUM('domestic', 'pmuy', 'commercial') DEFAULT 'domestic' 
AFTER gas_type;

-- Add bank verification columns for PAHAL subsidy
ALTER TABLE gas_consumers 
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100) AFTER lpg_consumer_id,
ADD COLUMN IF NOT EXISTS bank_account VARCHAR(20) AFTER bank_name,
ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(15) AFTER bank_account,
ADD COLUMN IF NOT EXISTS bank_verified BOOLEAN DEFAULT FALSE AFTER bank_ifsc;

-- Add subsidy tracking to payments
ALTER TABLE gas_payments
ADD COLUMN IF NOT EXISTS subsidy_amount DECIMAL(10,2) DEFAULT 0 AFTER amount;

-- Update gas_applications to support new kiosk flow
ALTER TABLE gas_applications
ADD COLUMN IF NOT EXISTS distributor_name VARCHAR(100) AFTER lpg_connection_type,
ADD COLUMN IF NOT EXISTS distributor_code VARCHAR(50) AFTER distributor_name,
ADD COLUMN IF NOT EXISTS pincode VARCHAR(10) AFTER address,
ADD COLUMN IF NOT EXISTS photo_path VARCHAR(255) AFTER documents,
ADD COLUMN IF NOT EXISTS fire_noc_path VARCHAR(255) AFTER photo_path,
ADD COLUMN IF NOT EXISTS gst_number VARCHAR(20) AFTER fire_noc_path,
ADD COLUMN IF NOT EXISTS trade_license VARCHAR(50) AFTER gst_number,
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255) AFTER trade_license;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_lpg_connection_type ON gas_applications(lpg_connection_type);
CREATE INDEX IF NOT EXISTS idx_pincode ON gas_applications(pincode);

-- Verify changes
SELECT 'Migration completed successfully. New columns added for LPG kiosk implementation.' AS status;
