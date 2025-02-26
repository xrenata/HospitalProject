const express = require("express")
const router = express.Router()
const {
    getAllComplaints,
    getComplaint,
    createComplaint,
    updateComplaint,
    deleteComplaint
} = require("../Controllers/Complaints")

router.get("/complaints", getAllComplaints)
router.get("/complaints/:complaint_id", getComplaint)
router.post("/complaints", createComplaint)
router.put("/complaints/:complaint_id", updateComplaint)
router.delete("/complaints/:complaint_id", deleteComplaint)

module.exports = router
