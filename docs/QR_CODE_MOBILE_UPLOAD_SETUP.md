# QR Code Mobile Upload - Setup Guide

This guide explains how to set up the QR code-based document upload feature in the Electricity Department's New Connection workflow.

## Overview

The QR code feature allows users at kiosk terminals to upload documents from their mobile phones by scanning a QR code. This is particularly useful when:
- Users have documents saved on their phones
- Users want to take photos of physical documents using their phone camera
- The kiosk doesn't have a scanner or camera

## How It Works

1. User reaches the **Documents Upload** step (Step 4) in the New Connection form
2. For each document, user can click **"Upload via Mobile QR"**
3. System generates a unique, session-based QR code with a 10-minute expiry
4. User scans QR code with their phone camera
5. Phone opens a mobile-friendly upload page
6. User takes a photo or selects a file (max 5MB)
7. File is securely uploaded and linked to the current session
8. Kiosk screen automatically updates to show the uploaded document
9. Session expires after upload or timeout (10 minutes)

## Network Access Modes

### Mode 1: Same Network (LAN) - Default

By default, the QR code URL uses the kiosk's LAN IP address. This works when:
- User's phone is connected to the **same WiFi network** as the kiosk
- Common in offices, government buildings with shared WiFi

**No additional setup required** - works out of the box.

### Mode 2: Any Network (Internet) - Requires Tunneling

To allow uploads from any network (mobile data, different WiFi), you need to expose the local server to the internet using a tunneling service.

## Setting Up Ngrok (Recommended)

### Step 1: Install Ngrok

**Windows:**
```bash
# Using Chocolatey
choco install ngrok

# Or download from https://ngrok.com/download
```

**macOS:**
```bash
brew install ngrok
```

**Linux:**
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

### Step 2: Sign Up and Authenticate

1. Create a free account at https://ngrok.com
2. Get your authtoken from the dashboard
3. Configure ngrok:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 3: Start the Tunnel

You need to tunnel BOTH the frontend and backend:

**Option A: Single tunnel (if using same-origin deployment)**
```bash
# Tunnel the frontend (which proxies API calls to backend)
ngrok http 3000
```

**Option B: Multiple tunnels (recommended)**

Create an ngrok configuration file (`ngrok.yml`):
```yaml
version: "2"
tunnels:
  frontend:
    proto: http
    addr: 3000
  backend:
    proto: http
    addr: 5000
```

Run:
```bash
ngrok start --all
```

### Step 4: Configure Environment Variable

1. Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok-free.app`)
2. Add to your backend `.env` file:

```env
EXTERNAL_URL=https://abc123.ngrok-free.app
```

3. Restart the backend server

### Step 5: Verify Setup

1. Open the New Connection form on the kiosk
2. Go to the Documents Upload step
3. Click "Upload via Mobile QR" for any document
4. You should see a green badge: **"Works from any network"**
5. The QR code URL should show your ngrok domain

## Alternative Tunneling Services

### Cloudflare Tunnel (Free, No URL changes)

```bash
# Install cloudflared
# Create tunnel at https://dash.cloudflare.com > Zero Trust > Tunnels

cloudflared tunnel run your-tunnel-name
```

Set `EXTERNAL_URL=https://your-subdomain.your-domain.com`

### LocalTunnel (Simple, Free)

```bash
npm install -g localtunnel
lt --port 3000
```

Set `EXTERNAL_URL` to the provided URL.

## Security Considerations

1. **Session Tokens**: Each QR code contains a cryptographically random 64-character token
2. **Session Expiry**: Sessions automatically expire after 10 minutes
3. **Single Use**: Once a file is uploaded, the session is consumed and cannot be reused
4. **Size Limits**: Maximum file size is 5MB
5. **CORS Protection**: Only allowed origins can make API requests

## Troubleshooting

### QR Code Shows "Same WiFi required" Even After Setting EXTERNAL_URL

1. Ensure `EXTERNAL_URL` is set in the **backend** `.env` file
2. Restart the backend server after changing `.env`
3. Check backend logs for: `QR Session created with tunnel URL: ...`

### Mobile Upload Fails with Network Error

1. Verify the ngrok tunnel is still running
2. Free ngrok URLs change each restart - update `EXTERNAL_URL`
3. Check if ngrok rate limits have been reached (free tier has limits)

### Upload Times Out

1. Check if the session expired (10 minute limit)
2. Ensure the kiosk browser tab is still open (it polls for upload completion)
3. File size might be too large (max 5MB)

### Mobile Page Shows "Session Expired"

1. QR codes expire after 10 minutes
2. Each QR code can only be used once
3. Generate a new QR code from the kiosk

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        KIOSK (Desktop)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  New Connection Form → Step 4: Documents Upload             ││
│  │  ┌─────────────────┐                                        ││
│  │  │ Upload Document │  [Choose File]  [Upload via Mobile QR] ││
│  │  └─────────────────┘                           │            ││
│  │                                                ▼            ││
│  │                                    ┌────────────────┐       ││
│  │                                    │   QR Code      │       ││
│  │                                    │   [▓▓▓▓▓▓▓▓]   │       ││
│  │                                    │   [▓▓▓▓▓▓▓▓]   │       ││
│  │                                    └────────────────┘       ││
│  │                                    Polls every 2s ──────────┤│
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ QR URL
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NGROK TUNNEL                                │
│   https://abc123.ngrok-free.app → localhost:3000               │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ User scans QR
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MOBILE PHONE (Any Network)                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           SUVIDHA - Document Upload Portal                  ││
│  │                                                              ││
│  │              Upload: Identity Proof                          ││
│  │                                                              ││
│  │         ┌────────────────────────┐                          ││
│  │         │     📷 Take Photo      │                          ││
│  │         └────────────────────────┘                          ││
│  │         ┌────────────────────────┐                          ││
│  │         │  📁 Choose from Files  │                          ││
│  │         └────────────────────────┘                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Upload via API
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                             │
│  - Receives file via /api/electricity/mobile-upload/upload     │
│  - Links file to session token                                 │
│  - Kiosk poll receives file data                               │
│  - Session is consumed/deleted                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Files Modified

| File | Purpose |
|------|---------|
| `backend/routes/electricity/mobileUpload.js` | Session management, QR URL generation |
| `backend/server.js` | CORS configuration for tunnel URLs |
| `frontend/src/components/electricity/QrUploadButton.jsx` | QR code display, polling, status indicators |
| `frontend/src/pages/electricity/MobileUploadPage.jsx` | Mobile upload interface |
| `frontend/src/components/municipal/DocUpload.jsx` | Document upload component with QR option |
