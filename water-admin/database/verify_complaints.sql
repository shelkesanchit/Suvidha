-- =====================================================
-- TEST WATER COMPLAINT SUBMISSION
-- Verify all fields are being stored correctly
-- =====================================================

USE suvidha;

-- Clear test data (optional)
-- DELETE FROM water_complaints WHERE contact_name = 'Test User';

-- Show current structure
DESCRIBE water_complaints;

-- Show all complaints with all fields
SELECT 
  id,
  complaint_number,
  consumer_number,
  contact_name,
  mobile,
  email,
  address,
  ward,
  landmark,
  complaint_category,
  description,
  urgency,
  status,
  priority,
  assigned_engineer,
  resolution_notes,
  created_at,
  updated_at
FROM water_complaints
ORDER BY created_at DESC;

-- Count by category
SELECT 
  complaint_category,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
  SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count
FROM water_complaints
GROUP BY complaint_category;

-- Count by status
SELECT 
  status,
  COUNT(*) as total,
  AVG(priority) as avg_priority
FROM water_complaints
GROUP BY status;

-- Recent complaints with missing data
SELECT 
  complaint_number,
  contact_name,
  mobile,
  CASE 
    WHEN email IS NULL OR email = '' THEN 'Missing' 
    ELSE 'OK' 
  END as email_status,
  CASE 
    WHEN ward IS NULL OR ward = '' THEN 'Missing' 
    ELSE 'OK' 
  END as ward_status,
  CASE 
    WHEN address IS NULL OR address = '' THEN 'Missing' 
    ELSE 'OK' 
  END as address_status,
  CASE 
    WHEN landmark IS NULL OR landmark = '' THEN 'Missing' 
    ELSE 'OK' 
  END as landmark_status,
  created_at
FROM water_complaints
ORDER BY created_at DESC
LIMIT 20;
