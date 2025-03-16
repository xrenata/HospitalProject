const express = require('express');
const router = express.Router();
const VisitsController = require('../Controllers/Visits');

router.get('/', VisitsController.getAllVisits);
router.get('/:id', VisitsController.getVisit);
router.post('/', VisitsController.createVisit);
router.put('/:id', VisitsController.updateVisit);
router.delete('/:id', VisitsController.deleteVisit);

module.exports = router;
