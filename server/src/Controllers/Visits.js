const { Visit, Patient, Staff, Department } = require('../Modules/Database/models');

const getAllVisits = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, patientId, staffId, departmentId } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (patientId) query.patientId = patientId;
        if (staffId) query.staffId = staffId;
        if (departmentId) query.departmentId = departmentId;
        
        const visits = await Visit.find(query)
            .populate('patientId', 'firstName lastName tcNumber')
            .populate('staffId', 'name role')
            .populate('departmentId', 'name')
            .sort({ visitDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Visit.countDocuments(query);

        res.status(200).json({
            success: true,
            data: visits,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        console.error('Error fetching visits:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getVisit = async (req, res) => {
    try {
        const { id } = req.params;
        
        const visit = await Visit.findById(id)
            .populate('patientId', 'firstName lastName tcNumber phone email')
            .populate('staffId', 'name role specialization')
            .populate('departmentId', 'name location');
        
        if (!visit) {
            return res.status(404).json({ 
                success: false,
                error: 'Visit not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: visit
        });
    } catch (error) {
        console.error('Error fetching visit:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const createVisit = async (req, res) => {
    try {
        const { 
            patientId, staffId, departmentId, visitDate, visitTime, 
            visitType, reason, diagnosis, treatment, prescriptions, 
            nextVisit, status, notes, cost
        } = req.body;
        
        const newVisit = new Visit({
            patientId,
            patient_id: patientId,
            staffId,
            staff_id: staffId,
            departmentId,
            department_id: departmentId,
            visitDate,
            visit_date: visitDate,
            visitTime,
            visit_time: visitTime,
            visitType,
            visit_type: visitType,
            reason,
            diagnosis,
            treatment,
            prescriptions,
            nextVisit,
            next_visit: nextVisit,
            status: status || 'scheduled',
            notes,
            cost
        });
        
        const savedVisit = await newVisit.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Visit created successfully', 
            visitId: savedVisit._id,
            data: savedVisit
        });
    } catch (error) {
        console.error('Error creating visit:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const updateVisit = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        // Add compatibility fields
        if (updateData.patientId) {
            updateData.patient_id = updateData.patientId;
        }
        if (updateData.staffId) {
            updateData.staff_id = updateData.staffId;
        }
        if (updateData.departmentId) {
            updateData.department_id = updateData.departmentId;
        }
        if (updateData.visitDate) {
            updateData.visit_date = updateData.visitDate;
        }
        if (updateData.visitTime) {
            updateData.visit_time = updateData.visitTime;
        }
        if (updateData.visitType) {
            updateData.visit_type = updateData.visitType;
        }
        if (updateData.nextVisit) {
            updateData.next_visit = updateData.nextVisit;
        }
        
        updateData.updatedAt = new Date();
        updateData.updated_at = new Date();
        
        const updatedVisit = await Visit.findByIdAndUpdate(id, updateData, { new: true })
            .populate('patientId', 'firstName lastName')
            .populate('staffId', 'name role')
            .populate('departmentId', 'name');
        
        if (!updatedVisit) {
            return res.status(404).json({ 
                success: false,
                error: 'Visit not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Visit updated successfully',
            data: updatedVisit
        });
    } catch (error) {
        console.error('Error updating visit:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const deleteVisit = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedVisit = await Visit.findByIdAndDelete(id);
        
        if (!deletedVisit) {
            return res.status(404).json({ 
                success: false,
                error: 'Visit not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Visit deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting visit:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    getAllVisits,
    getVisit,
    createVisit,
    updateVisit,
    deleteVisit
};