const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const os = require('os');

// Detect the machine's LAN IPv4 (first non-loopback)
function getLanIp() {
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const net of iface) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost'; // fallback
}

// In-memory session store: token -> { docKey, docLabel, expiresAt, file }
const sessions = new Map();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, s] of sessions.entries()) {
    if (now > s.expiresAt) sessions.delete(token);
  }
}, 5 * 60 * 1000);

// POST /create-session  { docKey, docLabel }
router.post('/create-session', (req, res) => {
  const { docKey, docLabel } = req.body;
  if (!docKey) return res.status(400).json({ error: 'docKey is required' });

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    docKey,
    docLabel: docLabel || 'Document',
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    file: null,
  });

  const frontendPort = process.env.FRONTEND_PORT || 3000;
  const lanIp = getLanIp();
  const qrUrl = `http://${lanIp}:${frontendPort}/mobile-upload/${token}`;

  res.json({ token, qrUrl });
});

// GET /info/:token  — used by mobile page to display document name
router.get('/info/:token', (req, res) => {
  const session = sessions.get(req.params.token);
  if (!session || Date.now() > session.expiresAt) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }
  res.json({ docKey: session.docKey, docLabel: session.docLabel });
});

// GET /status/:token  — polled by desktop; consumes session on success
router.get('/status/:token', (req, res) => {
  const session = sessions.get(req.params.token);
  if (!session || Date.now() > session.expiresAt) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }
  if (session.file) {
    const fileData = { ...session.file };
    sessions.delete(req.params.token);
    return res.json({ ready: true, file: fileData });
  }
  res.json({ ready: false });
});

// POST /upload/:token  { name, type, size, data (base64) }
router.post('/upload/:token', (req, res) => {
  const session = sessions.get(req.params.token);
  if (!session || Date.now() > session.expiresAt) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }
  const { name, type, size, data } = req.body;
  if (!data || typeof data !== 'string') {
    return res.status(400).json({ error: 'No file data provided' });
  }
  // Base64 of 5MB raw ≈ 6.7MB string — reject anything over 8MB string length
  if (data.length > 8 * 1024 * 1024) {
    return res.status(413).json({ error: 'File too large (max 5MB)' });
  }
  session.file = {
    name: name || 'upload',
    type: type || 'application/octet-stream',
    size: size || 0,
    data,
  };
  res.json({ success: true });
});

module.exports = router;
