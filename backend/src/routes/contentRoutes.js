const express = require('express');
const auth = require('../middleware/auth');
const {
  getAlerts,
  createAlert,
  getAnnouncements,
  createAnnouncement,
} = require('../controllers/contentController');

const router = express.Router();

router.get('/alerts', getAlerts);
router.post('/alerts', auth, createAlert);

router.get('/announcements', getAnnouncements);
router.post('/announcements', auth, createAnnouncement);

module.exports = router;
