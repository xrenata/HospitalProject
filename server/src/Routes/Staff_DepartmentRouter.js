const express = require('express');
const router = express.Router();
const {
    getAllStaffDepartments,
    getStaffDepartment,
    createStaffDepartment,
    updateStaffDepartment,
    deleteStaffDepartment
} = require('../Controllers/Staff_Department');

/**
 * @swagger
 * /api/staff_departments:
 *   get:
 *     summary: List all staff departments.
 *     tags:
 *       - Staff Departments
 *     responses:
 *       200:
 *         description: Successful retrieval of staff departments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   staff_department_id:
 *                     type: string
 *                     example: "dept123"
 *                   name:
 *                     type: string
 *                     example: "Cardiology"
 *       500:
 *         description: Server error
 */
router.get('/staff_departments', getAllStaffDepartments);

/**
 * @swagger
 * /api/staff_departments/{staff_department_id}:
 *   get:
 *     summary: Get a specific staff department.
 *     tags:
 *       - Staff Departments
 *     parameters:
 *       - in: path
 *         name: staff_department_id
 *         required: true
 *         description: The staff department ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of the staff department.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 staff_department_id:
 *                   type: string
 *                   example: "dept123"
 *                 name:
 *                   type: string
 *                   example: "Cardiology"
 *       500:
 *         description: Server error
 */
router.get('/staff_departments/:staff_department_id', getStaffDepartment);

/**
 * @swagger
 * /api/staff_departments:
 *   post:
 *     summary: Create a new staff department.
 *     tags:
 *       - Staff Departments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Cardiology"
 *     responses:
 *       201:
 *         description: Staff department created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 staff_department_id:
 *                   type: string
 *                   example: "dept123"
 *                 name:
 *                   type: string
 *                   example: "Cardiology"
 *       500:
 *         description: Server error
 */
router.post('/staff_departments', createStaffDepartment);

/**
 * @swagger
 * /api/staff_departments/{staff_department_id}:
 *   put:
 *     summary: Update a specific staff department.
 *     tags:
 *       - Staff Departments
 *     parameters:
 *       - in: path
 *         name: staff_department_id
 *         required: true
 *         description: The staff department ID.
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
 *                 example: "Cardiology"
 *     responses:
 *       200:
 *         description: Staff department updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 staff_department_id:
 *                   type: string
 *                   example: "dept123"
 *                 name:
 *                   type: string
 *                   example: "Cardiology"
 *       500:
 *         description: Server error
 */
router.put('/staff_departments/:staff_department_id', updateStaffDepartment);

/**
 * @swagger
 * /api/staff_departments/{staff_department_id}:
 *   delete:
 *     summary: Delete a specific staff department.
 *     tags:
 *       - Staff Departments
 *     parameters:
 *       - in: path
 *         name: staff_department_id
 *         required: true
 *         description: The staff department ID.
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Staff department deleted successfully.
 *       500:
 *         description: Server error
 */
router.delete('/staff_departments/:staff_department_id', deleteStaffDepartment);

module.exports = router;
