const { promisePool } = require('../../config/database');

const getAllApplications = async (req, res) => {
  try {
    const { status: filterStatus, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // First get IDs only with ORDER BY to avoid sort memory issues with large JSON columns
    let idQuery = `
      SELECT a.id
      FROM electricity_applications a
      WHERE 1=1
    `;
    const params = [];

    if (filterStatus) {
      idQuery += ' AND a.status = ?';
      params.push(filterStatus);
    }

    idQuery += ' ORDER BY a.submitted_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [idResults] = await promisePool.query(idQuery, params);
    
    if (idResults.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0
        }
      });
    }

    // Then fetch full details for those IDs only
    const ids = idResults.map(row => row.id);
    const [applications] = await promisePool.query(`
      SELECT a.id, a.application_number, a.user_id, a.application_type, a.status,
             a.application_data, a.documents, a.remarks, a.submitted_at, a.reviewed_at, a.completed_at,
             u.full_name as user_name, u.email as user_email, u.phone as user_phone
      FROM electricity_applications a
      LEFT JOIN electricity_users u ON a.user_id = u.id
      WHERE a.id IN (?)
      ORDER BY a.submitted_at DESC
    `, [ids]);

    // Parse JSON fields
    const parsedApplications = applications.map(app => {
      try {
        return {
          ...app,
          documents: app.documents ? (typeof app.documents === 'string' ? JSON.parse(app.documents) : app.documents) : [],
          application_data: app.application_data ? (typeof app.application_data === 'string' ? JSON.parse(app.application_data) : app.application_data) : null
        };
      } catch (parseError) {
        console.error('Error parsing application data:', parseError, 'for app:', app.id);
        return {
          ...app,
          documents: [],
          application_data: null
        };
      }
    });

    res.json({
      success: true,
      data: parsedApplications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parsedApplications.length
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch applications',
      message: error.message 
    });
  }
};

// Update application status
const updateApplication = async (req, res) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const { status: newStatus, remarks } = req.body;
    const applicationId = req.params.id;

    // Get application details
    const [applications] = await connection.query(
      'SELECT * FROM electricity_applications WHERE id = ?',
      [applicationId]
    );

    if (applications.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false,
        error: 'Application not found' 
      });
    }

    const application = applications[0];
    
    // Parse application_data if it's a string
    const appData = typeof application.application_data === 'string' 
      ? JSON.parse(application.application_data) 
      : application.application_data;

    // Update application
    await connection.query(
      'UPDATE electricity_applications SET status = ?, remarks = ?, reviewed_at = NOW() WHERE id = ?',
      [newStatus, remarks || null, applicationId]
    );

    await connection.commit();

    res.json({ 
      success: true,
      message: 'Application updated successfully',
      data: {
        id: applicationId,
        status: newStatus
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update application error:', error);
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
      return res.status(404).json({ 
        success: false,
        error: 'Application not found' 
      });
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
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        documents: allDocuments
      }
    });
  } catch (error) {
    console.error('Upload documents error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to upload documents',
      message: error.message 
    });
  }
};

module.exports = {
  getAllApplications,
  updateApplication,
  uploadDocuments
};
