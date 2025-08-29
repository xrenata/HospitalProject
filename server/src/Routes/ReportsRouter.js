const express = require('express');
const router = express.Router();
const ReportsController = require('../Controllers/Reports');

/**
 * @swagger
 * /api/reports/templates:
 *   get:
 *     summary: Get available report templates
 *     tags:
 *       - Reports
 *     responses:
 *       200:
 *         description: Report templates retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/templates', ReportsController.getReportTemplates);

/**
 * @swagger
 * /api/reports/patient:
 *   post:
 *     summary: Generate patient summary report
 *     tags:
 *       - Reports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *               ageGroups:
 *                 type: array
 *                 items:
 *                   type: string
 *               includeFields:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Patient report generated successfully
 *       500:
 *         description: Server error
 */
router.post('/patient', ReportsController.generatePatientReport);

/**
 * @swagger
 * /api/reports/appointment:
 *   post:
 *     summary: Generate appointment analytics report
 *     tags:
 *       - Reports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *     responses:
 *       200:
 *         description: Appointment report generated successfully
 *       500:
 *         description: Server error
 */
router.post('/appointment', ReportsController.generateAppointmentReport);

/**
 * @swagger
 * /api/reports/financial:
 *   post:
 *     summary: Generate financial summary report
 *     tags:
 *       - Reports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Financial report generated successfully
 *       500:
 *         description: Server error
 */
router.post('/financial', ReportsController.generateFinancialReport);

/**
 * @swagger
 * /api/reports/staff:
 *   post:
 *     summary: Generate staff performance report
 *     tags:
 *       - Reports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *     responses:
 *       200:
 *         description: Staff report generated successfully
 *       500:
 *         description: Server error
 */
router.post('/staff', ReportsController.generateStaffReport);

/**
 * @swagger
 * /api/reports/inventory:
 *   post:
 *     summary: Generate inventory status report
 *     tags:
 *       - Reports
 *     responses:
 *       200:
 *         description: Inventory report generated successfully
 *       500:
 *         description: Server error
 */
router.post('/inventory', ReportsController.generateInventoryReport);

/**
 * @swagger
 * /api/reports/comprehensive:
 *   post:
 *     summary: Generate comprehensive report
 *     tags:
 *       - Reports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Comprehensive report generated successfully
 *       500:
 *         description: Server error
 */
router.post('/comprehensive', ReportsController.generateComprehensiveReport);

module.exports = router;
