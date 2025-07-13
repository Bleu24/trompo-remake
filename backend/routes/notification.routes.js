const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount
} = require('../controllers/notification.controller');
const auth = require('../middleware/auth.middleware');

// Get user notifications
router.get('/', auth, getUserNotifications);

// Get unread count
router.get('/unread-count', auth, getUnreadCount);

// Mark notification as read
router.put('/:notificationId/read', auth, markNotificationAsRead);

// Mark all notifications as read
router.put('/mark-all-read', auth, markAllNotificationsAsRead);

// Delete notification
router.delete('/:notificationId', auth, deleteNotification);

module.exports = router;
