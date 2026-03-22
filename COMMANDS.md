# SUVIDHA - Quick Commands

## Install

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install

# Admin
cd admin
npm install
```

## Run

```bash
# Backend (Terminal 1)
cd backend
npm start

# Frontend (Terminal 2)
cd frontend
npm run dev

# Admin (Terminal 3)
cd admin
npm run dev
```

## Database Setup

```bash
cd backend
node scripts/electricity-migrate.js
node scripts/water-migrate.js
node scripts/gas-migrate.js
node scripts/municipal-migrate.js
```

## Sample Data

```bash
cd backend
node scripts/seed-electricity-sample-data.js
```

## Ngrok Setup

```bash
# 1. Install ngrok
choco install ngrok
# OR download from https://ngrok.com/download

# 2. Add auth token (get from ngrok.com dashboard)
ngrok config add-authtoken YOUR_TOKEN_HERE

# 3. Run tunnel for backend
ngrok http 5000

# 4. Update frontend/.env with ngrok URL
VITE_API_URL=https://xxxx.ngrok-free.app/api
```

## URLs

```
Backend:  http://localhost:5000
Frontend: http://localhost:5173
Admin:    http://localhost:5174
```
