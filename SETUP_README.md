# SUVIDHA Water Department - Complete Setup Guide

## 📋 Project Overview

SUVIDHA is a full-stack water department management system with:
- **Frontend Kiosk**: Public-facing portal for citizens to apply for water connections, pay bills, lodge complaints, and track status
- **Water Admin Panel**: Administrative dashboard for managing applications, complaints, consumers, reports, and tariffs
- **Backend API**: Express.js REST API with MySQL database

---

## 🛠️ Prerequisites

Before starting, ensure you have the following installed:

| Software | Version | Download Link |
|----------|---------|---------------|
| **Node.js** | v18.x or higher | https://nodejs.org/ |
| **MySQL** | v8.0 or higher | https://dev.mysql.com/downloads/mysql/ |
| **Git** | Latest | https://git-scm.com/ |
| **VS Code** (optional) | Latest | https://code.visualstudio.com/ |

### Verify Installation
```bash
node --version       # Should show v18.x.x or higher
npm --version        # Should show 9.x.x or higher
mysql --version      # Should show 8.x.x
```

---

## 📁 Project Structure

```
Suvidha/
├── backend/                    # Express.js Backend API (Port 5000)
│   ├── config/
│   │   └── database.js         # MySQL connection configuration
│   ├── routes/
│   │   └── water/              # Water department API routes
│   │       ├── applications.js # New connection, tracking APIs
│   │       ├── complaints.js   # Complaint submission, tracking APIs
│   │       ├── admin.js        # Admin panel APIs (dashboard, reports)
│   │       └── bills.js        # Bill related APIs
│   ├── scripts/
│   │   ├── water-migrate.js    # Creates database tables
│   │   ├── water-seed.js       # Inserts sample data
│   │   └── clear-water-data.js # Clears all water data (keeps tables)
│   ├── .env.example            # Environment variables template
│   ├── package.json            # Backend dependencies
│   └── server.js               # Main server file
│
├── frontend/                   # Public Kiosk Portal (Port 5173)
│   ├── src/
│   │   ├── components/
│   │   │   └── water/          # Water service components
│   │   │       ├── WaterNewConnectionForm.jsx
│   │   │       ├── WaterComplaintForm.jsx
│   │   │       ├── WaterBillPaymentForm.jsx
│   │   │       └── WaterTrackingForm.jsx
│   │   ├── pages/
│   │   │   └── WaterServicesPage.jsx
│   │   └── utils/
│   │       └── api.js          # API utility
│   ├── package.json            # Frontend dependencies
│   └── vite.config.js          # Vite configuration
│
├── water-admin/                # Admin Dashboard (Port 5176)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── DashboardOverview.jsx
│   │   │   ├── ManageApplications.jsx
│   │   │   ├── ManageComplaints.jsx
│   │   │   ├── ManageConsumers.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── TariffManagement.jsx
│   │   ├── contexts/
│   │   │   └── WaterAuthContext.jsx
│   │   └── utils/
│   │       └── api.js          # Admin API utility
│   ├── package.json            # Admin panel dependencies
│   └── vite.config.js          # Vite configuration
│
├── database/
│   └── water_schema.sql        # Complete SQL schema file
│
├── SETUP_README.md             # This file
└── requirements.txt            # All project dependencies
```

---

## 🗄️ Database Setup

### Step 1: Open MySQL Command Line

```bash
# Windows - Open MySQL Command Line Client
# OR use terminal:
mysql -u root -p
# Enter your MySQL root password when prompted
```

### Step 2: Create Database

```sql
-- Create the database
CREATE DATABASE suvidha CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify database was created
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

### Step 3: Configure Environment Variables

Navigate to the backend folder and create `.env` file:

```bash
cd Suvidha/backend
```

**Create `.env` file with the following content:**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=suvidha
DB_PORT=3306

# JWT Configuration
JWT_SECRET=suvidha_water_secret_key_2024
JWT_EXPIRE=24h

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

> ⚠️ **IMPORTANT**: Replace `YOUR_MYSQL_PASSWORD` with your actual MySQL root password!

---

## 📦 Installation Steps

### Step 1: Install Backend Dependencies

```bash
# Navigate to backend folder
cd Suvidha/backend

# Install all npm packages
npm install
```

### Step 2: Run Database Migration (Create Tables)

```bash
# This creates all water-related tables in the database
node scripts/water-migrate.js
```

**Expected Output:**
```
🌊 WATER DEPARTMENT DATABASE MIGRATION
=====================================

Creating table: water_consumers...
  ✓ water_consumers created successfully
Creating table: water_applications...
  ✓ water_applications created successfully
Creating table: water_complaints...
  ✓ water_complaints created successfully
Creating table: water_bills...
  ✓ water_bills created successfully
Creating table: water_payments...
  ✓ water_payments created successfully
Creating table: water_tariffs...
  ✓ water_tariffs created successfully
Creating table: water_admin_users...
  ✓ water_admin_users created successfully
Creating table: water_settings...
  ✓ water_settings created successfully

✅ All water tables created successfully!
```

### Step 3: Seed Sample Data (Optional but Recommended)

```bash
# This inserts sample data including admin user
node scripts/water-seed.js
```

**Expected Output:**
```
🌊 WATER DEPARTMENT DATABASE SEEDING
=====================================

  ✓ Admin users seeded
  ✓ Tariffs seeded
  ✓ Settings seeded
  ✓ Sample consumers seeded
  ✓ Sample applications seeded
  ✓ Sample complaints seeded
  ✓ Sample bills seeded
  ✓ Sample payments seeded

✅ All water data seeded successfully!

📝 Default Admin Login Credentials:
   Username: water_admin
   Password: admin123
```

### Step 4: Install Frontend Dependencies

```bash
# Open a NEW terminal window
# Navigate to frontend folder
cd Suvidha/frontend

# Install packages
npm install
```

### Step 5: Install Water Admin Panel Dependencies

```bash
# Open a NEW terminal window
# Navigate to water-admin folder
cd Suvidha/water-admin

# Install packages
npm install
```

---

## 🚀 Running the Application

You need **3 terminal windows** to run all parts of the application.

### Terminal 1: Start Backend Server

```bash
cd Suvidha/backend
npm run dev
```

**Expected Output:**
```
🚀 SUVIDHA Backend Server
📡 Running on port 5000
🌍 Environment: development
✓ Database connected successfully
```

> Backend runs on: **http://localhost:5000**

### Terminal 2: Start Frontend Kiosk

```bash
cd Suvidha/frontend
npm run dev
```

**Expected Output:**
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

> Frontend runs on: **http://localhost:5173**

### Terminal 3: Start Water Admin Panel

```bash
cd Suvidha/water-admin
npm run dev
```

**Expected Output:**
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5176/
```

> Admin Panel runs on: **http://localhost:5176**

---

## 🔐 Login Credentials

### Water Admin Panel

| Field | Value |
|-------|-------|
| URL | http://localhost:5176 |
| Username | `water_admin` |
| Password | `admin123` |

---

## 🌐 Application URLs

| Application | URL | Description |
|------------|-----|-------------|
| **Frontend Kiosk** | http://localhost:5173 | Public portal for citizens |
| **Water Services** | http://localhost:5173/water | Water department services |
| **Water Admin** | http://localhost:5176 | Admin dashboard login |
| **Backend API** | http://localhost:5000/api | REST API base URL |

---

## 📡 API Endpoints

### Water Applications API
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/water/applications/submit` | Submit new connection application |
| GET | `/api/water/applications/track/:applicationNumber` | Track application status |

### Water Complaints API
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/water/complaints/submit` | Submit new complaint |
| GET | `/api/water/complaints/track/:complaintNumber` | Track complaint status |

### Water Admin API (Requires Auth Token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/water/admin/login` | Admin login |
| GET | `/api/water/admin/dashboard/stats` | Dashboard statistics |
| GET | `/api/water/admin/applications` | List all applications |
| GET | `/api/water/admin/complaints` | List all complaints |
| GET | `/api/water/admin/consumers` | List all consumers |
| GET | `/api/water/admin/reports` | Generate reports |
| GET | `/api/water/admin/tariffs` | List tariffs |

---

## 🗄️ Database Tables

The following tables are created by the migration script:

| Table Name | Description |
|------------|-------------|
| `water_consumers` | Stores consumer/customer information |
| `water_applications` | Stores new connection applications |
| `water_complaints` | Stores customer complaints |
| `water_bills` | Stores water bills |
| `water_payments` | Stores payment transactions |
| `water_tariffs` | Stores water tariff rates |
| `water_admin_users` | Stores admin user accounts |
| `water_settings` | Stores system settings |

---

## 🔧 Useful Commands

### Clear All Water Data (Keep Tables)
```bash
cd Suvidha/backend
node scripts/clear-water-data.js
```

### Re-seed Sample Data
```bash
cd Suvidha/backend
node scripts/water-seed.js
```

### Check Database Tables in MySQL
```sql
USE suvidha;
SHOW TABLES;
SELECT * FROM water_admin_users;
SELECT * FROM water_applications;
SELECT * FROM water_complaints;
```

---

## ❗ Troubleshooting

### Error: EADDRINUSE (Port already in use)

```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# OR kill all node processes
taskkill /F /IM node.exe
```

### Error: ER_ACCESS_DENIED_ERROR

- Check your MySQL password in `.env` file
- Ensure MySQL service is running

### Error: ECONNREFUSED

- Make sure MySQL server is running
- Check if the database `suvidha` exists

### Frontend not loading data

- Ensure backend is running on port 5000
- Check browser console for CORS errors
- Verify API URL in frontend environment

---

## 📝 Reference Number Formats

| Type | Format | Example |
|------|--------|---------|
| Application | `WNC` + Year + Sequence | WNC2026000001 |
| Complaint | `WCP` + Year + Sequence | WCP2026000001 |
| Consumer | `WC` + Year + Sequence | WC2024000001 |
| Bill | `WB` + Year + Sequence | WB2026000001 |

---

## 👨‍💻 Development Notes

- **Backend**: Express.js with MySQL2 for database operations
- **Frontend**: React 18 + Vite + Material UI
- **Authentication**: JWT tokens (24hr expiry)
- **Auto-refresh**: Admin panel refreshes data every 30 seconds

---

## 📞 Support

For any issues during setup, check:
1. Node.js and MySQL versions
2. Environment variables in `.env` file
3. Database connection and table creation
4. Port availability (5000, 5173, 5176)

---

**Last Updated**: February 2026
