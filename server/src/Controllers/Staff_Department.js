const { Staff, Department } = require('../Modules/Database/models');

const getAllStaffDepartments = async (req, res) => {
    try {
        const { page = 1, limit = 10, departmentId, staffId } = req.query;
        
        let query = {};
        if (departmentId) query.departmentId = departmentId;
        if (staffId) query._id = staffId;
        
        const staffDepartments = await Staff.find(query)
            .populate('departmentId', 'name')
            .sort({ name: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Staff.countDocuments(query);

        res.status(200).json({
            success: true,
            data: staffDepartments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        console.error('Error fetching staff departments:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getStaffDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        
        const staffDepartment = await Staff.findById(id)
            .populate('departmentId', 'name location phone email');
        
        if (!staffDepartment) {
            return res.status(404).json({ 
                success: false,
                error: 'Staff department relation not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: staffDepartment
        });
    } catch (error) {
        console.error('Error fetching staff department:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const createStaffDepartment = async (req, res) => {
    try {
        const { staffId, departmentId } = req.body;
        
        // Update staff member's department
        const updatedStaff = await Staff.findByIdAndUpdate(
            staffId, 
            { 
                departmentId,
                department_id: departmentId,
                updatedAt: new Date(),
                updated_at: new Date()
            }, 
            { new: true }
        ).populate('departmentId', 'name');
        
        if (!updatedStaff) {
            return res.status(404).json({ 
                success: false,
                error: 'Staff member not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Staff department assignment created successfully',
            data: updatedStaff
        });
    } catch (error) {
        console.error('Error creating staff department assignment:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const updateStaffDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { departmentId } = req.body;
        
        const updatedStaff = await Staff.findByIdAndUpdate(
            id, 
            { 
                departmentId,
                department_id: departmentId,
                updatedAt: new Date(),
                updated_at: new Date()
            }, 
            { new: true }
        ).populate('departmentId', 'name');
        
        if (!updatedStaff) {
            return res.status(404).json({ 
                success: false,
                error: 'Staff member not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Staff department assignment updated successfully',
            data: updatedStaff
        });
    } catch (error) {
        console.error('Error updating staff department assignment:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const deleteStaffDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Remove department assignment from staff
        const updatedStaff = await Staff.findByIdAndUpdate(
            id, 
            { 
                $unset: { departmentId: 1, department_id: 1 },
                updatedAt: new Date(),
                updated_at: new Date()
            }, 
            { new: true }
        );
        
        if (!updatedStaff) {
            return res.status(404).json({ 
                success: false,
                error: 'Staff member not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Staff department assignment removed successfully' 
        });
    } catch (error) {
        console.error('Error removing staff department assignment:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    getAllStaffDepartments,
    getStaffDepartment,
    createStaffDepartment,
    updateStaffDepartment,
    deleteStaffDepartment
};