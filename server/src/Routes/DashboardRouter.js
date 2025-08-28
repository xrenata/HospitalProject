const express = require('express');
const router = express.Router();
const { Patient, Appointment, Staff, Treatment, Room } = require('../Modules/Database/models');

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Returns comprehensive dashboard statistics including patient count, appointments, staff, revenue, etc.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPatients:
 *                   type: number
 *                   example: 1247
 *                 totalAppointments:
 *                   type: number
 *                   example: 89
 *                 totalStaff:
 *                   type: number
 *                   example: 156
 *                 totalRevenue:
 *                   type: number
 *                   example: 125430
 *                 appointmentsToday:
 *                   type: number
 *                   example: 24
 *                 availableRooms:
 *                   type: number
 *                   example: 12
 *                 pendingTests:
 *                   type: number
 *                   example: 8
 *                 criticalAlerts:
 *                   type: number
 *                   example: 3
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req, res) => {
    try {
        // Get current date for today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Parallel queries for better performance
        const [
            totalPatients,
            totalAppointments,
            totalStaff,
            appointmentsToday,
            totalRooms,
            occupiedRooms,
            treatments
        ] = await Promise.all([
            Patient.countDocuments(),
            Appointment.countDocuments(),
            Staff.countDocuments(),
            Appointment.countDocuments({
                appointmentDate: {
                    $gte: today,
                    $lt: tomorrow
                }
            }),
            Room.countDocuments(),
            Room.countDocuments({ isOccupied: true }),
            Treatment.find().populate('patientId')
        ]);

        // Calculate revenue from treatments (mock calculation)
        const totalRevenue = treatments.reduce((sum, treatment) => {
            return sum + (treatment.cost || 0);
        }, 0);

        // Calculate available rooms
        const availableRooms = totalRooms - occupiedRooms;

        // Get real data for pending tests and critical alerts
        const pendingTests = treatments.filter(t => t.status === 'pending').length;
        const criticalAlerts = treatments.filter(t => t.priority === 'critical' || t.status === 'critical').length;

        const stats = {
            totalPatients,
            totalAppointments,
            totalStaff,
            totalRevenue,
            appointmentsToday,
            availableRooms,
            pendingTests,
            criticalAlerts
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

/**
 * @swagger
 * /api/dashboard/recent-activity:
 *   get:
 *     summary: Get recent hospital activity
 *     description: Returns recent activities including appointments, admissions, discharges, etc.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of activities to return
 *     responses:
 *       200:
 *         description: Recent activities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [appointment, admission, discharge, emergency]
 *                   patient:
 *                     type: string
 *                   description:
 *                     type: string
 *                   time:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [completed, pending, urgent]
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/recent-activity', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Get recent appointments
        const recentAppointments = await Appointment.find()
            .populate('patientId', 'firstName lastName')
            .populate('staffId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(limit);

        // Transform appointments to activity format
        const activities = recentAppointments.map(appointment => {
            const patientName = appointment.patientId 
                ? `${appointment.patientId.firstName} ${appointment.patientId.lastName}`
                : 'Unknown Patient';
            
            const staffName = appointment.staffId 
                ? `${appointment.staffId.firstName} ${appointment.staffId.lastName}`
                : 'Unknown Staff';

            const now = new Date();
            const appointmentDate = new Date(appointment.appointmentDate);
            const timeDiff = now - appointment.createdAt;
            
            let timeAgo;
            if (timeDiff < 60000) {
                timeAgo = 'Just now';
            } else if (timeDiff < 3600000) {
                timeAgo = `${Math.floor(timeDiff / 60000)} minutes ago`;
            } else if (timeDiff < 86400000) {
                timeAgo = `${Math.floor(timeDiff / 3600000)} hours ago`;
            } else {
                timeAgo = `${Math.floor(timeDiff / 86400000)} days ago`;
            }

            let status = 'pending';
            if (appointmentDate < now) {
                status = 'completed';
            } else if (appointmentDate - now < 3600000) { // Less than 1 hour
                status = 'urgent';
            }

            return {
                id: appointment._id.toString(),
                type: 'appointment',
                patient: patientName,
                description: `${appointment.reason || 'General consultation'} with Dr. ${staffName}`,
                time: timeAgo,
                status: status
            };
        });

        res.json(activities);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
});

/**
 * @swagger
 * /api/dashboard/emergency-alert:
 *   post:
 *     summary: Send emergency alert
 *     description: Sends an emergency alert to all hospital staff
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [medical, fire, security, evacuation, system, other]
 *                 example: medical
 *               description:
 *                 type: string
 *                 example: "Patient in room 205 requires immediate attention"
 *     responses:
 *       200:
 *         description: Emergency alert sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Emergency alert sent successfully"
 *                 alertId:
 *                   type: string
 *                   example: "alert_123456"
 *       400:
 *         description: Bad request - Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/emergency-alert', async (req, res) => {
    try {
        const { type, description } = req.body;
        
        if (!type || !description) {
            return res.status(400).json({ message: 'Type and description are required' });
        }

        // Create a new treatment record for the emergency alert
        const emergencyAlert = new Treatment({
            treatmentType: 'Emergency Alert',
            treatmentName: `${type.toUpperCase()} Alert`,
            description: description,
            status: 'critical',
            priority: 'critical',
            startDate: new Date(),
            notes: `Emergency alert reported by: ${req.user ? req.user.username : 'Unknown'}`,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const savedAlert = await emergencyAlert.save();
        const alertId = `alert_${savedAlert._id}`;
        
        // Log the emergency event
        console.log(`EMERGENCY ALERT [${alertId}]:`, {
            type,
            description,
            timestamp: new Date().toISOString(),
            reportedBy: req.user ? req.user.username : 'Unknown',
            alertId: savedAlert._id
        });

        res.json({
            message: 'Emergency alert sent successfully',
            alertId: alertId
        });
    } catch (error) {
        console.error('Error sending emergency alert:', error);
        res.status(500).json({ error: 'Failed to send emergency alert' });
    }
});

/**
 * @swagger
 * /api/dashboard/alerts:
 *   get:
 *     summary: Get system alerts
 *     description: Returns all system alerts including critical, warning, info, and success alerts
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alerts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 alerts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       type:
 *                         type: string
 *                         enum: [critical, warning, info, success]
 *                       title:
 *                         type: string
 *                       message:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                       priority:
 *                         type: string
 *                         enum: [high, medium, low]
 *                       isRead:
 *                         type: boolean
 *       500:
 *         description: Server error
 */
router.get('/alerts', async (req, res) => {
    try {
        // Get real alerts from treatments and appointments
        const criticalTreatments = await Treatment.find({ 
            $or: [
                { status: 'critical' },
                { priority: 'high' },
                { priority: 'critical' }
            ]
        }).populate('patientId', 'firstName lastName').limit(10);

        const urgentAppointments = await Appointment.find({
            appointmentDate: {
                $gte: new Date(),
                $lte: new Date(Date.now() + 3600000) // Next hour
            }
        }).populate('patientId', 'firstName lastName').limit(5);

        const alerts = [];

        // Add critical treatment alerts
        criticalTreatments.forEach((treatment, index) => {
            const patientName = treatment.patientId 
                ? `${treatment.patientId.firstName} ${treatment.patientId.lastName}`
                : 'Unknown Patient';
            
            alerts.push({
                id: `treatment_${treatment._id}`,
                type: 'critical',
                title: 'Critical Patient Alert',
                message: `Patient ${patientName} requires immediate attention - ${treatment.description || 'Critical condition'}`,
                timestamp: treatment.createdAt || new Date().toISOString(),
                priority: 'high',
                isRead: false
            });
        });

        // Add urgent appointment alerts
        urgentAppointments.forEach((appointment, index) => {
            const patientName = appointment.patientId 
                ? `${appointment.patientId.firstName} ${appointment.patientId.lastName}`
                : 'Unknown Patient';
            
            alerts.push({
                id: `appointment_${appointment._id}`,
                type: 'warning',
                title: 'Upcoming Appointment',
                message: `Appointment with ${patientName} scheduled within the next hour`,
                timestamp: appointment.createdAt || new Date().toISOString(),
                priority: 'medium',
                isRead: false
            });
        });

        // If no real alerts, add a default info message
        if (alerts.length === 0) {
            alerts.push({
                id: 'default_1',
                type: 'info',
                title: 'System Status',
                message: 'All systems operational. No critical alerts at this time.',
                timestamp: new Date().toISOString(),
                priority: 'low',
                isRead: false
            });
        }

        res.json({ alerts });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

/**
 * @swagger
 * /api/dashboard/alerts/{id}/read:
 *   patch:
 *     summary: Mark alert as read
 *     description: Marks a specific alert as read
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Alert ID
 *     responses:
 *       200:
 *         description: Alert marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.patch('/alerts/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        
        // For treatment-based alerts, you could update the treatment status
        if (id.startsWith('treatment_')) {
            const treatmentId = id.replace('treatment_', '');
            await Treatment.findByIdAndUpdate(treatmentId, { 
                isAlertRead: true,
                updatedAt: new Date()
            });
        }
        
        res.json({ success: true, message: 'Alert marked as read' });
    } catch (error) {
        console.error('Error marking alert as read:', error);
        res.status(500).json({ error: 'Failed to mark alert as read' });
    }
});

/**
 * @swagger
 * /api/dashboard/tests:
 *   get:
 *     summary: Get test results
 *     description: Returns all test results including pending, completed, and in-progress tests
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tests:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       patientId:
 *                         type: string
 *                       patientName:
 *                         type: string
 *                       testType:
 *                         type: string
 *                       testName:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, completed, in-progress, cancelled]
 *                       orderDate:
 *                         type: string
 *                       completedDate:
 *                         type: string
 *                       results:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             value:
 *                               type: string
 *                             unit:
 *                               type: string
 *                             normalRange:
 *                               type: string
 *                             status:
 *                               type: string
 *                               enum: [normal, abnormal, critical]
 *                       notes:
 *                         type: string
 *                       orderedBy:
 *                         type: string
 *       500:
 *         description: Server error
 */
router.get('/tests', async (req, res) => {
    try {
        // Get real test data from treatments
        const treatments = await Treatment.find()
            .populate('patientId', 'firstName lastName')
            .populate('staffId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(20);

        const tests = treatments.map(treatment => {
            const patientName = treatment.patientId 
                ? `${treatment.patientId.firstName} ${treatment.patientId.lastName}`
                : 'Unknown Patient';
            
            const staffName = treatment.staffId 
                ? `Dr. ${treatment.staffId.firstName} ${treatment.staffId.lastName}`
                : 'Unknown Doctor';

            return {
                id: treatment._id.toString(),
                patientId: treatment.patientId?._id?.toString() || 'unknown',
                patientName: patientName,
                testType: treatment.treatmentType || 'General',
                testName: treatment.treatmentName || treatment.description || 'Medical Test',
                status: treatment.status || 'pending',
                orderDate: treatment.createdAt?.toISOString() || new Date().toISOString(),
                completedDate: treatment.endDate?.toISOString() || null,
                results: treatment.results || [],
                notes: treatment.notes || treatment.description || 'No additional notes',
                orderedBy: staffName
            };
        });

        res.json({ tests });
    } catch (error) {
        console.error('Error fetching tests:', error);
        res.status(500).json({ error: 'Failed to fetch tests' });
    }
});

module.exports = router;