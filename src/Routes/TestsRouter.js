const express = require('express');
const router = express.Router();
const {
    getAllTests,
    getTest,
    createTest,
    updateTest,
    deleteTest
} = require('../Controllers/Tests');

/**
 * @swagger
 * /api/tests:
 *   get:
 *     summary: List all tests.
 *     tags:
 *       - Tests
 *     responses:
 *       200:
 *         description: Successful retrieval of tests.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   test_id:
 *                     type: string
 *                     example: "test001"
 *                   name:
 *                     type: string
 *                     example: "Blood Test"
 *                   result:
 *                     type: string
 *                     example: "Normal"
 *       500:
 *         description: Server error
 */
router.get('/tests', getAllTests);

/**
 * @swagger
 * /api/tests/{test_id}:
 *   get:
 *     summary: Get a specific test.
 *     tags:
 *       - Tests
 *     parameters:
 *       - in: path
 *         name: test_id
 *         required: true
 *         description: The test ID.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of test.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 test_id:
 *                   type: string
 *                   example: "test001"
 *                 name:
 *                   type: string
 *                   example: "Blood Test"
 *                 result:
 *                   type: string
 *                   example: "Normal"
 *       500:
 *         description: Server error
 */
router.get('/tests/:test_id', getTest);

/**
 * @swagger
 * /api/tests:
 *   post:
 *     summary: Create a new test.
 *     tags:
 *       - Tests
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Blood Test"
 *               result:
 *                 type: string
 *                 example: "Normal"
 *     responses:
 *       201:
 *         description: Test created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 test_id:
 *                   type: string
 *                   example: "test001"
 *                 name:
 *                   type: string
 *                   example: "Blood Test"
 *                 result:
 *                   type: string
 *                   example: "Normal"
 *       500:
 *         description: Server error
 */
router.post('/tests', createTest);

/**
 * @swagger
 * /api/tests/{test_id}:
 *   put:
 *     summary: Update a specific test.
 *     tags:
 *       - Tests
 *     parameters:
 *       - in: path
 *         name: test_id
 *         required: true
 *         description: The test ID.
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
 *                 example: "Blood Test"
 *               result:
 *                 type: string
 *                 example: "Abnormal"
 *     responses:
 *       200:
 *         description: Test updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 test_id:
 *                   type: string
 *                   example: "test001"
 *                 name:
 *                   type: string
 *                   example: "Blood Test"
 *                 result:
 *                   type: string
 *                   example: "Abnormal"
 *       500:
 *         description: Server error
 */
router.put('/tests/:test_id', updateTest);

/**
 * @swagger
 * /api/tests/{test_id}:
 *   delete:
 *     summary: Delete a specific test.
 *     tags:
 *       - Tests
 *     parameters:
 *       - in: path
 *         name: test_id
 *         required: true
 *         description: The test ID.
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Test deleted successfully.
 *       500:
 *         description: Server error
 */
router.delete('/tests/:test_id', deleteTest);

module.exports = router;
