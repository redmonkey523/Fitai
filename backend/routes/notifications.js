const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { NotificationSettings } = require('../models/Notification');

// POST /api/notifications/registerToken - store device push token
router.post('/registerToken', authenticateToken, async (req, res) => {
  try {
    const { token, platform = 'web', deviceId = null } = req.body || {};
    if (!token) {
      return res.status(400).json({ success: false, message: 'token is required' });
    }
    const settings = await NotificationSettings.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { 'push.enabled': true, 'push.token': token, 'push.platform': platform, 'push.deviceId': deviceId, 'push.lastSeen': new Date() } },
      { new: true, upsert: true }
    );
    return res.json({ success: true, data: { token: settings?.push?.token, platform: settings?.push?.platform } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to register token', error: e.message });
  }
});

// POST /api/notifications/test - send a test push via Expo (best-effort)
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const settings = await NotificationSettings.findOne({ userId: req.user.id }).lean();
    const expoToken = settings?.push?.token;
    if (!expoToken) return res.status(400).json({ success: false, message: 'No push token registered' });
    const body = {
      to: expoToken,
      sound: 'default',
      title: 'Test Notification',
      body: 'Push is wired up! 🎉',
      data: { type: 'test' }
    };
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch {}
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to send test notification' });
  }
});

module.exports = router;


