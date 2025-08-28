const { Equipment, Department, Room } = require('../Modules/Database/models');

const getAllEquipment = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, departmentId, roomId } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (departmentId) query.departmentId = departmentId;
        if (roomId) query.roomId = roomId;
        
        const equipment = await Equipment.find(query)
            .populate('departmentId', 'name')
            .populate('roomId', 'roomNumber')
            .sort({ name: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Equipment.countDocuments(query);

        res.status(200).json({
            success: true,
            data: equipment,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getEquipmentById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const equipment = await Equipment.findById(id)
            .populate('departmentId', 'name location')
            .populate('roomId', 'roomNumber roomType');
        
        if (!equipment) {
            return res.status(404).json({ 
                success: false,
                error: 'Equipment not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: equipment
        });
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const createEquipment = async (req, res) => {
    try {
        const { 
            name, description, departmentId, roomId, manufacturer, model,
            purchaseDate, warrantyExpiry, maintenanceSchedule, status, cost
        } = req.body;
        
        const newEquipment = new Equipment({
            name,
            description,
            departmentId,
            roomId,
            manufacturer,
            model,
            purchaseDate,
            warrantyExpiry,
            maintenanceSchedule,
            status: status || 'operational',
            cost
        });
        
        const savedEquipment = await newEquipment.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Equipment created successfully', 
            equipmentId: savedEquipment._id,
            data: savedEquipment
        });
    } catch (error) {
        console.error('Error creating equipment:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        updateData.updatedAt = new Date();
        
        const updatedEquipment = await Equipment.findByIdAndUpdate(id, updateData, { new: true })
            .populate('departmentId', 'name')
            .populate('roomId', 'roomNumber');
        
        if (!updatedEquipment) {
            return res.status(404).json({ 
                success: false,
                error: 'Equipment not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Equipment updated successfully',
            data: updatedEquipment
        });
    } catch (error) {
        console.error('Error updating equipment:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const deleteEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedEquipment = await Equipment.findByIdAndDelete(id);
        
        if (!deletedEquipment) {
            return res.status(404).json({ 
                success: false,
                error: 'Equipment not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Equipment deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting equipment:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    getAllEquipment,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment
};