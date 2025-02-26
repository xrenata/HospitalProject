const express = require('express');
const router = express.Router();
const {
    getAllTreatments,
    getTreatment,
    createTreatment,
    updateTreatment,
    deleteTreatment
} = require('../Controllers/Treatments');

router.get('/treatments', getAllTreatments);
router.get('/treatments/:treatment_id', getTreatment);
router.post('/treatments', createTreatment);
router.put('/treatments/:treatment_id', updateTreatment);
router.delete('/treatments/:treatment_id', deleteTreatment);

module.exports = router;
