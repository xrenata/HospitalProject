const express = require('express');
const router = express.Router();
const {
    getAllTreatments,
    getTreatment,
    createTreatment,
    updateTreatment,
    deleteTreatment
} = require('../Controllers/Treatments');

/**
 * @swagger
 * /api/treatments:
 *   get:
 *     summary: List all treatments.
 *     tags:
 *       - Treatments
 *     responses:
 *       200:
 *         description: Successful retrieval of treatments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   treatment_id:
 *                     type: string
 *                     example: "treat001"
 *                   name:
 *                     type: string
 *                     example: "Physiotherapy"
 *                   description:
 *                     type: string
 *                     example: "Therapeutic exercises for recovery"
 *       500:
 *         description: Server error
 */
router.get('/', getAllTreatments);

/**
 * @swagger
 * /api/treatments/{treatment_id}:
 *   get:
 *     summary: Get a specific treatment.
 *     tags:
 *       - Treatments
 *     parameters:
 *       - in: path
 *         name: treatment_id
 *         required: true
 *         description: The treatment ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of treatment.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 treatment_id:
 *                   type: string
 *                   example: "treat001"
 *                 name:
 *                   type: string
 *                   example: "Physiotherapy"
 *                 description:
 *                   type: string
 *                   example: "Therapeutic exercises for recovery"
 *       500:
 *         description: Server error
 */
router.get('/:treatment_id', getTreatment);

/**
 * @swagger
 * /api/treatments:
 *   post:
 *     summary: Create a new treatment.
 *     tags:
 *       - Treatments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Physiotherapy"
 *               description:
 *                 type: string
 *                 example: "Therapeutic exercises for recovery"
 *     responses:
 *       201:
 *         description: Treatment created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 treatment_id:
 *                   type: string
 *                   example: "treat001"
 *                 name:
 *                   type: string
 *                   example: "Physiotherapy"
 *                 description:
 *                   type: string
 *                   example: "Therapeutic exercises for recovery"
 *       500:
 *         description: Server error
 */
router.post('/', createTreatment);

/**
 * @swagger
 * /api/treatments/{treatment_id}:
 *   put:
 *     summary: Update a specific treatment.
 *     tags:
 *       - Treatments
 *     parameters:
 *       - in: path
 *         name: treatment_id
 *         required: true
 *         description: The treatment ID.
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
 *                 example: "Physiotherapy"
 *               description:
 *                 type: string
 *                 example: "Updated therapeutic exercises"
 *     responses:
 *       200:
 *         description: Treatment updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 treatment_id:
 *                   type: string
 *                   example: "treat001"
 *                 name:
 *                   type: string
 *                   example: "Physiotherapy"
 *                 description:
 *                   type: string
 *                   example: "Updated therapeutic exercises"
 *       500:
 *         description: Server error
 */
router.put('/:treatment_id', updateTreatment);

/**
 * @swagger
 * /api/treatments/{treatment_id}:
 *   delete:
 *     summary: Delete a specific treatment.
 *     tags:
 *       - Treatments
 *     parameters:
 *       - in: path
 *         name: treatment_id
 *         required: true
 *         description: The treatment ID.
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Treatment deleted successfully.
 *       500:
 *         description: Server error
 */
router.delete('/:treatment_id', deleteTreatment);

module.exports = router;
