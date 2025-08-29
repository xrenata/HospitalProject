const express = require('express');
const router = express.Router();
const {
    getAllSurgeries,
    getSurgery,
    createSurgery,
    updateSurgery,
    deleteSurgery
} = require('../Controllers/Surgeries');

/**
 * @swagger
 * /api/surgeries:
 *   get:
 *     summary: List all surgeries.
 *     tags:
 *       - Surgeries
 *     responses:
 *       200:
 *         description: Successful retrieval of surgeries.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   surgery_id:
 *                     type: string
 *                     example: "surg123"
 *                   patientId:
 *                     type: string
 *                     example: "pat456"
 *                   procedure:
 *                     type: string
 *                     example: "Appendectomy"
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-04-20T14:00:00Z"
 *                   status:
 *                     type: string
 *                     example: "completed"
 *       500:
 *         description: Server error
 */
router.get('/', getAllSurgeries);

/**
 * @swagger
 * /api/surgeries/{surgery_id}:
 *   get:
 *     summary: Get a specific surgery.
 *     tags:
 *       - Surgeries
 *     parameters:
 *       - in: path
 *         name: surgery_id
 *         required: true
 *         description: The surgery ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of surgery.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 surgery_id:
 *                   type: string
 *                   example: "surg123"
 *                 patientId:
 *                   type: string
 *                   example: "pat456"
 *                 procedure:
 *                   type: string
 *                   example: "Appendectomy"
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-04-20T14:00:00Z"
 *                 status:
 *                   type: string
 *                   example: "completed"
 *       500:
 *         description: Server error
 */
router.get('/:surgery_id', getSurgery);

/**
 * @swagger
 * /api/surgeries:
 *   post:
 *     summary: Create a new surgery.
 *     tags:
 *       - Surgeries
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: string
 *                 example: "pat456"
 *               procedure:
 *                 type: string
 *                 example: "Appendectomy"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-04-20T14:00:00Z"
 *     responses:
 *       201:
 *         description: Surgery created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 surgery_id:
 *                   type: string
 *                   example: "surg123"
 *                 patientId:
 *                   type: string
 *                   example: "pat456"
 *                 procedure:
 *                   type: string
 *                   example: "Appendectomy"
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-04-20T14:00:00Z"
 *                 status:
 *                   type: string
 *                   example: "scheduled"
 *       500:
 *         description: Server error
 */
router.post('/', createSurgery);

/**
 * @swagger
 * /api/surgeries/{surgery_id}:
 *   put:
 *     summary: Update a specific surgery.
 *     tags:
 *       - Surgeries
 *     parameters:
 *       - in: path
 *         name: surgery_id
 *         required: true
 *         description: The surgery ID.
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
 *                 example: "pat456"
 *               procedure:
 *                 type: string
 *                 example: "Appendectomy"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-04-20T14:00:00Z"
 *               status:
 *                 type: string
 *                 example: "completed"
 *     responses:
 *       200:
 *         description: Surgery updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 surgery_id:
 *                   type: string
 *                   example: "surg123"
 *                 patientId:
 *                   type: string
 *                   example: "pat456"
 *                 procedure:
 *                   type: string
 *                   example: "Appendectomy"
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-04-20T14:00:00Z"
 *                 status:
 *                   type: string
 *                   example: "completed"
 *       500:
 *         description: Server error
 */
router.put('/:surgery_id', updateSurgery);

/**
 * @swagger
 * /api/surgeries/{surgery_id}:
 *   delete:
 *     summary: Delete a specific surgery.
 *     tags:
 *       - Surgeries
 *     parameters:
 *       - in: path
 *         name: surgery_id
 *         required: true
 *         description: The surgery ID.
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Surgery deleted successfully.
 *       500:
 *         description: Server error
 */
router.delete('/:surgery_id', deleteSurgery);

module.exports = router;
