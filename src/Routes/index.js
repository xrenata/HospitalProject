const express = require("express");
const router = express.Router();
const { authenticateToken, authorizePermLevel } = require('../Modules/Functions/authMiddleware');

router.use("/auth", require("./AuthRouter")); // Ensure /auth routes are not protected
router.use(authenticateToken); // Protect all routes below this line

router.use("/appointments", authorizePermLevel(1), require("./AppointmentsRouter"));
router.use("/complaints", authorizePermLevel(1), require("./ComplaintsRouter"));
router.use("/departments", authorizePermLevel(2), require("./DepartmentsRouter"));
router.use("/equipment", authorizePermLevel(2), require("./EquipmentRouter"));
router.use("/hospitals", authorizePermLevel(3), require("./HospitalsRouter"));
router.use("/insurance", authorizePermLevel(2), require("./InsuranceRouter"));
router.use("/medications", authorizePermLevel(2), require("./MedicationsRouter"));
router.use("/patients", authorizePermLevel(1), require("./PatientsRouter"));
router.use("/rooms", authorizePermLevel(2), require("./RoomsRouter")); 
router.use("/staff-department", authorizePermLevel(3), require("./Staff_DepartmentRouter"));
router.use("/staff", authorizePermLevel(3), require("./StaffRouter"));
router.use("/surgeries", authorizePermLevel(2), require("./SurgeriesRouter"));
router.use("/surgery-team", authorizePermLevel(2), require("./Surgery_TeamRouter"));
router.use("/tests", authorizePermLevel(1), require("./TestsRouter"));
router.use("/treatments", authorizePermLevel(1), require("./TreatmentsRouter"));

module.exports = router;