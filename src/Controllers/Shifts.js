const { Shift, Staff, Department } = require('../Modules/Database/models');

const getAllShifts = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, staffId, departmentId, date } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (staffId) query.staffId = staffId;
        if (departmentId) query.departmentId = departmentId;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            query.shiftDate = { $gte: startDate, $lt: endDate };
        }
        
        const shifts = await Shift.find(query)
            .populate('staffId', 'name role')
            .populate('departmentId', 'name')
            .sort({ shiftDate: -1, startTime: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Shift.countDocuments(query);

        res.status(200).json({
            success: true,
            data: shifts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getShift = async (req, res) => {
    try {
        const { id } = req.params;
        
        const shift = await Shift.findById(id)
            .populate('staffId', 'name role specialization')
            .populate('departmentId', 'name location');
        
        if (!shift) {
            return res.status(404).json({ 
                success: false,
                error: 'Shift not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: shift
        });
    } catch (error) {
        console.error('Error fetching shift:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const createShift = async (req, res) => {
    try {
        const { 
            staffId, departmentId, shiftType, shiftDate, startTime, endTime,
            actualStartTime, actualEndTime, status, notes
        } = req.body;
        
        const newShift = new Shift({
            staffId,
            staff_id: staffId,
            departmentId,
            department_id: departmentId,
            shiftType,
            shift_type: shiftType,
            shiftDate,
            shift_date: shiftDate,
            startTime,
            start_time: startTime,
            endTime,
            end_time: endTime,
            actualStartTime,
            actual_start_time: actualStartTime,
            actualEndTime,
            actual_end_time: actualEndTime,
            status: status || 'scheduled',
            notes
        });
        
        const savedShift = await newShift.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Shift created successfully', 
            shiftId: savedShift._id,
            data: savedShift
        });
    } catch (error) {
        console.error('Error creating shift:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const updateShift = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        // Add compatibility fields
        if (updateData.staffId) {
            updateData.staff_id = updateData.staffId;
        }
        if (updateData.departmentId) {
            updateData.department_id = updateData.departmentId;
        }
        if (updateData.shiftType) {
            updateData.shift_type = updateData.shiftType;
        }
        if (updateData.shiftDate) {
            updateData.shift_date = updateData.shiftDate;
        }
        if (updateData.startTime) {
            updateData.start_time = updateData.startTime;
        }
        if (updateData.endTime) {
            updateData.end_time = updateData.endTime;
        }
        if (updateData.actualStartTime) {
            updateData.actual_start_time = updateData.actualStartTime;
        }
        if (updateData.actualEndTime) {
            updateData.actual_end_time = updateData.actualEndTime;
        }
        
        updateData.updatedAt = new Date();
        updateData.updated_at = new Date();
        
        const updatedShift = await Shift.findByIdAndUpdate(id, updateData, { new: true })
            .populate('staffId', 'name role')
            .populate('departmentId', 'name');
        
        if (!updatedShift) {
            return res.status(404).json({ 
                success: false,
                error: 'Shift not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Shift updated successfully',
            data: updatedShift
        });
    } catch (error) {
        console.error('Error updating shift:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const deleteShift = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedShift = await Shift.findByIdAndDelete(id);
        
        if (!deletedShift) {
            return res.status(404).json({ 
                success: false,
                error: 'Shift not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Shift deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting shift:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    getAllShifts,
    getShift,
    createShift,
    updateShift,
    deleteShift
};