const express = require('express');
const router = express.Router();
const {
    getAllStaffDepartments,
    getStaffDepartment,
    createStaffDepartment,
    updateStaffDepartment,
    deleteStaffDepartment
} = require('../Controllers/Staff_Department');

router.get('/staff_departments', getAllStaffDepartments);
router.get('/staff_departments/:staff_department_id', getStaffDepartment);
router.post('/staff_departments', createStaffDepartment);
router.put('/staff_departments/:staff_department_id', updateStaffDepartment);
router.delete('/staff_departments/:staff_department_id', deleteStaffDepartment);

module.exports = router;
