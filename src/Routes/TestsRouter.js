const express = require('express');
const router = express.Router();
const {
    getAllTests,
    getTest,
    createTest,
    updateTest,
    deleteTest
} = require('../Controllers/Tests');

router.get('/tests', getAllTests);
router.get('/tests/:test_id', getTest);
router.post('/tests', createTest);
router.put('/tests/:test_id', updateTest);
router.delete('/tests/:test_id', deleteTest);

module.exports = router;
