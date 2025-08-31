const express = require("express")
const router = express.Router()
const {
    getAllComplaints,
    getComplaint,
    createComplaint,
    updateComplaint,
    deleteComplaint
} = require("../Controllers/Complaints")

/**
 * @swagger
 * /api/complaints:
 *   get:
 *     summary: List all complaints
 *     tags:
 *       - Complaints
 *     responses:
 *       200:
 *         description: Successful retrieval of complaints
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "5f8d0e352a8a9a0b9cde1234"
 *                   patientId:
 *                     type: string
 *                     example: "5f8d0e352a8a9a0b9cde5678"
 *                   description:
 *                     type: string
 *                     example: "Severe headache and dizziness"
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-04-20T14:00:00Z"
 *                   status:
 *                     type: string
 *                     example: "active"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database query failed"
 */
router.get("/", getAllComplaints)

/**
 * @swagger
 * /api/complaints/{complaint_id}:
 *   get:
 *     summary: Get a specific complaint
 *     tags:
 *       - Complaints
 *     parameters:
 *       - in: path
 *         name: complaint_id
 *         required: true
 *         description: ID of the complaint to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of complaint
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "5f8d0e352a8a9a0b9cde1234"
 *                 patientId:
 *                   type: string
 *                   example: "5f8d0e352a8a9a0b9cde5678"
 *                 description:
 *                   type: string
 *                   example: "Severe headache and dizziness"
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-04-20T14:00:00Z"
 *                 status:
 *                   type: string
 *                   example: "active"
 *       404:
 *         description: Complaint not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Complaint not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database query failed"
 */
router.get("/:id", getComplaint)

/**
 * @swagger
 * /api/complaints:
 *   post:
 *     summary: Create a new complaint
 *     tags:
 *       - Complaints
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - description
 *             properties:
 *               patientId:
 *                 type: string
 *                 example: "5f8d0e352a8a9a0b9cde5678"
 *               description:
 *                 type: string
 *                 example: "Severe headache and dizziness"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-04-20T14:00:00Z"
 *               status:
 *                 type: string
 *                 example: "active"
 *     responses:
 *       201:
 *         description: Complaint created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Complaint created successfully"
 *                 complaintId:
 *                   type: string
 *                   example: "5f8d0e352a8a9a0b9cde1234"
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing required fields"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database query failed"
 */
router.post("/", createComplaint)

/**
 * @swagger
 * /api/complaints/{complaint_id}:
 *   put:
 *     summary: Update a specific complaint
 *     tags:
 *       - Complaints
 *     parameters:
 *       - in: path
 *         name: complaint_id
 *         required: true
 *         description: ID of the complaint to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: string
 *                 example: "5f8d0e352a8a9a0b9cde5678"
 *               description:
 *                 type: string
 *                 example: "Severe headache and dizziness with nausea"
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2023-04-20T14:00:00Z"
 *               status:
 *                 type: string
 *                 example: "resolved"
 *     responses:
 *       200:
 *         description: Complaint updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Complaint updated successfully"
 *       404:
 *         description: Complaint not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Complaint not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database query failed"
 */
router.put("/:id", updateComplaint)

/**
 * @swagger
 * /api/complaints/{complaint_id}:
 *   delete:
 *     summary: Delete a specific complaint
 *     tags:
 *       - Complaints
 *     parameters:
 *       - in: path
 *         name: complaint_id
 *         required: true
 *         description: ID of the complaint to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Complaint deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Complaint deleted successfully"
 *       404:
 *         description: Complaint not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Complaint not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database query failed"
 */
router.delete("/:id", deleteComplaint)

module.exports = router
