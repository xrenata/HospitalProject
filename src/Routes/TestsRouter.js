const express = require('express');
const router = express.Router();
const {
  getAllTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  getTestStats
} = require('../Controllers/Tests');

// GET /api/tests - Get all tests with filtering and pagination
router.get('/', getAllTests);

// GET /api/tests/stats - Get test statistics
router.get('/stats', getTestStats);

// GET /api/tests/:id - Get specific test
router.get('/:id', getTestById);

// POST /api/tests - Create new test
router.post('/', createTest);

// PUT /api/tests/:id - Update test
router.put('/:id', updateTest);

// PATCH /api/tests/:id - Partial update test
router.patch('/:id', updateTest);

// DELETE /api/tests/:id - Delete test
router.delete('/:id', deleteTest);

module.exports = router;