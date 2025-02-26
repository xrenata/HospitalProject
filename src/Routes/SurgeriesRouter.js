const express = require('express');
const router = express.Router();
const {
    getAllSurgeries,
    getSurgery,
    createSurgery,
    updateSurgery,
    deleteSurgery
} = require('../Controllers/Surgeries');

router.get('/surgeries', getAllSurgeries);
router.get('/surgeries/:surgery_id', getSurgery);
router.post('/surgeries', createSurgery);
router.put('/surgeries/:surgery_id', updateSurgery);
router.delete('/surgeries/:surgery_id', deleteSurgery);

module.exports = router;
