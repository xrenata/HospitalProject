const express = require('express');
const router = express.Router();
const AnalyticsController = require('../Controllers/Analytics');

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get overview statistics
 *     tags:
 *       - Analytics
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         description: Time period for statistics
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date
 *     responses:
 *       200:
 *         description: Overview statistics retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/overview', AnalyticsController.getOverviewStats);

/**
 * @swagger
 * /api/analytics/patients:
 *   get:
 *     summary: Get patient analytics
 *     tags:
 *       - Analytics
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Patient analytics retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/patients', AnalyticsController.getPatientAnalytics);

/**
 * @swagger
 * /api/analytics/appointments:
 *   get:
 *     summary: Get appointment analytics
 *     tags:
 *       - Analytics
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Appointment analytics retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/appointments', AnalyticsController.getAppointmentAnalytics);

/**
 * @swagger
 * /api/analytics/staff:
 *   get:
 *     summary: Get staff analytics
 *     tags:
 *       - Analytics
 *     responses:
 *       200:
 *         description: Staff analytics retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/staff', AnalyticsController.getStaffAnalytics);

/**
 * @swagger
 * /api/analytics/financial:
 *   get:
 *     summary: Get financial analytics
 *     tags:
 *       - Analytics
 *     responses:
 *       200:
 *         description: Financial analytics retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/financial', AnalyticsController.getFinancialAnalytics);

/**
 * @swagger
 * /api/analytics/resources:
 *   get:
 *     summary: Get resource utilization analytics
 *     tags:
 *       - Analytics
 *     responses:
 *       200:
 *         description: Resource analytics retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/resources', AnalyticsController.getResourceAnalytics);

/**
 * @swagger
 * /api/analytics/report:
 *   post:
 *     summary: Generate custom report
 *     tags:
 *       - Analytics
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [comprehensive, patients, appointments, financial]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               departments:
 *                 type: array
 *                 items:
 *                   type: string
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Custom report generated successfully
 *       500:
 *         description: Server error
 */
router.post('/report', AnalyticsController.generateReport);

module.exports = router;
