const express = require('express');
const router = express.Router();
const AppointmentsController = require('../Controllers/AppointmentsController');

router.get('/', AppointmentsController.getAllAppointments);
router.post('/', AppointmentsController.createAppointment);
router.get('/:id', AppointmentsController.getAppointment);
router.put('/:id', AppointmentsController.updateAppointment);
router.delete('/:id', AppointmentsController.deleteAppointment);

module.exports = router;