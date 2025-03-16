const express = require('express');
const router = express.Router();
const ShiftsController = require('../Controllers/Shifts');

router.get('/', ShiftsController.getAllShifts);
router.get('/:id', ShiftsController.getShift);
router.post('/', ShiftsController.createShift);
router.put('/:id', ShiftsController.updateShift);
router.delete('/:id', ShiftsController.deleteShift);

module.exports = router;
