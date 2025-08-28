const { Surgery, Patient, Staff, Department, Room } = require('../Modules/Database/models');

const getAllSurgeries = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, priority, departmentId, patientId, staffId } = req.query;
        
        let query = {};
        
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (departmentId) query.departmentId = departmentId;
        if (patientId) query.patientId = patientId;
        if (staffId) query.surgeonId = staffId;
        
        const surgeries = await Surgery.find(query)
            .populate('patientId', 'firstName lastName tcNumber')
            .populate('surgeonId', 'name role')
            .populate('departmentId', 'name')
            .populate('roomId', 'roomNumber')
            .populate('participants', 'name role')
            .sort({ surgeryDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Surgery.countDocuments(query);

        res.status(200).json({
            success: true,
            data: surgeries,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching surgeries:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getSurgery = async (req, res) => {
    try {
        const { surgery_id } = req.params;
        
        const surgery = await Surgery.findById(surgery_id)
            .populate('patientId', 'firstName lastName tcNumber phone email')
            .populate('surgeonId', 'name role specialization')
            .populate('departmentId', 'name location')
            .populate('roomId', 'roomNumber roomType')
            .populate('participants', 'name role specialization');
        
        if (!surgery) {
            return res.status(404).json({ 
                success: false,
                error: 'Surgery not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: surgery
        });
    } catch (error) {
        console.error('Error fetching surgery:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const createSurgery = async (req, res) => {
    try {
        const { 
            patientId, surgeonId, departmentId, roomId, surgeryType, surgeryName,
            surgeryDate, startTime, endTime, duration, participants, anesthesiaType,
            complications, outcome, notes, status, priority, cost
        } = req.body;
        
        const newSurgery = new Surgery({
            patientId,
            patient_id: patientId,
            surgeonId,
            surgeon_id: surgeonId,
            departmentId,
            department_id: departmentId,
            roomId,
            room_id: roomId,
            surgeryType,
            surgery_type: surgeryType,
            surgeryName,
            surgery_name: surgeryName,
            surgeryDate,
            surgery_date: surgeryDate,
            startTime,
            start_time: startTime,
            endTime,
            end_time: endTime,
            duration,
            participants: participants || [],
            anesthesiaType,
            anesthesia_type: anesthesiaType,
            complications,
            outcome,
            notes,
            status: status || 'scheduled',
            priority: priority || 'normal',
            cost
        });
        
        const savedSurgery = await newSurgery.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Surgery created successfully', 
            surgeryId: savedSurgery._id,
            data: savedSurgery
        });
    } catch (error) {
        console.error('Error creating surgery:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const updateSurgery = async (req, res) => {
    try {
        const { surgery_id } = req.params;
        const updateData = { ...req.body };
        
        // Add compatibility fields
        if (updateData.patientId) {
            updateData.patient_id = updateData.patientId;
        }
        if (updateData.surgeonId) {
            updateData.surgeon_id = updateData.surgeonId;
        }
        if (updateData.departmentId) {
            updateData.department_id = updateData.departmentId;
        }
        if (updateData.roomId) {
            updateData.room_id = updateData.roomId;
        }
        if (updateData.surgeryType) {
            updateData.surgery_type = updateData.surgeryType;
        }
        if (updateData.surgeryName) {
            updateData.surgery_name = updateData.surgeryName;
        }
        if (updateData.surgeryDate) {
            updateData.surgery_date = updateData.surgeryDate;
        }
        if (updateData.startTime) {
            updateData.start_time = updateData.startTime;
        }
        if (updateData.endTime) {
            updateData.end_time = updateData.endTime;
        }
        if (updateData.anesthesiaType) {
            updateData.anesthesia_type = updateData.anesthesiaType;
        }
        
        updateData.updatedAt = new Date();
        updateData.updated_at = new Date();
        
        const updatedSurgery = await Surgery.findByIdAndUpdate(surgery_id, updateData, { new: true })
            .populate('patientId', 'firstName lastName')
            .populate('surgeonId', 'name role')
            .populate('departmentId', 'name')
            .populate('roomId', 'roomNumber');
        
        if (!updatedSurgery) {
            return res.status(404).json({ 
                success: false,
                error: 'Surgery not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Surgery updated successfully',
            data: updatedSurgery
        });
    } catch (error) {
        console.error('Error updating surgery:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const deleteSurgery = async (req, res) => {
    try {
        const { surgery_id } = req.params;
        
        const deletedSurgery = await Surgery.findByIdAndDelete(surgery_id);
        
        if (!deletedSurgery) {
            return res.status(404).json({ 
                success: false,
                error: 'Surgery not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Surgery deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting surgery:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    getAllSurgeries,
    getSurgery,
    createSurgery,
    updateSurgery,
    deleteSurgery
};
