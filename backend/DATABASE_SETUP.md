# Database Setup Guide

## Quick Start (Recommended)

Run the complete database setup with a single command:

```bash
npm run setup
```

This will automatically:
1. Create the database `suvidha_db` (if it doesn't exist)
2. Create all database tables for Electricity, Gas, and Water departments
3. Insert sample data for testing

---

## Individual Scripts

### Create Database Only
```bash
npm run db:create
```

### Run All Migrations (Create Tables Only)
```bash
npm run db:migrate:all
```

### Run All Seeds (Insert Sample Data)
```bash
npm run db:seed:all
```

---

## Department-Specific Scripts

### Electricity Department
```bash
# Create tables
npm run db:migrate:electricity

# Insert sample data
npm run db:seed:electricity
```

### Gas Department
```bash
# Create tables
npm run db:migrate:gas

# Insert sample data
npm run db:seed:gas
```

### Water Department
```bash
# Create tables
npm run db:migrate:water

# Insert sample data
npm run db:seed:water
```

---

## Script Files

All scripts are located in the `backend/scripts/` folder:

- **create-database.js** - Creates the suvidha_db database
- **electricity-migrate.js** - Creates electricity department tables
- **electricity-seed.js** - Inserts electricity sample data
- **gas-migrate.js** - Creates gas/LPG department tables
- **gas-seed.js** - Inserts gas sample data
- **water-migrate.js** - Creates water department tables
- **water-seed.js** - Inserts water sample data
- **setup-all.js** - Master script that runs all migrations and seeds

---

## Database Configuration

Ensure your `.env` file has the correct database credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=suvidha_db
DB_PORT=3306
```

**Note:** The database name must be `suvidha_db`. The setup script will create it automatically.

---

## Troubleshooting

### Access denied error?
Make sure your `.env` file has the correct `DB_PASSWORD` set.

### Connection refused?
Ensure MySQL server is running:
```bash
# Windows
net start MySQL80

# Or check MySQL service in Services app
```

### Want to reset everything?
Drop and recreate the database:
```sql
DROP DATABASE IF EXISTS suvidha_db;
```
Then run `npm run setup` again.
