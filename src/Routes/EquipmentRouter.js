const express = require('express');
const router = express.Router();
const {
    getAllEquipment,
    getEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment
} = require('../Controllers/Equipment');

router.get('/equipment', getAllEquipment);
router.get('/equipment/:equipment_id', getEquipment);
router.post('/equipment', createEquipment);
router.put('/equipment/:equipment_id', updateEquipment);
router.delete('/equipment/:equipment_id', deleteEquipment);

module.exports = router;
