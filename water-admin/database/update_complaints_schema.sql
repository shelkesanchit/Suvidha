-- =====================================================
-- UPDATE WATER COMPLAINTS TABLE - Remove Unused Fields
-- Run this to clean up the water_complaints table
-- =====================================================

USE suvidha;

-- Remove unused fields from water_complaints table
-- Using separate ALTER statements for compatibility
ALTER TABLE water_complaints DROP COLUMN location_coordinates;
ALTER TABLE water_complaints DROP COLUMN assigned_to;
ALTER TABLE water_complaints DROP COLUMN resolution_time_hours;
ALTER TABLE water_complaints DROP COLUMN customer_feedback;
ALTER TABLE water_complaints DROP COLUMN rating;

-- Verify the changes
DESCRIBE water_complaints;

-- Show sample data
SELECT 
  complaint_number,
  contact_name,
  mobile,
  email,
  ward,
  complaint_category,
  description,
  urgency,
  status,
  created_at
FROM water_complaints
ORDER BY created_at DESC
LIMIT 10;
