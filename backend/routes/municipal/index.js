const express = require('express');
const router = express.Router();

// Municipal Corporation Routes
router.use('/applications', require('./applications'));
router.use('/complaints', require('./complaints'));
router.use('/bills', require('./bills'));
router.use('/payments', require('./payments'));
router.use('/certificates', require('./certificates'));
router.use('/admin', require('./admin'));

module.exports = router;
