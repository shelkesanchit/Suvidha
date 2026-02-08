# SUVIDHA — Updates & Changelog

> **Smart Urban Virtual Interactive Digital Helpdesk Assistant**
> Self-Service Kiosk System for Utility Services

---

## Version Summary

| Metric | Value |
|--------|-------|
| **Files Modified** | 55 |
| **Files Deleted** | 10 |
| **New Files Added** | 2 |
| **Lines Added** | 2,475+ |
| **Lines Removed** | 3,889 |
| **Departments Affected** | All (Electricity, Water, Gas) |

---

## Git Version History

```
Version 5 │ 540b57c │ Gas Distribution code added (HEAD)
Version 4 │ da38ec1 │ Gas Distribution code added
Version 3 │ 8e13f2e │ suvidha
Version 2 │ 66951ee │ Water Department Module + Admin Panel
Version 1 │ c46da5b │ first commit (Electricity Kiosk)
```

---

## 🔵 What's New in Latest (Local) Version

### 1. Government Services API Integration (NEW)

A complete **Government Services API Gateway** has been added, enabling real-time data fetching from external government utility APIs.

**New Files Created:**
- `backend/routes/governmentServices.js` — 284 lines, 12 REST endpoints
- `backend/utils/governmentServicesAPI.js` — 167 lines, Axios HTTP client

**12 New API Endpoints:**

| # | Endpoint | Description |
|---|----------|-------------|
| 1 | `GET /api/gov-services/water/bills/:consumerId` | Fetch water bills from government DB |
| 2 | `GET /api/gov-services/water/tariff/:state` | State-wise water tariff rates |
| 3 | `GET /api/gov-services/water/states` | Available states for water service |
| 4 | `GET /api/gov-services/gas/prices/:state` | State-wise gas cylinder prices |
| 5 | `GET /api/gov-services/gas/price/:state/:region` | Region-wise gas pricing |
| 6 | `GET /api/gov-services/gas/states` | Available states for gas service |
| 7 | `GET /api/gov-services/electricity/bills/:consumerId` | Fetch electricity bills |
| 8 | `GET /api/gov-services/electricity/categories` | Consumer categories |
| 9 | `GET /api/gov-services/electricity/tariff/:category` | Category-wise electricity tariff |
| 10 | `GET /api/gov-services/all-services/states` | All states across all utilities |
| 11 | `GET /api/gov-services/consumer/:consumerId/history` | Cross-service bill history |
| 12 | `GET /api/gov-services/health` | API health check |

**Technical Details:**
- Connects to an external Dummy API at `http://localhost:8000/api` (configurable via `DUMMY_API_BASE_URL` env var)
- 30-second request timeout (configurable via `API_TIMEOUT`)
- Singleton Axios client with error handling
- Supports state-wise and region-wise tariff lookups

---

### 2. Database Schema Overhaul

The database has been restructured with cleaner table naming and better normalization.

**Table Renames:**

| Old Name (GitHub) | New Name (Current) | Reason |
|--------------------|--------------------|--------|
| `water_admin_users` | `admin_users` | Unified admin table across departments |
| `water_consumers` | `water_customers` | Consistent naming (`customers` convention) |
| `gas_consumers` | `gas_customers` | Consistent naming |
| `gas_bills` | `gas_cylinder_bookings` | More descriptive — reflects actual business logic |

**Column Renames:**

| Old Column | New Column | Table(s) |
|------------|-----------|----------|
| `completed_at` | `payment_date` | Payment tables |
| `status` | `payment_status` | Payment tables |

**New Tables Added:**

| Table | Purpose |
|-------|---------|
| `gas_tariff_rates` | Per-cylinder pricing with subsidy tracking |
| `gas_cylinder_bookings` | LPG cylinder booking management |
| `electricity_customers` | Electricity-specific customer data |
| `electricity_bills` | Electricity billing records |

---

### 3. Consolidated Multi-Department Database

Previously the system used **2 separate databases**:
- `suvidha_db` — for Electricity & Gas
- `suvidha` — for Water Admin

**Current version** consolidates everything into a **single unified schema** (`suvidha_db`) with 29+ tables, eliminating data fragmentation and enabling cross-department queries.

---

### 4. Gas Module Complete Rewrite

The Gas distribution module received a **complete overhaul**:

#### Gas Bills Route (`backend/routes/gas/bills.js`)
- **Before:** Simple CRUD on `gas_bills` table
- **After:** Full cylinder booking system with:
  - City selection → State detection → Region-wise pricing
  - Integration with Government Services API for real-time GAIL prices
  - Subsidy calculation and tracking
  - Delivery type selection (Home Delivery / Self-Pickup)
  - `gas_cylinder_bookings` + `gas_tariff_rates` table queries

#### Gas Cylinder Booking Form (`frontend/src/components/gas/GasCylinderBookingForm.jsx`)
- **New multi-step booking flow:**
  1. **Step 1:** City Selection (with state auto-detection)
  2. **Step 2:** Cylinder type selection (14.2 kg / 5 kg / 19 kg Commercial)
  3. **Step 3:** Delivery method (Home Delivery / Self-Pickup)
  4. **Step 4:** Confirmation with price from GAIL API
- Live price fetching from Government Services API
- Auto-detect state from selected city
- OTP-based verification

#### Gas Admin Panel (`backend/routes/gas/admin.js`)
- 523 lines changed
- Updated all queries to use new table structure (`gas_customers`, `gas_cylinder_bookings`, `gas_tariff_rates`)
- New admin dashboard with cylinder booking statistics

---

### 5. Water Module Improvements

#### Water Admin Routes (`backend/routes/water/admin.js`)
- Migrated from `water_admin_users` → `admin_users`
- Migrated from `water_consumers` → `water_customers`
- 343 lines changed — all SQL queries updated

#### Water Application & Complaint Handling
- Updated `water/applications.js`, `water/complaints.js`, `water/bills.js`, `water/payments.js`
- Aligned with unified admin_users table

---

### 6. Electricity Kiosk Enhancements

#### Bill Payment Form (`frontend/src/components/kiosk/BillPaymentForm.jsx`)
- **Added:** New `/bills/electricity/:customerId` endpoint integration
- **Added:** 215+ lines — electricity-specific bill fetching from government API
- Auto-calculate outstanding amounts

#### All 12 Kiosk Components Updated:
| Component | Changes |
|-----------|---------|
| `BillCalculator.jsx` | Updated calculation logic |
| `BillPaymentForm.jsx` | +215 lines, electricity API integration |
| `CategoryChangeForm.jsx` | UI improvements |
| `ComplaintForm.jsx` | Updated API calls |
| `LoadChangeForm.jsx` | Updated API calls |
| `MeterReadingForm.jsx` | Updated API calls |
| `NameChangeForm.jsx` | Updated API calls |
| `NewConnectionForm.jsx` | Updated API calls |
| `PrepaidRechargeForm.jsx` | Updated API calls |
| `ReconnectionForm.jsx` | Updated API calls |
| `SolarRooftopForm.jsx` | Updated API calls |
| `TrackingForm.jsx` | Updated API calls |

---

### 7. Backend Server Improvements

#### Enhanced Health Check (`GET /health`)
- **Before:** Simple `{ status: 'ok' }`
- **After:** Full health check with:
  - Database connectivity test (MySQL ping)
  - Environment info
  - Timestamp
  - Uptime monitoring

#### New Route Mount
```
app.use('/api/gov-services', require('./routes/governmentServices'))
```

#### New npm Scripts (`backend/package.json`)
| Script | Command | Purpose |
|--------|---------|---------|
| `test` | `echo "Error: no test specified"` | Test placeholder |
| `start:all` | Combined startup | Start all services |
| `db:setup` | `node scripts/setup-database.js` | Database setup |
| `db:seed` | `node scripts/seed-database.js` | Seed data |
| `db:migrate` | `node scripts/migrate.js` | Run migrations |
| `water:migrate` | `node scripts/water-migrate.js` | Water migration |
| `water:seed` | `node scripts/water-seed.js` | Water seed data |

---

### 8. Admin Panel Updates

#### Electricity Admin (`admin/`)
- `App.jsx` — Route structure updated
- `AdminDashboard.jsx` — Dashboard layout changes
- `AdminOverview.jsx` — Statistics API calls updated
- `LoginPage.jsx` — Auth flow improvements
- `ManageApplications.jsx` — Application management updated

#### Application Controller (`backend/admin/controllers/applicationController.js`)
- 247 lines changed
- Updated queries for unified table structure

#### All Admin Controllers Updated:
- `complaintController.js` — Complaint management
- `consumerController.js` — Consumer data queries
- `dashboardController.js` — Dashboard statistics
- `reportController.js` — Report generation

---

### 9. Code Cleanup — Files Removed

The following files were removed to clean up the codebase:

| File Removed | Reason |
|-------------|--------|
| `SETUP_README.md` (458 lines) | Documentation consolidated elsewhere |
| `backend/scripts/check-apps.js` | Utility no longer needed |
| `backend/scripts/clear-water-data.js` | One-time script removed |
| `backend/scripts/fix-dob-column.js` | Migration fix no longer needed |
| `database/gas_lpg_migration.sql` | Migration applied, script removed |
| `database/water_schema.sql` | Consolidated into `suvidha_db.sql` |
| `frontend/src/components/gas/GasNewConnectionForm.jsx.bak` | Backup file cleaned up |
| `water-admin/database/update_complaints_schema.sql` | Migration applied |
| `water-admin/database/verify_complaints.sql` | Verification script removed |
| `water-admin/database/water_schema.sql` (539 lines) | Consolidated into main SQL |

---

### 10. Cross-cutting Improvements

| Area | Improvement |
|------|-------------|
| **Security** | Helmet.js headers, rate limiting (100 req/15min), JWT auth |
| **Error Handling** | Global error handler with stack traces in dev mode |
| **Compression** | Response compression via `compression` middleware |
| **Logging** | Morgan HTTP logging (dev/combined modes) |
| **CORS** | Multi-origin support for all 5 frontend apps |
| **File Uploads** | Multer with 10MB limit, 10 files max per request |
| **Static Files** | Served from `/uploads` directory |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUVIDHA SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────┐ ┌───────────┐ │
│  │  Frontend    │ │  Admin Panel │ │Water Admin│ │ Gas Admin │ │
│  │  (React)     │ │  (React)     │ │ (React)   │ │ (React)   │ │
│  │  Port: 5173  │ │  Port: 5174  │ │Port: 5176 │ │Port: 5177 │ │
│  └──────┬───────┘ └──────┬───────┘ └─────┬─────┘ └─────┬─────┘ │
│         │                │               │              │       │
│         └────────────────┴───────┬───────┴──────────────┘       │
│                                  │                              │
│                          ┌───────▼───────┐                      │
│                          │  Express.js   │                      │
│                          │  Backend API  │                      │
│                          │  Port: 5000   │                      │
│                          └───┬───────┬───┘                      │
│                              │       │                          │
│               ┌──────────────┘       └──────────────┐           │
│               ▼                                     ▼           │
│     ┌──────────────────┐                ┌───────────────────┐   │
│     │   MySQL 8.0      │                │ Gov Services API  │   │
│     │   suvidha_db     │                │ (Dummy API)       │   │
│     │   29+ Tables     │                │ Port: 8000        │   │
│     └──────────────────┘                └───────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 18.2.0 |
| **UI Library** | Material-UI (MUI) | 5.15.0 |
| **Routing** | React Router | 6.21.0 |
| **Build Tool** | Vite | 7.3.1 |
| **Backend** | Express.js | 4.18.2 |
| **Database** | MySQL | 8.0 |
| **Auth** | JSON Web Tokens | 9.0.2 |
| **Payments** | Razorpay | 2.9.2 |
| **HTTP Client** | Axios | 1.6.2 |
| **File Uploads** | Multer | 1.4.5 |
| **Password Hashing** | bcryptjs | 2.4.3 |

---

## Environment Variables Required

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=suvidha_db
DB_PORT=3306

# Authentication
JWT_SECRET=your_secret_key
JWT_EXPIRE=24h

# Government Services API (NEW)
DUMMY_API_BASE_URL=http://localhost:8000/api
API_TIMEOUT=30000
```

---

## Conclusion

The latest version represents a **major evolution** from the initial GitHub codebase:

1. **Government API Gateway** — 12 new endpoints for real-time tariff/pricing data
2. **Unified Database** — Single schema replacing fragmented per-department databases
3. **Gas Module Rewrite** — From simple bills to full cylinder booking with GAIL integration
4. **Better DevOps** — npm scripts for DB setup, migration, seeding
5. **Code Cleanup** — 10 obsolete files removed, 3,889 lines of dead code eliminated
6. **Enhanced Server** — Better health checks, new route mounts, improved error handling

---

*Document generated: February 2026*
*Project: SUVIDHA — C-DAC Smart City 2.0 Initiative*
