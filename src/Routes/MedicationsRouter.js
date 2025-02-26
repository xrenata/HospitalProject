const express = require('express');
const router = express.Router();
const {
    getAllMedications,
    getMedication,
    createMedication,
    updateMedication,
    deleteMedication
} = require('../Controllers/Medications');

router.get('/medications', getAllMedications);
router.get('/medications/:medication_id', getMedication);
router.post('/medications', createMedication);
router.put('/medications/:medication_id', updateMedication);
router.delete('/medications/:medication_id', deleteMedication);

module.exports = router;
