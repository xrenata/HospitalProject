const express = require('express');
const router = express.Router();
const {
    getAllPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient
} = require('../Controllers/Patients');

router.get('/patients', getAllPatients);
router.get('/patients/:patient_id', getPatient);
router.post('/patients', createPatient);
router.put('/patients/:patient_id', updatePatient);
router.delete('/patients/:patient_id', deletePatient);

module.exports = router;
