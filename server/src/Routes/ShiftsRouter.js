const express = require('express');
const router = express.Router();
const {
    getAllShifts,
    getShift,
    createShift,
    updateShift,
    deleteShift
} = require('../Controllers/Shifts');

/**
 * @swagger
 * /api/shifts:
 *   get:
 *     summary: List all shifts
 *     tags: [Shifts]
 *     responses:
 *       200:
 *         description: Successful retrieval of shifts
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
 *                   staffId:
 *                     type: integer
 *                     example: 123
 *                   shiftStart:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-10-01T08:00:00Z"
 *                   shiftEnd:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-10-01T16:00:00Z"
 *   post:
 *     summary: Create a new shift
 *     tags: [Shifts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staffId:
 *                 type: integer
 *                 example: 123
 *               shiftStart:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-10-01T08:00:00Z"
 *               shiftEnd:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-10-01T16:00:00Z"
 *     responses:
 *       201:
 *         description: Shift created successfully
 * /api/shifts/{id}:
 *   get:
 *     summary: Get a specific shift
 *     tags: [Shifts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The shift ID
 *     responses:
 *       200:
 *         description: Successful retrieval of the shift
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 staffId:
 *                   type: integer
 *                   example: 123
 *                 shiftStart:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-10-01T08:00:00Z"
 *                 shiftEnd:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-10-01T16:00:00Z"
 *   put:
 *     summary: Update a specific shift
 *     tags: [Shifts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staffId:
 *                 type: integer
 *                 example: 123
 *               shiftStart:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-10-01T08:00:00Z"
 *               shiftEnd:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-10-01T16:00:00Z"
 *     responses:
 *       200:
 *         description: Shift updated successfully
 *   delete:
 *     summary: Delete a specific shift
 *     tags: [Shifts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The shift ID
 *     responses:
 *       200:
 *         description: Shift deleted successfully
 */

router.get('/', getAllShifts);
router.get('/:id', getShift);
router.post('/', createShift);
router.put('/:id', updateShift);
router.delete('/:id', deleteShift);

module.exports = router;
