const express = require('express');
const router = express.Router();
const {
    getAllInsurance,
    getInsurance,
    createInsurance,
    updateInsurance,
    deleteInsurance
} = require('../Controllers/Insurance');

/**
 * @swagger
 * /api/insurance:
 *   get:
 *     summary: List all insurance policies.
 *     tags:
 *       - Insurance
 *     responses:
 *       200:
 *         description: Successful retrieval of insurance policies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "abc123"
 *                   policyNumber:
 *                     type: string
 *                     example: "POL-00123"
 *                   provider:
 *                     type: string
 *                     example: "Insurance Co."
 *                   coverage:
 *                     type: string
 *                     example: "Full"
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
router.get('/', getAllInsurance);

/**
 * @swagger
 * /api/insurance:
 *   post:
 *     summary: Create a new insurance policy.
 *     tags:
 *       - Insurance
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               policyNumber:
 *                 type: string
 *                 example: "POL-00123"
 *               provider:
 *                 type: string
 *                 example: "Insurance Co."
 *               coverage:
 *                 type: string
 *                 example: "Full"
 *     responses:
 *       201:
 *         description: Insurance policy created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "abc123"
 *                 policyNumber:
 *                   type: string
 *                   example: "POL-00123"
 *                 provider:
 *                   type: string
 *                   example: "Insurance Co."
 *                 coverage:
 *                   type: string
 *                   example: "Full"
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
router.post('/', createInsurance);

/**
 * @swagger
 * /api/insurance/{id}:
 *   get:
 *     summary: Get a specific insurance policy.
 *     tags:
 *       - Insurance
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The insurance policy ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful retrieval of insurance policy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "abc123"
 *                 policyNumber:
 *                   type: string
 *                   example: "POL-00123"
 *                 provider:
 *                   type: string
 *                   example: "Insurance Co."
 *                 coverage:
 *                   type: string
 *                   example: "Full"
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
router.get('/:id', getInsurance);

/**
 * @swagger
 * /api/insurance/{id}:
 *   put:
 *     summary: Update a specific insurance policy.
 *     tags:
 *       - Insurance
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The insurance policy ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               policyNumber:
 *                 type: string
 *                 example: "POL-00123"
 *               provider:
 *                 type: string
 *                 example: "Insurance Co."
 *               coverage:
 *                 type: string
 *                 example: "Full"
 *     responses:
 *       200:
 *         description: Insurance policy updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "abc123"
 *                 policyNumber:
 *                   type: string
 *                   example: "POL-00123"
 *                 provider:
 *                   type: string
 *                   example: "Insurance Co."
 *                 coverage:
 *                   type: string
 *                   example: "Full"
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
router.put('/:id', updateInsurance);

/**
 * @swagger
 * /api/insurance/{id}:
 *   delete:
 *     summary: Delete a specific insurance policy.
 *     tags:
 *       - Insurance
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The insurance policy ID
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Insurance policy deleted successfully
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
router.delete('/:id', deleteInsurance);

module.exports = router;
