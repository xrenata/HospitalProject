const express = require('express');
const router = express.Router();
const {
    getAllFeedback,
    getFeedback,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    respondToFeedback
} = require('../Controllers/Feedback');

/**
 * @swagger
 * /api/feedback:
 *   get:
 *     summary: List all feedback
 *     tags: [Feedback]
 *     responses:
 *       200:
 *         description: Successful retrieval of feedback
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
 *                   staffId:
 *                     type: integer
 *                     example: 456
 *                   feedbackDate:
 *                     type: string
 *                     format: date
 *                     example: "2023-10-01"
 *                   comments:
 *                     type: string
 *                     example: "Great service!"
 *                   rating:
 *                     type: integer
 *                     example: 5
 *   post:
 *     summary: Create a new feedback
 *     tags: [Feedback]
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
 *               staffId:
 *                 type: integer
 *                 example: 456
 *               feedbackDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-10-01"
 *               comments:
 *                 type: string
 *                 example: "Great service!"
 *               rating:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Feedback created successfully
 * /api/feedback/{id}:
 *   get:
 *     summary: Get a specific feedback
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The feedback ID
 *     responses:
 *       200:
 *         description: Successful retrieval of the feedback
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
 *                 staffId:
 *                   type: integer
 *                   example: 456
 *                 feedbackDate:
 *                   type: string
 *                   format: date
 *                   example: "2023-10-01"
 *                 comments:
 *                   type: string
 *                   example: "Great service!"
 *                 rating:
 *                   type: integer
 *                   example: 5
 *   put:
 *     summary: Update a specific feedback
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The feedback ID
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
 *               staffId:
 *                 type: integer
 *                 example: 456
 *               feedbackDate:
 *                 type: string
 *                 format: date
 *                 example: "2023-10-01"
 *               comments:
 *                 type: string
 *                 example: "Great service!"
 *               rating:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: Feedback updated successfully
 *   delete:
 *     summary: Delete a specific feedback
 *     tags: [Feedback]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The feedback ID
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
 */

router.get('/', getAllFeedback);
router.get('/:id', getFeedback);
router.post('/', createFeedback);
router.put('/:id', updateFeedback);
router.delete('/:id', deleteFeedback);
router.post('/:id/respond', respondToFeedback);

module.exports = router;
