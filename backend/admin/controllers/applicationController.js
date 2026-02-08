const { promisePool } = require('../../config/database');

// Get all applications
const getAllApplications = async (req, res) => {
  try {
    const { application_status, service_type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Query using correct column names from actual database schema
    let query = `
      SELECT id, application_number, applicant_name, email, mobile, 
             application_type, service_type, application_status,
             address, city, state, pincode,
             documents, application_data, remarks, submitted_at, processed_at
      FROM applications
      WHERE 1=1
    `;
    const params = [];

    if (application_status) {
      query += ' AND application_status = ?';
      params.push(application_status);
    }

    if (service_type) {
      query += ' AND service_type = ?';
      params.push(service_type);
    }

    query += ' ORDER BY submitted_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    console.log('Fetching applications with query:', query);
    console.log('Query params:', params);

    const [applications] = await promisePool.query(query, params);

    console.log('Found applications:', applications.length);

    // Parse JSON fields if needed
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
    console.error('Error stack:', error.stack);
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

    const { application_status, remarks } = req.body;
    const applicationId = req.params.id;

    console.log('Updating application:', applicationId, 'with status:', application_status);

    // Get application details
    const [applications] = await connection.query(
      'SELECT * FROM applications WHERE id = ?',
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
    console.log('Found application:', application.application_number, 'current status:', application.application_status);

    let generatedCustomerId = null;

    // If approving a new_connection application, generate customer ID and create customer record
    if (application_status === 'approved' && application.application_type === 'new_connection') {
      const year = new Date().getFullYear();
      const prefix = `EC${year}`;
      
      // Get the max existing customer ID to derive next sequence number
      const [maxResult] = await connection.query(
        `SELECT MAX(id) as max_id FROM electricity_customers WHERE id LIKE ?`,
        [`${prefix}%`]
      );
      
      let nextSeq = 1;
      if (maxResult[0].max_id) {
        const currentSeq = parseInt(maxResult[0].max_id.replace(prefix, ''), 10);
        nextSeq = currentSeq + 1;
      }
      
      // Generate customer ID like "EC2026000001"
      const sequenceNumber = String(nextSeq).padStart(6, '0');
      generatedCustomerId = `${prefix}${sequenceNumber}`;
      
      console.log('Generated customer ID:', generatedCustomerId);

      // Create customer record in electricity_customers table
      try {
        await connection.query(
          `INSERT INTO electricity_customers 
           (id, consumer_id, full_name, mobile, email, state, city, pincode, address, connection_status, connection_date, is_verified)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), 1)`,
          [
            generatedCustomerId,
            generatedCustomerId,
            application.applicant_name,
            application.mobile,
            application.email,
            application.state || 'Maharashtra',
            application.city,
            application.pincode,
            application.address,
          ]
        );
        console.log('Customer record created:', generatedCustomerId);
      } catch (err) {
        console.error('Error creating customer record:', err);
        throw err;
      }
    }

    // Update application using correct column name: application_status (not status)
    // Use processed_at for the update timestamp
    console.log('Updating application in database...');
    let updateQuery = `UPDATE applications SET application_status = ?, remarks = ?, processed_at = NOW()`;
    let updateParams = [application_status, remarks || null];
    
    // If we generated a customer ID, include it in remarks
    if (generatedCustomerId) {
      updateQuery = `UPDATE applications SET application_status = ?, remarks = CONCAT(?, '\\nCustomer ID: ${generatedCustomerId}'), processed_at = NOW()`;
      updateParams = [application_status, remarks || 'Approved - Connection granted'];
    }
    
    updateQuery += ' WHERE id = ?';
    updateParams.push(applicationId);
    
    await connection.query(updateQuery, updateParams);

    await connection.commit();
    console.log('Application updated successfully');

    res.json({ 
      success: true,
      message: 'Application updated successfully',
      data: {
        id: applicationId,
        application_status: application_status,
        customer_id: generatedCustomerId,
        applicant_email: application.email,
        applicant_name: application.applicant_name

      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Update application error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update application', 
      message: error.message 
    });
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
      'SELECT documents FROM applications WHERE id = ?',
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
      'UPDATE applications SET documents = ? WHERE id = ?',
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
