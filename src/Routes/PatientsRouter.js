const express = require('express');
const router = express.Router();
const {
    getAllPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient
} = require('../Controllers/Patients');

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: List all patients.
 *     tags:
 *       - Patients
 *     responses:
 *       200:
 *         description: Successful retrieval of patients.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   patient_id:
 *                     type: string
 *                     example: "pat123"
 *                   name:
 *                     type: string
 *                     example: "John Doe"
 *                   age:
 *                     type: number
 *                     example: 30
 *                   email:
 *                     type: string
 *                     example: "john.doe@example.com"
 *       500:
 *         description: Server error
 */
router.get('/patients', getAllPatients);

/**
 * @swagger
 * /api/patients/{patient_id}:
 *   get:
 *     summary: Get a specific patient.
 *     tags:
 *       - Patients
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         description: The patient ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of patient.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 patient_id:
 *                   type: string
 *                   example: "pat123"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 age:
 *                   type: number
 *                   example: 30
 *                 email:
 *                   type: string
 *                   example: "john.doe@example.com"
 *       500:
 *         description: Server error
 */
router.get('/patients/:patient_id', getPatient);

/**
 * @swagger
 * /api/patients:
 *   post:
 *     summary: Create a new patient.
 *     tags:
 *       - Patients
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               age:
 *                 type: number
 *                 example: 30
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *     responses:
 *       201:
 *         description: Patient created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 patient_id:
 *                   type: string
 *                   example: "pat123"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 age:
 *                   type: number
 *                   example: 30
 *                 email:
 *                   type: string
 *                   example: "john.doe@example.com"
 *       500:
 *         description: Server error
 */
router.post('/patients', createPatient);

/**
 * @swagger
 * /api/patients/{patient_id}:
 *   put:
 *     summary: Update a specific patient.
 *     tags:
 *       - Patients
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         description: The patient ID.
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
 *                 example: "John Doe"
 *               age:
 *                 type: number
 *                 example: 30
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: Patient updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 patient_id:
 *                   type: string
 *                   example: "pat123"
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 age:
 *                   type: number
 *                   example: 30
 *                 email:
 *                   type: string
 *                   example: "john.doe@example.com"
 *       500:
 *         description: Server error
 */
router.put('/patients/:patient_id', updatePatient);

/**
 * @swagger
 * /api/patients/{patient_id}:
 *   delete:
 *     summary: Delete a specific patient.
 *     tags:
 *       - Patients
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         description: The patient ID.
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Patient deleted successfully.
 *       500:
 *         description: Server error
 */
router.delete('/patients/:patient_id', deletePatient);

module.exports = router;
