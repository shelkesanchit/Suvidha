const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('\n✅ Connected to database\n');

    const [apps] = await conn.query(`
      SELECT 
        id, 
        application_number, 
        application_type, 
        status, 
        current_stage, 
        submitted_at,
        JSON_UNQUOTE(JSON_EXTRACT(application_data, '$.full_name')) as applicant_name,
        JSON_UNQUOTE(JSON_EXTRACT(application_data, '$.email')) as applicant_email,
        JSON_UNQUOTE(JSON_EXTRACT(application_data, '$.phone')) as applicant_phone
      FROM applications 
      ORDER BY submitted_at DESC
    `);

    console.log('📋 APPLICATIONS IN DATABASE:\n');
    if (apps.length === 0) {
      console.log('⚠️  No applications found. Submit a new application from the kiosk!\n');
    } else {
      apps.forEach(app => {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🆔 ID: ${app.id}`);
        console.log(`📄 Application Number: ${app.application_number}`);
        console.log(`📝 Type: ${app.application_type.replace(/_/g, ' ').toUpperCase()}`);
        console.log(`📊 Status: ${app.status.toUpperCase()}`);
        console.log(`🎯 Current Stage: ${app.current_stage || 'N/A'}`);
        console.log(`👤 Applicant: ${app.applicant_name || 'N/A'}`);
        console.log(`📧 Email: ${app.applicant_email || 'N/A'}`);
        console.log(`📞 Phone: ${app.applicant_phone || 'N/A'}`);
        console.log(`📅 Submitted: ${new Date(app.submitted_at).toLocaleString()}`);
      });
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      console.log(`\n✅ Total: ${apps.length} application(s)\n`);
    }

    await conn.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
