const express = require("express");
const router = express.Router();
const {
    getAllHospitals,
    getHospital,
    createHospital,
    updateHospital,
    deleteHospital
} = require("../Controllers/Hospital");

/**
 * @swagger
 * /api/hospitals:
 *   get:
 *     summary: List all hospitals
 *     tags:
 *       - Hospitals
 *     responses:
 *       200:
 *         description: Successful retrieval of hospitals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "1"
 *                   name:
 *                     type: string
 *                     example: "City General Hospital"
 *                   address:
 *                     type: string
 *                     example: "123 Healthcare Avenue"
 *                   phone:
 *                     type: string
 *                     example: "+90 555 123 4567"
 *                   capacity:
 *                     type: integer
 *                     example: 500
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
router.get("/", getAllHospitals);

/**
 * @swagger
 * /api/hospitals:
 *   post:
 *     summary: Create a new hospital
 *     tags:
 *       - Hospitals
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Memorial Hospital"
 *               address:
 *                 type: string
 *                 example: "456 Medical Street"
 *               phone:
 *                 type: string
 *                 example: "+90 555 987 6543"
 *               capacity:
 *                 type: integer
 *                 example: 300
 *     responses:
 *       201:
 *         description: Hospital created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hospital created successfully"
 *                 hospitalId:
 *                   type: string
 *                   example: "2"
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Name and address are required"
 */
router.post("/", createHospital);

/**
 * @swagger
 * /api/hospitals/{id}:
 *   get:
 *     summary: Get a specific hospital
 *     tags:
 *       - Hospitals
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the hospital
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of hospital
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "1"
 *                 name:
 *                   type: string
 *                   example: "City General Hospital"
 *                 address:
 *                   type: string
 *                   example: "123 Healthcare Avenue"
 *                 phone:
 *                   type: string
 *                   example: "+90 555 123 4567"
 *                 capacity:
 *                   type: integer
 *                   example: 500
 *       404:
 *         description: Hospital not found
 */
router.get("/:id", getHospital);

/**
 * @swagger
 * /api/hospitals/{id}:
 *   put:
 *     summary: Update a specific hospital
 *     tags:
 *       - Hospitals
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the hospital to update
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
 *                 example: "City General Hospital - East Wing"
 *               address:
 *                 type: string
 *                 example: "123 Healthcare Avenue"
 *               phone:
 *                 type: string
 *                 example: "+90 555 123 4567"
 *               capacity:
 *                 type: integer
 *                 example: 600
 *     responses:
 *       200:
 *         description: Hospital updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hospital updated successfully"
 *       404:
 *         description: Hospital not found
 */
router.put("/:id", updateHospital);

/**
 * @swagger
 * /api/hospitals/{id}:
 *   delete:
 *     summary: Delete a specific hospital
 *     tags:
 *       - Hospitals
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the hospital to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hospital deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hospital deleted successfully"
 *       404:
 *         description: Hospital not found
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
router.delete("/:id", deleteHospital);

module.exports = router;
