const { promisePool } = require('../../config/database');

const getAllComplaints = async (req, res) => {
  try {
    const { status: filterStatus, priority, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, ca.consumer_number, u.full_name, u.email, u.phone
      FROM electricity_complaints c
      LEFT JOIN electricity_consumer_accounts ca ON c.consumer_account_id = ca.id
      LEFT JOIN electricity_users u ON c.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filterStatus) {
      query += ' AND c.status = ?';
      params.push(filterStatus);
    }

    if (priority) {
      query += ' AND c.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY c.submitted_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [complaints] = await promisePool.query(query, params);

    res.json(complaints);
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

    const { status: newStatus, resolution_notes, assigned_to } = req.body;
    const complaintId = req.params.id;

    // Get complaint details
    const [complaints] = await connection.query(
      `SELECT * FROM electricity_complaints WHERE id = ?`,
      [complaintId]
    );

    if (complaints.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Update complaint
    await connection.query(
      `UPDATE electricity_complaints 
       SET status = ?, resolution_notes = ?, assigned_to = ?,
           resolved_at = CASE WHEN ? IN ('resolved', 'closed') THEN NOW() ELSE resolved_at END
       WHERE id = ?`,
      [newStatus, resolution_notes || null, assigned_to || null, 
       newStatus, complaintId]
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
