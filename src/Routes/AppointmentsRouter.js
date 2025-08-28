const express = require('express');
const router = express.Router();
const AppointmentsController = require('../Controllers/Appointments');
/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: List all appointments.
 *     tags:
 *       - Appointments
 *     responses:
 *       200:
 *         description: Successful retrieval of appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "5f8d0e352a8a9a0b9cde1234"
 *                   patientId:
 *                     type: string
 *                     example: "5f8d0e352a8a9a0b9cde5678"
 *                   doctorId:
 *                     type: string
 *                     example: "5f8d0e352a8a9a0b9cde9012"
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-04-20T14:00:00Z"
 *                   status:
 *                     type: string
 *                     example: "scheduled"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database query failed"
 * 
 */
router.get('/', AppointmentsController.getAllAppointments);
/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create a new appointment.
 *     tags:
 *       - Appointments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: string
 *                 example: "5f8d0e352a8a9a0b9cde5678"
 *               doctorId:
 *                 type: string
 *                 example: "5f8d0e352a8a9a0b9cde9012"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-04-20T14:00:00Z"
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "5f8d0e352a8a9a0b9cde1234"
 *                 patientId:
 *                   type: string
 *                   example: "5f8d0e352a8a9a0b9cde5678"
 *                 doctorId:
 *                   type: string
 *                   example: "5f8d0e352a8a9a0b9cde9012"
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-04-20T14:00:00Z"
 *                 status:
 *                   type: string
 *                   example: "scheduled"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database query failed"
 */
router.post('/', AppointmentsController.createAppointment);
/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get a specific appointment.
 *     tags:
 *       - Appointments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The appointment ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of appointment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "5f8d0e352a8a9a0b9cde1234"
 *                 patientId:
 *                   type: string
 *                   example: "5f8d0e352a8a9a0b9cde5678"
 *                 doctorId:
 *                   type: string
 *                   example: "5f8d0e352a8a9a0b9cde9012"
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-04-20T14:00:00Z"
 *                 status:
 *                   type: string
 *                   example: "scheduled"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database query failed"
 */
router.get('/:appointment_id', AppointmentsController.getAppointment);
/**
 * @swagger
 * /api/appointments/{id}:
 *   put:
 *     summary: Update a specific appointment.
 *     tags:
 *       - Appointments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The appointment ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: string
 *                 example: "5f8d0e352a8a9a0b9cde5678"
 *               doctorId:
 *                 type: string
 *                 example: "5f8d0e352a8a9a0b9cde9012"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-04-20T14:00:00Z"
 *               status:
 *                 type: string
 *                 example: "scheduled"
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "5f8d0e352a8a9a0b9cde1234"
 *                 patientId:
 *                   type: string
 *                   example: "5f8d0e352a8a9a0b9cde5678"
 *                 doctorId:
 *                   type: string
 *                   example: "5f8d0e352a8a9a0b9cde9012"
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-04-20T14:00:00Z"
 *                 status:
 *                   type: string
 *                   example: "scheduled"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database query failed"
 */
router.put('/:appointment_id', AppointmentsController.updateAppointment);
/**
 * @swagger
 * /api/appointments/{id}:
 *   delete:
 *     summary: Delete a specific appointment.
 *     tags:
 *       - Appointments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The appointment ID
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Appointment deleted successfully
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database query failed"
 */
router.delete('/:appointment_id', AppointmentsController.deleteAppointment);

module.exports = router;