const express = require('express');
const router = express.Router();
const {
    getAllStaff,
    getStaff,
    createStaff,
    updateStaff,
    deleteStaff
} = require('../Controllers/Staff');

router.get('/staff', getAllStaff);
router.get('/staff/:staff_id', getStaff);
router.post('/staff', createStaff);
router.put('/staff/:staff_id', updateStaff);
router.delete('/staff/:staff_id', deleteStaff);

module.exports = router;
