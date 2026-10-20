const express = require("express");
const router = express.Router();
const { authenticateToken, authorizeResource } = require('../Modules/Functions/authMiddleware');
const { hospitalContext } = require('../Modules/Functions/hospitals');

router.use("/auth", require("./AuthRouter")); // Ensure /auth routes are not protected
router.use(authenticateToken); // Protect all routes below this line
router.use(hospitalContext); // everything below runs inside the chosen hospital (X-Hospital-Id header)

// Some controllers answer lists as { data: [...] }, others as { complaints: [...] }; the pages expect the
// latter for several resources. Add the named key alongside `data` so both shapes work.
const LIST_KEYS = {
    complaints: 'complaints', equipment: 'equipment', feedback: 'feedback', insurance: 'insurance',
    medications: 'medications', prescriptions: 'prescriptions', rooms: 'rooms', shifts: 'shifts',
    surgeries: 'surgeries', 'surgery-team': 'surgeryTeams', treatments: 'treatments', visits: 'visits',
    staff: 'staff', departments: 'departments', hospitals: 'hospital'
};
router.use((req, res, next) => {
    const match = req.method === 'GET' && /^\/([^/]+)\/?$/.exec(req.path);
    const key = match && LIST_KEYS[match[1]];
    if (!key) return next();
    const json = res.json.bind(res);
    res.json = (body) => {
        if (body && Array.isArray(body.data) && !(key in body)) body = { ...body, [key]: body.data };
        return json(body);
    };
    next();
});

// Every resource is guarded by its own permissions: GET needs "<resource>.view", POST ".create",
// PUT/PATCH ".edit" and DELETE ".delete". Roles decide who holds which (see /api/access).
// `readAny` marks reference data other screens need for dropdowns; those handlers limit what they return.
router.use("/dashboard", require("./DashboardRouter")); // per-entity checks happen inside

// Patient Management
router.use("/patients", authorizeResource("patients"), require("./PatientsRouter"));
router.use("/appointments", authorizeResource("appointments"), require("./AppointmentsRouter"));
router.use("/visits", authorizeResource("visits"), require("./VisitsRouter"));

// Medical Operations
router.use("/tests", authorizeResource("tests"), require("./TestsRouter"));
router.use("/treatments", authorizeResource("treatments"), require("./TreatmentsRouter"));
router.use("/prescriptions", authorizeResource("prescriptions"), require("./PrescriptionsRouter"));
router.use("/surgeries", authorizeResource("surgeries"), require("./SurgeriesRouter"));

// Hospital Management
router.use("/staff", authorizeResource("staff", { readAny: true }), require("./StaffRouter"));
router.use("/departments", authorizeResource("departments", { readAny: true }), require("./DepartmentsRouter"));
router.use("/rooms", authorizeResource("rooms", { readAny: true }), require("./RoomsRouter"));
router.use("/shifts", authorizeResource("shifts"), require("./ShiftsRouter"));
router.use("/staff-department", authorizeResource("staff"), require("./Staff_DepartmentRouter"));
router.use("/surgery-team", authorizeResource("surgery_teams"), require("./Surgery_TeamRouter"));

// Inventory & Equipment
router.use("/medications", authorizeResource("medications", { readAny: true }), require("./MedicationsRouter"));
router.use("/equipment", authorizeResource("equipment"), require("./EquipmentRouter"));

// Communication & Feedback
router.use("/notifications", authorizeResource("notifications"), require("./NotificationsRouter"));
router.use("/complaints", authorizeResource("complaints"), require("./ComplaintsRouter"));
router.use("/feedback", authorizeResource("feedback"), require("./FeedbackRouter"));

// Analytics & Reports
router.use("/analytics", authorizeResource("analytics"), require("./AnalyticsRouter"));
router.use("/reports", authorizeResource("reports"), require("./ReportsRouter"));

// Administration
router.use("/insurance", authorizeResource("insurance"), require("./InsuranceRouter"));
router.use("/hospitals", authorizeResource("hospital", { readAny: true }), require("./HospitalsRouter"));
// Added modules (generic CRUD, each behind its own permission)
const modules = require("./ModulesRouter");
router.use("/billing", authorizeResource("billing"), modules.invoices);
router.use("/blood-bank", authorizeResource("blood_bank", { readAny: false }), modules.blood);
router.use("/maintenance", authorizeResource("maintenance"), modules.maintenance);
router.use("/incidents", authorizeResource("incidents"), modules.incidents);
router.use("/ambulances", authorizeResource("ambulances"), modules.ambulances);
router.use("/patient-records", require("./PatientRecordsRouter")); // add / change / remove things in a patient's file (checked per record type)
router.use("/access", require("./AccessRouter")); // roles, permission catalog, per-person access, audit log

module.exports = router;
