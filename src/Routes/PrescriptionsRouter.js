const express = require('express');
const router = express.Router();
const PrescriptionsController = require('../Controllers/Prescriptions');

/**
 * @swagger
 * /api/prescriptions:
 *   get:
 *     summary: List all prescriptions
 *     tags: [Prescriptions]
 *     responses:
 *       200:
 *         description: Successful retrieval of prescriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   patientId:
 *                     type: integer
 *                     example: 123
 *                   medicationId:
 *                     type: integer
 *                     example: 456
 *                   dosage:
 *                     type: string
 *                     example: "2 pills daily"
 *                   startDate:
 *                     type: string
 *                     format: date
 *                     example: "2023-10-01"
 *                   endDate:
 *                     type: string
 *                     format: date
 *                     example: "2023-10-10"
 *   post:
 *     summary: Create a new prescription
 *     tags: [Prescriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: integer
 *                 example: 123
 *               medicationId:
 *                 type: integer
 *                 example: 456
 *               dosage:
 *                 type: string
 *                 example: "2 pills daily"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-10-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-10-10"
 *     responses:
 *       201:
 *         description: Prescription created successfully
 * /api/prescriptions/{id}:
 *   get:
 *     summary: Get a specific prescription
 *     tags: [Prescriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The prescription ID
 *     responses:
 *       200:
 *         description: Successful retrieval of the prescription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 patientId:
 *                   type: integer
 *                   example: 123
 *                 medicationId:
 *                   type: integer
 *                   example: 456
 *                 dosage:
 *                   type: string
 *                   example: "2 pills daily"
 *                 startDate:
 *                   type: string
 *                   format: date
 *                   example: "2023-10-01"
 *                 endDate:
 *                   type: string
 *                   format: date
 *                   example: "2023-10-10"
 *   put:
 *     summary: Update a specific prescription
 *     tags: [Prescriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The prescription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: integer
 *                 example: 123
 *               medicationId:
 *                 type: integer
 *                 example: 456
 *               dosage:
 *                 type: string
 *                 example: "2 pills daily"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-10-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-10-10"
 *     responses:
 *       200:
 *         description: Prescription updated successfully
 *   delete:
 *     summary: Delete a specific prescription
 *     tags: [Prescriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The prescription ID
 *     responses:
 *       200:
 *         description: Prescription deleted successfully
 */

router.get('/', PrescriptionsController.getAllPrescriptions);
router.get('/:id', PrescriptionsController.getPrescription);
router.post('/', PrescriptionsController.createPrescription);
router.put('/:id', PrescriptionsController.updatePrescription);
router.delete('/:id', PrescriptionsController.deletePrescription);

module.exports = router;
