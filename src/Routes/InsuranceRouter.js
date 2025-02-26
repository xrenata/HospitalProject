const express = require('express');
const router = express.Router();
const {
    getAllInsurance,
    getInsurance,
    createInsurance,
    updateInsurance,
    deleteInsurance
} = require('../Controllers/Insurance');

router.get('/insurance', getAllInsurance);
router.get('/insurance/:insurance_id', getInsurance);
router.post('/insurance', createInsurance);
router.put('/insurance/:insurance_id', updateInsurance);
router.delete('/insurance/:insurance_id', deleteInsurance);

module.exports = router;
