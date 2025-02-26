const express = require("express")
const router = express.Router()
const {
    getAllDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment
} = require("../Controllers/Departments")

router.get("/departments", getAllDepartments)
router.post("/departments", createDepartment)
router.get("/departments/:department_id", getDepartment)
router.put("/departments/:department_id", updateDepartment)
router.delete("/departments/:department_id", deleteDepartment)

module.exports = router