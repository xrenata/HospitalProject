const express = require("express");
const router = express.Router();

router.use("/appointments", require("./AppointmentsRouter"));
router.use("/complaints", require("./ComplaintsRouter"));
router.use("/departments", require("./DepartmentsRouter"));
router.use("/equipment", require("./EquipmentRouter"));
router.use("/hospitals", require("./HospitalsRouter"));
router.use("/insurance", require("./InsuranceRouter"));
router.use("/medications", require("./MedicationsRouter"));
router.use("/patients", require("./PatientsRouter"));
router.use("/rooms", require("./RoomsRouter")); 
router.use("/staff-department", require("./Staff_DepartmentRouter"));
router.use("/staff", require("./StaffRouter"));
router.use("/surgeries", require("./SurgeriesRouter"));
router.use("/surgery-team", require("./Surgery_TeamRouter"));
router.use("/tests", require("./TestsRouter"));
router.use("/treatments", require("./TreatmentsRouter"));

module.exports = router;