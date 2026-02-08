const { promisePool } = require('../../config/database');

// Get all electricity_complaints
const getAllComplaints = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, ca.consumer_number, u.full_name AS user_full_name, u.email AS user_email, u.phone AS user_phone
      FROM electricity_complaints c
      LEFT JOIN electricity_consumer_accounts ca ON c.consumer_account_id = ca.id
      LEFT JOIN electricity_users u ON c.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND c.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY c.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [complaints] = await promisePool.query(query, params);

    // Parse JSON fields and handle anonymous submissions
    const parsedComplaints = complaints.map(complaint => {
      const stageHistory = complaint.stage_history ? 
        (typeof complaint.stage_history === 'string' ? JSON.parse(complaint.stage_history) : complaint.stage_history) : [];
      
      const complaintData = complaint.complaint_data ? 
        (typeof complaint.complaint_data === 'string' ? JSON.parse(complaint.complaint_data) : complaint.complaint_data) : {};
      
      // Use complaint_data for anonymous submissions (no user_id)
      const full_name = complaint.user_full_name || complaintData.full_name || 'N/A';
      const email = complaint.user_email || complaintData.email || '';
      const phone = complaint.user_phone || complaintData.mobile || '';

      return {
        ...complaint,
        stage_history: stageHistory,
        complaint_data: complaintData,
        full_name,
        email,
        phone
      };
    });

    res.json(parsedComplaints);
  } catch (error) {
    console.error('Get electricity_complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

// Update complaint
const updateComplaint = async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const { status, resolution_notes, assigned_to } = req.body;
    const complaintId = req.params.id;

    // Get complaint details
    const [complaints] = await connection.query(
      `SELECT c.* FROM electricity_complaints c WHERE c.id = ?`,
      [complaintId]
    );

    if (complaints.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaints[0];
    
    // Safely parse stage_history
    let stageHistory = [];
    try {
      if (complaint.stage_history) {
        stageHistory = typeof complaint.stage_history === 'string' 
          ? JSON.parse(complaint.stage_history) 
          : complaint.stage_history;
      }
    } catch (parseError) {
      console.error('Failed to parse stage_history:', parseError);
      stageHistory = [];
    }
    
    // Add new stage to history
    if (status && status !== complaint.status) {
      const stageNames = {
        'open': 'Complaint Registered',
        'assigned': 'Assigned to Technician',
        'in_progress': 'Work in Progress',
        'resolved': 'Issue Resolved',
        'closed': 'Complaint Closed'
      };
      
      stageHistory.push({
        stage: stageNames[status] || status,
        status: status,
        timestamp: new Date().toISOString(),
        remarks: resolution_notes || '',
        updated_by: req.user?.id
      });
    }

    // Update complaint
    await connection.query(
      `UPDATE electricity_complaints 
       SET status = ?, resolution_notes = ?, assigned_to = ?, stage_history = ?,
           resolved_at = CASE WHEN ? IN ('resolved', 'closed') THEN NOW() ELSE resolved_at END
       WHERE id = ?`,
      [status || complaint.status, resolution_notes || null, assigned_to || complaint.assigned_to, 
       JSON.stringify(stageHistory), status, complaintId]
    );

    // Create notification if user exists
    if (status && complaint.user_id) {
      let message = `Your complaint ${complaint.complaint_number} status has been updated to ${status}.`;
      if (status === 'resolved' && resolution_notes) {
        message += ` Resolution: ${resolution_notes}`;
      }

      await connection.query(
        `INSERT INTO electricity_notifications (user_id, title, message, type) 
         VALUES (?, ?, ?, ?)`,
        [complaint.user_id, 'Complaint Update', message, 
         status === 'resolved' ? 'success' : 'info']
      );
    }

    await connection.commit();

    res.json({ 
      message: 'Complaint updated successfully',
      stage_history: stageHistory
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update complaint error:', error.message);
    console.error('Error details:', error);
    res.status(500).json({ error: 'Failed to update complaint', details: error.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllComplaints,
  updateComplaint
};
