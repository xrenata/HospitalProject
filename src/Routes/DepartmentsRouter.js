const express = require("express")
const router = express.Router()
const {
    getAllDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentStats
} = require("../Controllers/Departments")

/**
 * @swagger
 * /api/departments:
 *   get:
 *     summary: List all departments
 *     tags:
 *       - Departments
 *     responses:
 *       200:
 *         description: Successful retrieval of departments
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
 *                     example: "Cardiology"
 *                   description:
 *                     type: string
 *                     example: "Deals with disorders of the heart and cardiovascular system"
 *                   capacity:
 *                     type: integer
 *                     example: 50
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
router.get("/", getAllDepartments)

// GET /api/departments/stats - Get department statistics
router.get("/stats", getDepartmentStats)

/**
 * @swagger
 * /api/departments:
 *   post:
 *     summary: Create a new department
 *     tags:
 *       - Departments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Neurology"
 *               description:
 *                 type: string
 *                 example: "Deals with disorders of the nervous system"
 *               capacity:
 *                 type: integer
 *                 example: 30
 *     responses:
 *       201:
 *         description: Department created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Department created successfully"
 *                 departmentId:
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
 *                   example: "Name is required"
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
router.post("/", createDepartment)

/**
 * @swagger
 * /api/departments/{department_id}:
 *   get:
 *     summary: Get a specific department
 *     tags:
 *       - Departments
 *     parameters:
 *       - in: path
 *         name: department_id
 *         required: true
 *         description: ID of the department to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of department
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
 *                   example: "Cardiology"
 *                 description:
 *                   type: string
 *                   example: "Deals with disorders of the heart and cardiovascular system"
 *                 capacity:
 *                   type: integer
 *                   example: 50
 *       404:
 *         description: Department not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Department not found"
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
router.get("/:id", getDepartment)

/**
 * @swagger
 * /api/departments/{department_id}:
 *   put:
 *     summary: Update a specific department
 *     tags:
 *       - Departments
 *     parameters:
 *       - in: path
 *         name: department_id
 *         required: true
 *         description: ID of the department to update
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
 *                 example: "Cardiology Unit"
 *               description:
 *                 type: string
 *                 example: "Updated description for cardiology department"
 *               capacity:
 *                 type: integer
 *                 example: 60
 *     responses:
 *       200:
 *         description: Department updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Department updated successfully"
 *       404:
 *         description: Department not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Department not found"
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
router.put("/:id", updateDepartment)

/**
 * @swagger
 * /api/departments/{department_id}:
 *   delete:
 *     summary: Delete a specific department
 *     tags:
 *       - Departments
 *     parameters:
 *       - in: path
 *         name: department_id
 *         required: true
 *         description: ID of the department to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Department deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Department deleted successfully"
 *       404:
 *         description: Department not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Department not found"
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
router.delete("/:id", deleteDepartment)

module.exports = router