const express = require('express');
const router = express.Router();
const {
    getAllSurgeryTeams,
    getSurgeryTeam,
    createSurgeryTeam,
    updateSurgeryTeam,
    deleteSurgeryTeam
} = require('../Controllers/Surgery_Team');

/**
 * @swagger
 * /api/surgery-team:
 *   get:
 *     summary: List all surgery teams.
 *     tags:
 *       - Surgery Team
 *     responses:
 *       200:
 *         description: Successful retrieval of surgery teams.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   surgery_team_id:
 *                     type: string
 *                     example: "team001"
 *                   members:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["dr123", "nurse456"]
 *       500:
 *         description: Server error
 */
router.get('/', getAllSurgeryTeams);

/**
 * @swagger
 * /api/surgery-team/{surgery_team_id}:
 *   get:
 *     summary: Get a specific surgery team.
 *     tags:
 *       - Surgery Team
 *     parameters:
 *       - in: path
 *         name: surgery_team_id
 *         required: true
 *         description: The surgery team ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of the surgery team.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 surgery_team_id:
 *                   type: string
 *                   example: "team001"
 *                 members:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["dr123", "nurse456"]
 *       500:
 *         description: Server error
 */
router.get('/:surgery_team_id', getSurgeryTeam);

/**
 * @swagger
 * /api/surgery-team:
 *   post:
 *     summary: Create a new surgery team.
 *     tags:
 *       - Surgery Team
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["dr123", "nurse456"]
 *     responses:
 *       201:
 *         description: Surgery team created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 surgery_team_id:
 *                   type: string
 *                   example: "team001"
 *                 members:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["dr123", "nurse456"]
 *       500:
 *         description: Server error
 */
router.post('/', createSurgeryTeam);

/**
 * @swagger
 * /api/surgery-team/{surgery_team_id}:
 *   put:
 *     summary: Update a specific surgery team.
 *     tags:
 *       - Surgery Team
 *     parameters:
 *       - in: path
 *         name: surgery_team_id
 *         required: true
 *         description: The surgery team ID.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["dr123", "nurse789"]
 *     responses:
 *       200:
 *         description: Surgery team updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 surgery_team_id:
 *                   type: string
 *                   example: "team001"
 *                 members:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["dr123", "nurse789"]
 *       500:
 *         description: Server error
 */
router.put('/:surgery_team_id', updateSurgeryTeam);

/**
 * @swagger
 * /api/surgery-team/{surgery_team_id}:
 *   delete:
 *     summary: Delete a specific surgery team.
 *     tags:
 *       - Surgery Team
 *     parameters:
 *       - in: path
 *         name: surgery_team_id
 *         required: true
 *         description: The surgery team ID.
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Surgery team deleted successfully.
 *       500:
 *         description: Server error
 */
router.delete('/:surgery_team_id', deleteSurgeryTeam);

module.exports = router;
