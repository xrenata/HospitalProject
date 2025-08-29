const express = require('express');
const router = express.Router();
const {
    getAllMedications,
    getMedicationById,
    createMedication,
    updateMedication,
    deleteMedication
} = require('../Controllers/Medications');

/**
 * @swagger
 * /api/medications:
 *   get:
 *     summary: List all medications.
 *     tags:
 *       - Medications
 *     responses:
 *       200:
 *         description: Successful retrieval of medications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   medication_id:
 *                     type: string
 *                     example: "med123"
 *                   name:
 *                     type: string
 *                     example: "Aspirin"
 *                   dosage:
 *                     type: string
 *                     example: "100mg"
 *       500:
 *         description: Server error
 */
router.get('/', getAllMedications);


/**
 * @swagger
 * /api/medications/{medication_id}:
 *   get:
 *     summary: Get a specific medication.
 *     tags:
 *       - Medications
 *     parameters:
 *       - in: path
 *         name: medication_id
 *         required: true
 *         description: The medication ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of medication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 medication_id:
 *                   type: string
 *                   example: "med123"
 *                 name:
 *                   type: string
 *                   example: "Aspirin"
 *                 dosage:
 *                   type: string
 *                   example: "100mg"
 *       500:
 *         description: Server error
 */
router.get('/:medication_id', getMedicationById);

/**
 * @swagger
 * /api/medications:
 *   post:
 *     summary: Create a new medication.
 *     tags:
 *       - Medications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Aspirin"
 *               dosage:
 *                 type: string
 *                 example: "100mg"
 *     responses:
 *       201:
 *         description: Medication created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 medication_id:
 *                   type: string
 *                   example: "med123"
 *                 name:
 *                   type: string
 *                   example: "Aspirin"
 *                 dosage:
 *                   type: string
 *                   example: "100mg"
 *       500:
 *         description: Server error
 */
router.post('/', createMedication);

/**
 * @swagger
 * /api/medications/{medication_id}:
 *   put:
 *     summary: Update a specific medication.
 *     tags:
 *       - Medications
 *     parameters:
 *       - in: path
 *         name: medication_id
 *         required: true
 *         description: The medication ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Aspirin"
 *               dosage:
 *                 type: string
 *                 example: "100mg"
 *     responses:
 *       200:
 *         description: Medication updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 medication_id:
 *                   type: string
 *                   example: "med123"
 *                 name:
 *                   type: string
 *                   example: "Aspirin"
 *                 dosage:
 *                   type: string
 *                   example: "100mg"
 *       500:
 *         description: Server error
 */
router.put('/:medication_id', updateMedication);

/**
 * @swagger
 * /api/medications/{medication_id}:
 *   delete:
 *     summary: Delete a specific medication.
 *     tags:
 *       - Medications
 *     parameters:
 *       - in: path
 *         name: medication_id
 *         required: true
 *         description: The medication ID
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Medication deleted successfully
 *       500:
 *         description: Server error
 */
router.delete('/:medication_id', deleteMedication);

module.exports = router;
