const express = require('express');
const router = express.Router();
const {
    getAllEquipment,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment
} = require('../Controllers/Equipment');

/**
 * @swagger
 * /api/equipment:
 *   get:
 *     summary: List all medical equipment
 *     tags:
 *       - Equipment
 *     responses:
 *       200:
 *         description: Successful retrieval of equipment
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
 *                     example: "MRI Machine"
 *                   type:
 *                     type: string
 *                     example: "Imaging"
 *                   status:
 *                     type: string
 *                     example: "operational"
 *                   departmentId:
 *                     type: string
 *                     example: "3"
 *                   lastMaintenance:
 *                     type: string
 *                     format: date
 *                     example: "2023-05-15"
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
router.get('/', getAllEquipment);

/**
 * @swagger
 * /api/equipment/{equipment_id}:
 *   get:
 *     summary: Get specific medical equipment by ID
 *     tags:
 *       - Equipment
 *     parameters:
 *       - in: path
 *         name: equipment_id
 *         required: true
 *         description: ID of the equipment to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of equipment
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
 *                   example: "MRI Machine"
 *                 type:
 *                   type: string
 *                   example: "Imaging"
 *                 status:
 *                   type: string
 *                   example: "operational"
 *                 departmentId:
 *                   type: string
 *                   example: "3"
 *                 lastMaintenance:
 *                   type: string
 *                   format: date
 *                   example: "2023-05-15"
 *       404:
 *         description: Equipment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Equipment not found"
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
router.get('/:equipment_id', getEquipmentById);

/**
 * @swagger
 * /api/equipment:
 *   post:
 *     summary: Create new medical equipment
 *     tags:
 *       - Equipment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: "CT Scanner"
 *               type:
 *                 type: string
 *                 example: "Imaging"
 *               status:
 *                 type: string
 *                 example: "operational"
 *               departmentId:
 *                 type: string
 *                 example: "3"
 *               lastMaintenance:
 *                 type: string
 *                 format: date
 *                 example: "2023-06-20"
 *     responses:
 *       201:
 *         description: Equipment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Equipment created successfully"
 *                 equipmentId:
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
 *                   example: "Name and type are required"
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
router.post('/', createEquipment);

/**
 * @swagger
 * /api/equipment/{equipment_id}:
 *   put:
 *     summary: Update specific medical equipment
 *     tags:
 *       - Equipment
 *     parameters:
 *       - in: path
 *         name: equipment_id
 *         required: true
 *         description: ID of the equipment to update
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
 *                 example: "MRI Scanner - Advanced"
 *               type:
 *                 type: string
 *                 example: "Imaging"
 *               status:
 *                 type: string
 *                 example: "maintenance"
 *               departmentId:
 *                 type: string
 *                 example: "3"
 *               lastMaintenance:
 *                 type: string
 *                 format: date
 *                 example: "2023-07-05"
 *     responses:
 *       200:
 *         description: Equipment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Equipment updated successfully"
 *       404:
 *         description: Equipment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Equipment not found"
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
router.put('/:equipment_id', updateEquipment);

/**
 * @swagger
 * /api/equipment/{equipment_id}:
 *   delete:
 *     summary: Delete specific medical equipment
 *     tags:
 *       - Equipment
 *     parameters:
 *       - in: path
 *         name: equipment_id
 *         required: true
 *         description: ID of the equipment to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Equipment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Equipment deleted successfully"
 *       404:
 *         description: Equipment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Equipment not found"
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
router.delete('/:equipment_id', deleteEquipment);

module.exports = router;
