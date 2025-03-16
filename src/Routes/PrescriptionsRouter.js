const express = require('express');
const router = express.Router();
const PrescriptionsController = require('../Controllers/Prescriptions');

router.get('/', PrescriptionsController.getAllPrescriptions);
router.get('/:id', PrescriptionsController.getPrescription);
router.post('/', PrescriptionsController.createPrescription);
router.put('/:id', PrescriptionsController.updatePrescription);
router.delete('/:id', PrescriptionsController.deletePrescription);

module.exports = router;
