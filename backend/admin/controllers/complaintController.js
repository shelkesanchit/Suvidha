const { promisePool } = require('../../config/database');

// Get all complaints
const getAllComplaints = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, ec.consumer_id
      FROM complaints c
      LEFT JOIN electricity_customers ec ON c.customer_id = ec.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND c.complaint_status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND c.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY c.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [complaints] = await promisePool.query(query, params);

    // Map complaint data for the response
    const parsedComplaints = complaints.map(complaint => {
      return {
        ...complaint,
        full_name: complaint.customer_name || 'N/A',
        email: '',
        phone: complaint.customer_mobile || '',
        status: complaint.complaint_status
      };
    });

    res.json(parsedComplaints);
  } catch (error) {
    console.error('Get complaints error:', error);
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
      `SELECT c.* FROM complaints c WHERE c.id = ?`,
      [complaintId]
    );

    if (complaints.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaints[0];

    // Update complaint using correct column name: complaint_status (not status)
    await connection.query(
      `UPDATE complaints 
       SET complaint_status = ?, resolution_notes = ?, assigned_to = ?,
           resolved_at = CASE WHEN ? IN ('resolved', 'closed') THEN NOW() ELSE resolved_at END
       WHERE id = ?`,
      [status || complaint.complaint_status, resolution_notes || null, assigned_to || complaint.assigned_to, 
       status, complaintId]
    );

    await connection.commit();

    res.json({ 
      message: 'Complaint updated successfully'
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
