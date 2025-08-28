const express = require('express');
const router = express.Router();
const {
    getAllPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients
} = require('../Controllers/Patients');

/**
 * @swagger
 * /api/patients/search:
 *   get:
 *     summary: Search patients for autocomplete.
 *     tags:
 *       - Patients
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         description: Search term (name, TC number, phone, email)
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Maximum number of results
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: Successful search results.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   patient_id:
 *                     type: string
 *                   first_name:
 *                     type: string
 *                   last_name:
 *                     type: string
 *                   tc_number:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   email:
 *                     type: string
 *                   fullName:
 *                     type: string
 *                   age:
 *                     type: number
 *                   gender:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/search', searchPatients);

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
 *                   first_name:
 *                     type: string
 *                     example: "John"
 *                   last_name:
 *                     type: string
 *                     example: "Doe"
 *                   tc_number:
 *                     type: string
 *                     example: "12345678901"
 *                   age:
 *                     type: number
 *                     example: 30
 *                   email:
 *                     type: string
 *                     example: "john.doe@example.com"
 *       500:
 *         description: Server error
 */
router.get('/', getAllPatients);

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
router.get('/:patient_id', getPatient);

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
router.post('/', createPatient);

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
router.put('/:patient_id', updatePatient);

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
router.delete('/:patient_id', deletePatient);

module.exports = router;
