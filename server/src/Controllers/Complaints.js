const { Complaint, Patient, Staff } = require('../Modules/Database/models');

const getAllComplaints = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, priority, type } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (type) query.complaintType = type;
        
        const complaints = await Complaint.find(query)
            .populate('patientId', 'firstName lastName tcNumber')
            .populate('assignedTo', 'name role')
            .populate('resolvedBy', 'name role')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Complaint.countDocuments(query);

        res.status(200).json({
            success: true,
            data: complaints,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        
        const complaint = await Complaint.findById(id)
            .populate('patientId', 'firstName lastName tcNumber phone email')
            .populate('assignedTo', 'name role')
            .populate('resolvedBy', 'name role');
        
        if (!complaint) {
            return res.status(404).json({ 
                success: false,
                error: 'Complaint not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: complaint
        });
    } catch (error) {
        console.error('Error fetching complaint:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const createComplaint = async (req, res) => {
    try {
        const { 
            patientId, complaintType, title, description, priority 
        } = req.body;
        
        const newComplaint = new Complaint({
            patientId,
            patient_id: patientId,
            complaintType,
            complaint_type: complaintType,
            title,
            description,
            priority: priority || 'medium',
            status: 'pending'
        });
        
        const savedComplaint = await newComplaint.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Complaint created successfully', 
            complaintId: savedComplaint._id,
            data: savedComplaint
        });
    } catch (error) {
        console.error('Error creating complaint:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const updateComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        // Add compatibility fields
        if (updateData.patientId) {
            updateData.patient_id = updateData.patientId;
        }
        if (updateData.complaintType) {
            updateData.complaint_type = updateData.complaintType;
        }
        if (updateData.assignedTo) {
            updateData.assigned_to = updateData.assignedTo;
        }
        if (updateData.resolvedBy) {
            updateData.resolved_by = updateData.resolvedBy;
        }
        if (updateData.resolvedAt) {
            updateData.resolved_at = updateData.resolvedAt;
        }
        
        updateData.updatedAt = new Date();
        updateData.updated_at = new Date();
        
        const updatedComplaint = await Complaint.findByIdAndUpdate(id, updateData, { new: true })
            .populate('patientId', 'firstName lastName')
            .populate('assignedTo', 'name role')
            .populate('resolvedBy', 'name role');
        
        if (!updatedComplaint) {
            return res.status(404).json({ 
                success: false,
                error: 'Complaint not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Complaint updated successfully',
            data: updatedComplaint
        });
    } catch (error) {
        console.error('Error updating complaint:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const deleteComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedComplaint = await Complaint.findByIdAndDelete(id);
        
        if (!deletedComplaint) {
            return res.status(404).json({ 
                success: false,
                error: 'Complaint not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Complaint deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting complaint:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getComplaintsByUser = async (req, res) => {
    try {
        const { complainer_id } = req.params;
        
        const complaints = await Complaint.find({ patientId: complainer_id })
            .populate('patientId', 'firstName lastName')
            .populate('assignedTo', 'name role')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: complaints
        });
    } catch (error) {
        console.error('Error fetching user complaints:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getComplaintsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        
        const complaints = await Complaint.find({ status })
            .populate('patientId', 'firstName lastName')
            .populate('assignedTo', 'name role')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: complaints
        });
    } catch (error) {
        console.error('Error fetching complaints by status:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getComplaintsByDepartment = async (req, res) => {
    try {
        const { department_name } = req.params;
        
        // Find department by name and get complaints
        const complaints = await Complaint.find({ complaintType: department_name })
            .populate('patientId', 'firstName lastName')
            .populate('assignedTo', 'name role')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: complaints
        });
    } catch (error) {
        console.error('Error fetching complaints by department:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getComplaintsByUserAndStatus = async (req, res) => {
    try {
        const { complainer_id, status } = req.params;
        
        const complaints = await Complaint.find({ 
            patientId: complainer_id, 
            status 
        })
            .populate('patientId', 'firstName lastName')
            .populate('assignedTo', 'name role')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: complaints
        });
    } catch (error) {
        console.error('Error fetching complaints by user and status:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getComplaintsByUserAndDepartment = async (req, res) => {
    try {
        const { complainer_id, department_name } = req.params;
        
        const complaints = await Complaint.find({ 
            patientId: complainer_id, 
            complaintType: department_name 
        })
            .populate('patientId', 'firstName lastName')
            .populate('assignedTo', 'name role')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            data: complaints
        });
    } catch (error) {
        console.error('Error fetching complaints by user and department:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    getAllComplaints,
    getComplaint,
    createComplaint,
    updateComplaint,
    deleteComplaint,
    getComplaintsByUser,
    getComplaintsByStatus,
    getComplaintsByDepartment,
    getComplaintsByUserAndStatus,
    getComplaintsByUserAndDepartment
};