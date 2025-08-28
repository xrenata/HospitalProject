const express = require('express');
const router = express.Router();
const NotificationsController = require('../Controllers/Notifications');

// Get notifications for current user
router.get('/', NotificationsController.getNotifications);

// Mark notification as read
router.patch('/:notificationId/read', NotificationsController.markAsRead);

// Mark all notifications as read for current user
router.patch('/mark-all-read', NotificationsController.markAllAsRead);

// Delete notification (admin only)
router.delete('/:notificationId', NotificationsController.deleteNotification);

// Create notification (admin/system only)
router.post('/', NotificationsController.createNotification);

// Get notification statistics (admin only)
router.get('/stats', NotificationsController.getStats);

module.exports = router;


