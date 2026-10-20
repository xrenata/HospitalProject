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

/**
 * @swagger
 * /api/patients/{patient_id}/overview:
 *   get:
 *     summary: Get a patient with their related records
 *     description: Returns the patient plus their latest appointments, treatments, visits, prescriptions and tests, with total counts.
 *     tags:
 *       - Patients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patient overview
 *       404:
 *         description: Patient not found
 */
router.get('/:patient_id/overview', async (req, res) => {
    try {
        const { Patient, Appointment, Treatment, Visit, Prescription, Test, Insurance, Vital } = require('../Modules/Database/models');
        const { can } = require('../Modules/Functions/access');
        const patient = await Patient.findById(req.params.patient_id).lean();
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const filter = { patientId: patient._id };
        const latest = (Model, sort, populate, limit = 20) => {
            const query = Model.find(filter).sort(sort).limit(limit);
            return (populate ? query.populate(populate, 'name role') : query).lean();
        };

        // Each section of the file follows the permission of the thing it shows. Whatever the person may not
        // see comes back empty and is listed in `restricted`, so the page can say so instead of pretending.
        const sections = {
            appointments: ['appointments', () => latest(Appointment, { appointmentDate: -1 }, 'staffId'), Appointment],
            treatments: ['treatments', () => latest(Treatment, { startDate: -1 }, 'staffId'), Treatment],
            visits: ['visits', () => latest(Visit, { createdAt: -1 }, 'staffId'), Visit],
            prescriptions: ['prescriptions', () => latest(Prescription, { createdAt: -1 }, 'staffId'), Prescription],
            tests: ['tests', () => latest(Test, { createdAt: -1 }, 'staffId', 300), Test], // blood panels hold one document per analyte
            insurance: ['insurance', () => latest(Insurance, { createdAt: -1 }, null, 5), Insurance],
            vitals: ['visits', () => latest(Vital, { recordedAt: -1 }, 'staffId', 60), Vital], // vitals follow the visit permission
        };
        const restricted = [];
        const out = {};
        const counts = {};
        await Promise.all(Object.entries(sections).map(async ([name, [resource, load, Model]]) => {
            if (!can(req.access, `${resource}.view`)) {
                restricted.push(name);
                out[name] = [];
                counts[name] = 0;

                return;
            }
            [out[name], counts[name]] = await Promise.all([load(), Model.countDocuments(filter)]);
        }));

        if (!can(req.access, 'patients.medical')) {
            restricted.push('medical');
            for (const field of ['allergies', 'medicalHistory', 'medical_history', 'bloodType', 'blood_type']) delete patient[field];
        }

        res.json({
            patient,
            appointments: out.appointments,
            treatments: out.treatments,
            visits: out.visits,
            prescriptions: out.prescriptions,
            tests: out.tests,
            insurance: out.insurance,
            vitals: out.vitals,
            restricted,
            counts: {
                appointments: counts.appointments,
                treatments: counts.treatments,
                visits: counts.visits,
                prescriptions: counts.prescriptions,
                tests: counts.tests
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
