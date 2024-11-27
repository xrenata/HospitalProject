const express = require('express');
const router = express.Router();
const HospitalsController = require('../Controllers/Hospital');

router.get('/', HospitalsController.getAllHospitals);
router.post('/', HospitalsController.createHospital);
router.get('/:id', HospitalsController.getHospital);
router.put('/:id', HospitalsController.updateHospital);
router.delete('/:id', HospitalsController.deleteHospital);

module.exports = router;