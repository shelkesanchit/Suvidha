const { execSync } = require('child_process');
const path = require('path');

/**
 * Master Setup Script for SUVIDHA Database
 * Runs all migrations and seeds for Electricity, Gas, and Water departments
 */

console.log('='.repeat(60));
console.log('SUVIDHA Database Setup - Full System Initialization');
console.log('='.repeat(60));
console.log();

// First, ensure database exists
try {
  console.log('[•••] Creating database if not exists...');
  console.log('-'.repeat(60));
  const scriptPath = path.join(__dirname, 'create-database.js');
  execSync(`node "${scriptPath}"`, { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Database ready\n');
} catch (error) {
  console.error('❌ Database creation failed');
  console.error(`Error: ${error.message}`);
  process.exit(1);
}

const scripts = [
  { name: 'Electricity Migration', file: 'electricity-migrate.js' },
  { name: 'Electricity Seed Data', file: 'electricity-seed.js' },
  { name: 'Gas Migration', file: 'gas-migrate.js' },
  { name: 'Gas Seed Data', file: 'gas-seed.js' },
  { name: 'Water Migration', file: 'water-migrate.js' },
  { name: 'Water Seed Data', file: 'water-seed.js' }
];

let successCount = 0;
let failCount = 0;

for (const script of scripts) {
  try {
    console.log(`\n[${'•'.repeat(3)}] Running: ${script.name}`);
    console.log('-'.repeat(60));
    
    const scriptPath = path.join(__dirname, script.file);
    execSync(`node "${scriptPath}"`, { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    
    console.log(`✅ ${script.name} - COMPLETED`);
    successCount++;
  } catch (error) {
    console.error(`❌ ${script.name} - FAILED`);
    console.error(`Error: ${error.message}`);
    failCount++;
  }
}

console.log();
console.log('='.repeat(60));
console.log('Setup Summary:');
console.log(`  ✅ Successful: ${successCount}/${scripts.length}`);
console.log(`  ❌ Failed: ${failCount}/${scripts.length}`);
console.log('='.repeat(60));

if (failCount === 0) {
  console.log('\n🎉 All database tables created and seeded successfully!');
  console.log('You can now start the server with: npm start');
} else {
  console.log('\n⚠️  Some scripts failed. Please check the errors above.');
  process.exit(1);
}
