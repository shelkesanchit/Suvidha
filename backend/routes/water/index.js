const express = require('express');
const router = express.Router();

// Water Routes
router.use('/applications', require('./applications'));
router.use('/complaints', require('./complaints'));
router.use('/bills', require('./bills'));
router.use('/payments', require('./payments'));
router.use('/admin', require('./admin'));

module.exports = router;
