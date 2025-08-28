const express = require('express');
const router = express.Router();
const {
    getAllStaff,
    getStaff,
    createStaff,
    updateStaff,
    deleteStaff
} = require('../Controllers/Staff');

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: List all staff members.
 *     tags:
 *       - Staff
 *     responses:
 *       200:
 *         description: Successful retrieval of staff.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   staff_id:
 *                     type: string
 *                     example: "staff001"
 *                   name:
 *                     type: string
 *                     example: "Jane Doe"
 *                   role:
 *                     type: string
 *                     example: "Nurse"
 *       500:
 *         description: Server error
 */
router.get('/', getAllStaff);

/**
 * @swagger
 * /api/staff/{staff_id}:
 *   get:
 *     summary: Get a specific staff member.
 *     tags:
 *       - Staff
 *     parameters:
 *       - in: path
 *         name: staff_id
 *         required: true
 *         description: The staff member ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of staff member.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 staff_id:
 *                   type: string
 *                   example: "staff001"
 *                 name:
 *                   type: string
 *                   example: "Jane Doe"
 *                 role:
 *                   type: string
 *                   example: "Nurse"
 *       500:
 *         description: Server error
 */
router.get('/:staff_id', getStaff);

/**
 * @swagger
 * /api/staff:
 *   post:
 *     summary: Create a new staff member.
 *     tags:
 *       - Staff
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Doe"
 *               role:
 *                 type: string
 *                 example: "Nurse"
 *     responses:
 *       201:
 *         description: Staff member created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 staff_id:
 *                   type: string
 *                   example: "staff001"
 *                 name:
 *                   type: string
 *                   example: "Jane Doe"
 *                 role:
 *                   type: string
 *                   example: "Nurse"
 *       500:
 *         description: Server error
 */
router.post('/', createStaff);

/**
 * @swagger
 * /api/staff/{staff_id}:
 *   put:
 *     summary: Update a specific staff member.
 *     tags:
 *       - Staff
 *     parameters:
 *       - in: path
 *         name: staff_id
 *         required: true
 *         description: The staff member ID.
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
 *                 example: "Jane Doe"
 *               role:
 *                 type: string
 *                 example: "Nurse"
 *     responses:
 *       200:
 *         description: Staff member updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 staff_id:
 *                   type: string
 *                   example: "staff001"
 *                 name:
 *                   type: string
 *                   example: "Jane Doe"
 *                 role:
 *                   type: string
 *                   example: "Nurse"
 *       500:
 *         description: Server error
 */
router.put('/:staff_id', updateStaff);

/**
 * @swagger
 * /api/staff/{staff_id}:
 *   delete:
 *     summary: Delete a specific staff member.
 *     tags:
 *       - Staff
 *     parameters:
 *       - in: path
 *         name: staff_id
 *         required: true
 *         description: The staff member ID.
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Staff member deleted successfully.
 *       500:
 *         description: Server error
 */
router.delete('/:staff_id', deleteStaff);

module.exports = router;
