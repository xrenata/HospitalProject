const { Notification, Staff } = require('../Modules/Database/models');

class NotificationsController {
    // Get notifications for a user
    async getNotifications(req, res) {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;
            const userDepartmentId = req.user.departmentId;
            
            const {
                page = 1,
                limit = 10,
                filter = 'all', // all, unread, critical
                category,
                type
            } = req.query;

            const skip = (page - 1) * limit;

            // Build query to find notifications targeted to this user
            const query = {
                $or: [
                    { targetUsers: userId },
                    { targetRoles: userRole },
                    { targetDepartments: userDepartmentId },
                    { targetUsers: { $size: 0 }, targetRoles: { $size: 0 }, targetDepartments: { $size: 0 } } // Global notifications
                ],
                $and: [
                    { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] } // Not expired
                ]
            };

            // Apply filters
            if (filter === 'unread') {
                query['readBy.userId'] = { $ne: userId };
            } else if (filter === 'critical') {
                query.type = 'critical';
            }

            if (category) {
                query.category = category;
            }

            if (type) {
                query.type = type;
            }

            const notifications = await Notification.find(query)
                .populate('sender.userId', 'name role')
                .populate('targetUsers', 'name role')
                .populate('targetDepartments', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const totalCount = await Notification.countDocuments(query);

            // Get unread count
            const unreadQuery = {
                ...query,
                'readBy.userId': { $ne: userId }
            };
            delete unreadQuery.$and; // Remove expiry filter for unread count
            const unreadCount = await Notification.countDocuments(unreadQuery);

            // Format notifications for frontend
            const formattedNotifications = notifications.map(notification => {
                const isReadByUser = notification.readBy.some(
                    read => read.userId.toString() === userId.toString()
                );

                return {
                    id: notification._id.toString(),
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    priority: notification.priority,
                    category: notification.category,
                    isRead: isReadByUser,
                    sender: notification.sender,
                    data: notification.data,
                    actionUrl: notification.actionUrl,
                    timestamp: notification.createdAt.toISOString(),
                    expiresAt: notification.expiresAt?.toISOString()
                };
            });

            res.status(200).json({
                alerts: formattedNotifications,
                totalCount,
                unreadCount,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(totalCount / limit)
                }
            });

        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({
                error: 'Bildirimler yüklenirken bir hata oluştu',
                details: error.message
            });
        }
    }

    // Mark notification as read
    async markAsRead(req, res) {
        try {
            const { notificationId } = req.params;
            const userId = req.user.id;

            const notification = await Notification.findById(notificationId);
            if (!notification) {
                return res.status(404).json({
                    error: 'Bildirim bulunamadı'
                });
            }

            await notification.markAsRead(userId);

            res.status(200).json({
                message: 'Bildirim okundu olarak işaretlendi'
            });

        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({
                error: 'Bildirim işaretlenirken bir hata oluştu',
                details: error.message
            });
        }
    }

    // Mark all notifications as read for user
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;
            const userDepartmentId = req.user.departmentId;

            // Find all unread notifications for this user
            const query = {
                $or: [
                    { targetUsers: userId },
                    { targetRoles: userRole },
                    { targetDepartments: userDepartmentId },
                    { targetUsers: { $size: 0 }, targetRoles: { $size: 0 }, targetDepartments: { $size: 0 } }
                ],
                'readBy.userId': { $ne: userId }
            };

            const notifications = await Notification.find(query);

            // Mark each notification as read
            for (const notification of notifications) {
                await notification.markAsRead(userId);
            }

            res.status(200).json({
                message: `${notifications.length} bildirim okundu olarak işaretlendi`
            });

        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({
                error: 'Bildirimler işaretlenirken bir hata oluştu',
                details: error.message
            });
        }
    }

    // Delete notification (admin only)
    async deleteNotification(req, res) {
        try {
            const { notificationId } = req.params;

            const notification = await Notification.findByIdAndDelete(notificationId);
            if (!notification) {
                return res.status(404).json({
                    error: 'Bildirim bulunamadı'
                });
            }

            res.status(200).json({
                message: 'Bildirim silindi'
            });

        } catch (error) {
            console.error('Error deleting notification:', error);
            res.status(500).json({
                error: 'Bildirim silinirken bir hata oluştu',
                details: error.message
            });
        }
    }

    // Create notification (admin/system only)
    async createNotification(req, res) {
        try {
            const {
                title,
                message,
                type = 'info',
                priority = 'medium',
                category,
                targetUsers = [],
                targetRoles = [],
                targetDepartments = [],
                data,
                actionUrl,
                expiresAt
            } = req.body;

            const senderId = req.user.id;
            const senderInfo = await Staff.findById(senderId);

            const notification = new Notification({
                title,
                message,
                type,
                priority,
                category,
                targetUsers,
                targetRoles,
                targetDepartments,
                sender: {
                    userId: senderId,
                    name: senderInfo?.name || 'Sistem',
                    role: senderInfo?.role || 'Admin',
                    system: !senderInfo
                },
                data,
                actionUrl,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined
            });

            await notification.save();

            res.status(201).json({
                message: 'Bildirim oluşturuldu',
                notification: {
                    id: notification._id.toString(),
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    priority: notification.priority,
                    category: notification.category
                }
            });

        } catch (error) {
            console.error('Error creating notification:', error);
            res.status(500).json({
                error: 'Bildirim oluşturulurken bir hata oluştu',
                details: error.message
            });
        }
    }

    // Get notification stats (admin dashboard)
    async getStats(req, res) {
        try {
            const totalNotifications = await Notification.countDocuments();
            const unreadNotifications = await Notification.countDocuments({
                isRead: false
            });
            const criticalNotifications = await Notification.countDocuments({
                type: 'critical'
            });
            const expiredNotifications = await Notification.countDocuments({
                expiresAt: { $lt: new Date() }
            });

            // Notifications by category
            const categoryStats = await Notification.aggregate([
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 },
                        unread: {
                            $sum: {
                                $cond: [{ $eq: ['$isRead', false] }, 1, 0]
                            }
                        }
                    }
                }
            ]);

            // Recent activity (last 24 hours)
            const recentActivity = await Notification.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });

            res.status(200).json({
                total: totalNotifications,
                unread: unreadNotifications,
                critical: criticalNotifications,
                expired: expiredNotifications,
                recent24h: recentActivity,
                byCategory: categoryStats
            });

        } catch (error) {
            console.error('Error getting notification stats:', error);
            res.status(500).json({
                error: 'İstatistikler yüklenirken bir hata oluştu',
                details: error.message
            });
        }
    }
}

module.exports = new NotificationsController();


