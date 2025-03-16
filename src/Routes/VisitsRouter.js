const express = require('express');
const router = express.Router();
const VisitsController = require('../Controllers/Visits');

/**
 * @swagger
 * /api/visits:
 *   get:
 *     summary: List all visits
 *     tags: [Visits]
 *     responses:
 *       200:
 *         description: Successful retrieval of visits
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
 *                   visitDate:
 *                     type: string
 *                     format: date
 *                     example: "2023-10-01"
 *                   reason:
 *                     type: string
 *                     example: "Routine check-up"
 *   post:
 *     summary: Create a new visit
 *     tags: [Visits]
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
 *               visitDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-10-01"
 *               reason:
 *                 type: string
 *                 example: "Routine check-up"
 *     responses:
 *       201:
 *         description: Visit created successfully
 * /api/visits/{id}:
 *   get:
 *     summary: Get a specific visit
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The visit ID
 *     responses:
 *       200:
 *         description: Successful retrieval of the visit
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
 *                 visitDate:
 *                   type: string
 *                   format: date
 *                   example: "2023-10-01"
 *                 reason:
 *                   type: string
 *                   example: "Routine check-up"
 *   put:
 *     summary: Update a specific visit
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The visit ID
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
 *               visitDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-10-01"
 *               reason:
 *                 type: string
 *                 example: "Routine check-up"
 *     responses:
 *       200:
 *         description: Visit updated successfully
 *   delete:
 *     summary: Delete a specific visit
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The visit ID
 *     responses:
 *       200:
 *         description: Visit deleted successfully
 */

router.get('/', VisitsController.getAllVisits);
router.get('/:id', VisitsController.getVisit);
router.post('/', VisitsController.createVisit);
router.put('/:id', VisitsController.updateVisit);
router.delete('/:id', VisitsController.deleteVisit);

module.exports = router;
