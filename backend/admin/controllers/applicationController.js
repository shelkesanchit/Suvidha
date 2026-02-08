const { promisePool } = require('../../config/database');

// Get all electricity_applications
const getAllApplications = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Select specific columns to avoid sort memory issues with large JSON fields
    let query = `
      SELECT a.id, a.application_number, a.user_id, a.application_type, a.status,
             a.application_data, a.documents, a.remarks, a.current_stage, a.stage_history,
             a.submitted_at, a.reviewed_by, a.reviewed_at, a.completed_at,
             u.full_name, u.email, u.phone
      FROM electricity_applications a
      LEFT JOIN electricity_users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (type) {
      query += ' AND a.application_type = ?';
      params.push(type);
    }

    // Order by id DESC (indexed) instead of submitted_at to avoid sort memory issues
    query += ' ORDER BY a.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    console.log('Fetching electricity_applications with query:', query);
    console.log('Query params:', params);

    const [applications] = await promisePool.query(query, params);

    console.log('Found applications:', applications.length);

    // Parse JSON fields
    const parsedApplications = applications.map(app => {
      try {
        return {
          ...app,
          application_data: typeof app.application_data === 'string' ? JSON.parse(app.application_data) : app.application_data,
          documents: app.documents ? (typeof app.documents === 'string' ? JSON.parse(app.documents) : app.documents) : [],
          stage_history: app.stage_history ? (typeof app.stage_history === 'string' ? JSON.parse(app.stage_history) : app.stage_history) : []
        };
      } catch (parseError) {
        console.error('Error parsing application data:', parseError, 'for app:', app.id);
        return {
          ...app,
          application_data: {},
          documents: [],
          stage_history: []
        };
      }
    });

    res.json(parsedApplications);
  } catch (error) {
    console.error('Get electricity_applications error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
  }
};

// Update application status
const updateApplication = async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const { status, remarks, current_stage } = req.body;
    const applicationId = req.params.id;

    console.log('Updating application:', applicationId, 'with data:', { status, remarks, current_stage });

    // Get application details
    const [applications] = await connection.query(
      'SELECT * FROM electricity_applications WHERE id = ?',
      [applicationId]
    );

    if (applications.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = applications[0];
    console.log('Found application:', application.application_number, 'current status:', application.status);

    // Parse stage_history if it's a string
    const stageHistory = application.stage_history 
      ? (typeof application.stage_history === 'string' ? JSON.parse(application.stage_history) : application.stage_history)
      : [];
    
    // Add new stage to history
    if (current_stage) {
      stageHistory.push({
        stage: current_stage,
        status: status,
        timestamp: new Date().toISOString(),
        remarks: remarks || '',
        updated_by: req.user?.id
      });
    }

    // Update application
    console.log('Updating application in database...');
    await connection.query(
      `UPDATE electricity_applications 
       SET status = ?, remarks = ?, current_stage = ?, stage_history = ?, 
           reviewed_by = ?, reviewed_at = NOW(),
           completed_at = CASE WHEN ? IN ('approved', 'completed') THEN NOW() ELSE completed_at END
       WHERE id = ?`,
      [status, remarks, current_stage || application.current_stage, JSON.stringify(stageHistory), 
       req.user?.id, status, applicationId]
    );

    // If approved and it's a new connection, create consumer account
    if (status === 'approved' && application.application_type === 'new_connection') {
      try {
        // Parse application_data if it's a string
        const appData = typeof application.application_data === 'string' 
          ? JSON.parse(application.application_data) 
          : application.application_data;
        console.log('Creating consumer account for approved application...');
        
        // Generate consumer number
        const year = new Date().getFullYear();
        const [countResult] = await connection.query(
          'SELECT COUNT(*) as count FROM electricity_consumer_accounts WHERE YEAR(created_at) = ?',
          [year]
        );
        const consumerNumber = `EC${year}${String(countResult[0].count + 1).padStart(6, '0')}`;

        // Insert consumer account
        await connection.query(
          `INSERT INTO electricity_consumer_accounts 
           (user_id, consumer_number, category, tariff_type, sanctioned_load, 
            connection_status, address_line1, address_line2, city, state, pincode)
           VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`,
          [application.user_id || null, consumerNumber, appData.category, appData.tariff_type || 'standard',
           appData.load || appData.sanctioned_load, appData.address_line1 || appData.address, 
           appData.address_line2 || null, appData.city, appData.state, appData.pincode]
        );
        console.log('Consumer account created:', consumerNumber);
      } catch (consumerError) {
        console.error('Error creating consumer account:', consumerError);
        // Don't fail the entire transaction if consumer creation fails
      }
    }

    // Create notification for user (only if user_id exists)
    if (application.user_id) {
      try {
        let notificationMessage = '';
        if (status === 'approved') {
          notificationMessage = `Your application ${application.application_number} has been approved.`;
        } else if (status === 'rejected') {
          notificationMessage = `Your application ${application.application_number} has been rejected. Reason: ${remarks}`;
        } else if (status === 'document_verification') {
          notificationMessage = `Your application ${application.application_number} is under document verification.`;
        } else if (status === 'site_inspection') {
          notificationMessage = `Site inspection scheduled for application ${application.application_number}.`;
        } else if (status === 'work_in_progress') {
          notificationMessage = `Work is in progress for application ${application.application_number}.`;
        } else if (current_stage) {
          notificationMessage = `Your application ${application.application_number} status updated: ${current_stage}`;
        }

        if (notificationMessage) {
          await connection.query(
            `INSERT INTO electricity_notifications (user_id, title, message, type) 
             VALUES (?, ?, ?, ?)`,
            [application.user_id, 'Application Update', notificationMessage, 
             status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info']
          );
          console.log('Notification created for user:', application.user_id);
        }
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Don't fail the entire transaction if notification fails
      }
    } else {
      console.log('No user_id for application, skipping notification');
    }

    await connection.commit();
    console.log('Application updated successfully');

    res.json({ 
      message: 'Application updated successfully',
      stage_history: stageHistory
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update application error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to update application', details: error.message });
  } finally {
    connection.release();
  }
};

// Upload documents for an application
const uploadDocuments = async (req, res) => {
  try {
    const applicationId = req.params.id;
    
    // Get existing documents
    const [applications] = await promisePool.query(
      'SELECT documents FROM electricity_applications WHERE id = ?',
      [applicationId]
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Parse existing documents
    let existingDocuments = [];
    if (applications[0].documents) {
      existingDocuments = typeof applications[0].documents === 'string'
        ? JSON.parse(applications[0].documents)
        : applications[0].documents;
    }

    // Add new documents
    const newDocuments = req.files.map(file => ({
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/uploads/documents/${file.filename}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.user?.id || 'admin'
    }));

    const allDocuments = [...existingDocuments, ...newDocuments];

    // Update database
    await promisePool.query(
      'UPDATE electricity_applications SET documents = ? WHERE id = ?',
      [JSON.stringify(allDocuments), applicationId]
    );

    res.json({
      message: 'Documents uploaded successfully',
      documents: allDocuments
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload documents' });
  }
};

module.exports = {
  getAllApplications,
  updateApplication,
  uploadDocuments
};
