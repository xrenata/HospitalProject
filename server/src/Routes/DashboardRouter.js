const express = require('express');
const router = express.Router();
const { Patient, Appointment, Staff, Treatment, Room, Notification } = require('../Modules/Database/models');

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
        const pendingTests = treatments.filter(t => t.status === 'ongoing').length;
        
        // Get critical alerts from notifications
        const criticalNotifications = await Notification.find({ 
            type: 'critical',
            isRead: false 
        });
        const criticalAlerts = criticalNotifications.length;

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
            .populate('staffId', 'name role')
            .sort({ createdAt: -1 })
            .limit(limit);

        // Transform appointments to activity format
        const activities = recentAppointments.map(appointment => {
            const patientName = appointment.patientId 
                ? `${appointment.patientId.firstName} ${appointment.patientId.lastName}`
                : 'Unknown Patient';
            
            const staffName = appointment.staffId 
                ? appointment.staffId.name
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
                reason: appointment.reason || '',
                staff: staffName,
                timestamp: appointment.createdAt,
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

        // Create a new notification record for the emergency alert
        const emergencyAlert = new Notification({
            title: `${type.toUpperCase()} Emergency Alert`,
            message: description,
            type: 'critical',
            priority: 'high',
            category: 'security',
            isRead: false,
            sender: {
                userId: req.user ? req.user._id : null,
                name: req.user ? req.user.username : 'System',
                role: req.user ? req.user.role : 'System',
                system: !req.user
            },
            targetRoles: ['Admin', 'Doktor', 'Hemşire', 'Sekreter', 'Teknisyen'], // Alert all staff
            data: {
                emergencyType: type,
                reportedAt: new Date(),
                reportedBy: req.user ? req.user.username : 'Unknown'
            },
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
        // Get real alerts from notifications and treatments
        const criticalNotifications = await Notification.find({
            type: 'critical',
            isRead: false
        }).limit(10);
        
        const ongoingTreatments = await Treatment.find({ 
            status: 'ongoing'
        }).populate('patientId', 'firstName lastName').limit(5);

        const urgentAppointments = await Appointment.find({
            appointmentDate: {
                $gte: new Date(),
                $lte: new Date(Date.now() + 3600000) // Next hour
            }
        }).populate('patientId', 'firstName lastName').limit(5);

        const alerts = [];

        // Add critical notifications
        criticalNotifications.forEach((notification) => {
            alerts.push({
                id: `notification_${notification._id}`,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                timestamp: notification.createdAt || new Date().toISOString(),
                priority: notification.priority,
                isRead: notification.isRead
            });
        });

        // Add ongoing treatment alerts
        ongoingTreatments.forEach((treatment) => {
            const patientName = treatment.patientId 
                ? `${treatment.patientId.firstName} ${treatment.patientId.lastName}`
                : 'Unknown Patient';
            
            alerts.push({
                id: `treatment_${treatment._id}`,
                type: 'warning',
                title: 'Ongoing Treatment',
                message: `Patient ${patientName} has ongoing treatment - ${treatment.description || 'Treatment in progress'}`,
                timestamp: treatment.createdAt || new Date().toISOString(),
                priority: 'medium',
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
        
        // Handle different alert types
        if (id.startsWith('notification_')) {
            // Notification-based alerts
            const notificationId = id.replace('notification_', '');
            await Notification.findByIdAndUpdate(notificationId, { 
                isRead: true,
                updatedAt: new Date()
            });
        } else if (id.startsWith('treatment_')) {
            // Treatment-based alerts
            const treatmentId = id.replace('treatment_', '');
            await Treatment.findByIdAndUpdate(treatmentId, { 
                isAlertRead: true,
                updatedAt: new Date()
            });
        } else if (id.startsWith('appointment_')) {
            // Appointment-based alerts
            const appointmentId = id.replace('appointment_', '');
            await Appointment.findByIdAndUpdate(appointmentId, { 
                isAlertRead: true,
                updatedAt: new Date()
            });
        } else {
            // Try to find as notification by default
            await Notification.findByIdAndUpdate(id, { 
                isRead: true,
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
            .populate('staffId', 'name role')
            .sort({ createdAt: -1 })
            .limit(20);

        const tests = treatments.map(treatment => {
            const patientName = treatment.patientId 
                ? `${treatment.patientId.firstName} ${treatment.patientId.lastName}`
                : 'Unknown Patient';
            
            const staffName = treatment.staffId 
                ? `Dr. ${treatment.staffId.name}`
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

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Get dashboard chart data
 *     description: Daily series for new patients, appointments and revenue over the last N days, the change versus the previous N days, plus appointment status, room status and staff role breakdowns.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 14
 *         description: Number of days in the series (2-90)
 *     responses:
 *       200:
 *         description: Chart data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/trends', async (req, res) => {
    try {
        const days = Math.min(90, Math.max(2, parseInt(req.query.days, 10) || 14));

        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date(end);
        start.setDate(start.getDate() - days + 1);
        start.setHours(0, 0, 0, 0);
        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - days);

        const dayKey = (d) => {
            const x = new Date(d);
            return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
        };
        const labels = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            labels.push(dayKey(d));
        }
        const index = Object.fromEntries(labels.map((k, i) => [k, i]));

        const bucket = (docs, dateField, valueFn = () => 1) => {
            const current = new Array(days).fill(0);
            let previous = 0;
            for (const doc of docs) {
                const value = valueFn(doc);
                const date = new Date(doc[dateField]);
                if (date >= start) {
                    const i = index[dayKey(date)];
                    if (i !== undefined) current[i] += value;
                } else {
                    previous += value;
                }
            }
            return { series: current, total: current.reduce((a, b) => a + b, 0), previous };
        };

        const [patients, appointments, treatments, rooms, staffRoles, statusCounts] = await Promise.all([
            Patient.find({ createdAt: { $gte: prevStart, $lte: end } }).select('createdAt').lean(),
            Appointment.find({ appointmentDate: { $gte: prevStart, $lte: end } }).select('appointmentDate status').lean(),
            Treatment.find({ startDate: { $gte: prevStart, $lte: end } }).select('startDate cost').lean(),
            Room.find().select('status').lean(),
            Staff.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
            Appointment.aggregate([
                { $match: { appointmentDate: { $gte: start, $lte: end } } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])
        ]);

        const roomStatus = { available: 0, occupied: 0, maintenance: 0, reserved: 0 };
        for (const room of rooms) {
            if (roomStatus[room.status] !== undefined) roomStatus[room.status] += 1;
        }

        const appointmentStatus = { scheduled: 0, completed: 0, cancelled: 0, 'no-show': 0 };
        for (const row of statusCounts) {
            if (appointmentStatus[row._id] !== undefined) appointmentStatus[row._id] = row.count;
        }

        res.json({
            days,
            labels,
            patients: bucket(patients, 'createdAt'),
            appointments: bucket(appointments, 'appointmentDate'),
            revenue: bucket(treatments, 'startDate', (t) => t.cost || 0),
            appointmentStatus,
            rooms: { total: rooms.length, ...roomStatus },
            staffByRole: staffRoles.map((r) => ({ role: r._id || 'Other', count: r.count }))
        });
    } catch (error) {
        console.error('Error fetching dashboard trends:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard trends' });
    }
});

// Entities the list pages can ask a summary for: model, date field(s) for the trend, fields to break down by.
// Several collections store both camelCase and snake_case variants, so a field can be a list of fallbacks.
const SUMMARY_ENTITIES = () => {
    const models = require('../Modules/Database/models');
    const extra = require('../Modules/Database/modules');
    return {
        patients: { model: models.Patient, date: ['createdAt'], groups: ['gender', 'bloodType'] },
        appointments: { model: models.Appointment, date: ['appointmentDate'], groups: ['status'] },
        staff: { model: models.Staff, date: ['created_at', 'hire_date'], groups: ['status', 'role'] },
        departments: { model: models.Department, date: ['createdAt', 'created_at'], groups: ['status'] },
        rooms: { model: models.Room, date: ['createdAt'], groups: ['status', 'roomType'] },
        treatments: { model: models.Treatment, date: ['startDate'], groups: ['status'] },
        equipment: { model: models.Equipment, date: ['createdAt'], groups: ['status'] },
        medications: { model: models.Medication, date: ['createdAt'], groups: ['category'] },
        tests: { model: models.Test, date: ['testDate', 'test_date', 'createdAt'], groups: ['status', 'priority'] },
        surgeries: { model: models.Surgery, date: ['surgeryDate', 'surgery_date', 'createdAt'], groups: ['status', 'priority'] },
        visits: { model: models.Visit, date: ['visitDate', 'visit_date', 'createdAt'], groups: ['status'] },
        prescriptions: { model: models.Prescription, date: ['prescriptionDate', 'prescription_date', 'startDate', 'createdAt'], groups: ['status'] },
        complaints: { model: models.Complaint, date: ['createdAt', 'created_at'], groups: ['status', 'priority', 'complaintType'] },
        insurance: { model: models.Insurance, date: ['createdAt', 'created_at'], groups: ['status', 'coverageType'] },
        shifts: { model: models.Shift, date: ['shiftDate', 'shift_date', 'createdAt'], groups: ['status', 'shiftType'] },
        feedback: { model: models.Feedback, date: ['createdAt', 'created_at'], groups: ['rating', 'feedbackType', 'status'] },
        billing: { model: extra.Invoice, date: ['issueDate', 'createdAt'], groups: ['status', 'paymentMethod'] },
        blood_bank: { model: extra.BloodUnit, date: ['collectedDate', 'createdAt'], groups: ['bloodType', 'status', 'component'] },
        maintenance: { model: extra.MaintenanceRequest, date: ['createdAt'], groups: ['status', 'priority'] },
        incidents: { model: extra.Incident, date: ['occurredAt', 'createdAt'], groups: ['status', 'severity', 'incidentType'] },
        ambulances: { model: extra.Ambulance, date: ['createdAt'], groups: ['status', 'vehicleType'] }
    };
};

/**
 * @swagger
 * /api/dashboard/summary/{entity}:
 *   get:
 *     summary: Get list-page summary
 *     description: Total count, a 14-day trend with the previous period and breakdowns by status-like fields for one entity (patients, appointments, staff, ...).
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entity
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 *       404:
 *         description: Unknown entity
 */
router.get('/summary/:entity', async (req, res) => {
    try {
        const config = SUMMARY_ENTITIES()[req.params.entity];
        if (!config) return res.status(404).json({ error: 'Unknown entity' });
        if (!require('../Modules/Functions/access').can(req.access, `${req.params.entity}.view`)) {
            return res.status(403).json({ message: 'Insufficient permissions', required: `${req.params.entity}.view` });
        }

        const days = 14;
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date(end);
        start.setDate(start.getDate() - days + 1);
        start.setHours(0, 0, 0, 0);
        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - days);

        const chain = (fields) => fields.slice(1).reduce((acc, f) => ({ $ifNull: [acc, `$${f}`] }), `$${fields[0]}`);
        const facet = {
            total: [{ $count: 'n' }],
            daily: [
                { $match: { __d: { $gte: start, $lte: end } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$__d' } }, n: { $sum: 1 } } }
            ],
            previous: [{ $match: { __d: { $gte: prevStart, $lt: start } } }, { $count: 'n' }]
        };
        for (const field of config.groups) {
            facet[`g_${field}`] = [
                { $group: { _id: `$${field}`, n: { $sum: 1 } } },
                { $sort: { n: -1 } },
                { $limit: 6 }
            ];
        }

        const [result] = await config.model.aggregate([
            { $addFields: { __d: { $convert: { input: chain(config.date), to: 'date', onError: null, onNull: null } } } },
            { $facet: facet }
        ]);

        const series = new Array(days).fill(0);
        for (const row of result.daily) {
            const i = Math.round((new Date(`${row._id}T12:00:00`).setHours(0, 0, 0, 0) - start.getTime()) / 86400000);
            if (i >= 0 && i < days) series[i] += row.n;
        }

        const groups = {};
        for (const field of config.groups) {
            groups[field] = result[`g_${field}`]
                .filter((r) => r._id !== null && r._id !== undefined && r._id !== '')
                .map((r) => ({ value: String(r._id), count: r.n }));
        }

        res.json({
            total: result.total[0]?.n || 0,
            series,
            recent: series.reduce((a, b) => a + b, 0),
            previous: result.previous[0]?.n || 0,
            groups
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

module.exports = router;