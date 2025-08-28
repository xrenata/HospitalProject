const { Feedback, Patient, Staff, Department } = require('../Modules/Database/models');

const getAllFeedback = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, type, rating, patientId, departmentId } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (type) query.feedbackType = type;
        if (rating) query.rating = parseInt(rating);
        if (patientId) query.patientId = patientId;
        if (departmentId) query.departmentId = departmentId;
        
        const feedback = await Feedback.find(query)
            .populate('patientId', 'firstName lastName tcNumber')
            .populate('staffId', 'name role')
            .populate('departmentId', 'name')
            .populate('respondedBy', 'name role')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Feedback.countDocuments(query);

        res.status(200).json({
            success: true,
            data: feedback,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        
        const feedback = await Feedback.findById(id)
            .populate('patientId', 'firstName lastName tcNumber phone email')
            .populate('staffId', 'name role specialization')
            .populate('departmentId', 'name location')
            .populate('respondedBy', 'name role');
        
        if (!feedback) {
            return res.status(404).json({ 
                success: false,
                error: 'Feedback not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: feedback
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const createFeedback = async (req, res) => {
    try {
        const { 
            patientId, staffId, departmentId, feedbackType, rating,
            title, comment, isAnonymous, status
        } = req.body;
        
        const newFeedback = new Feedback({
            patientId,
            patient_id: patientId,
            staffId,
            staff_id: staffId,
            departmentId,
            department_id: departmentId,
            feedbackType,
            feedback_type: feedbackType,
            rating,
            title,
            comment,
            isAnonymous: isAnonymous || false,
            is_anonymous: isAnonymous || false,
            status: status || 'pending'
        });
        
        const savedFeedback = await newFeedback.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Feedback created successfully', 
            feedbackId: savedFeedback._id,
            data: savedFeedback
        });
    } catch (error) {
        console.error('Error creating feedback:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const updateFeedback = async (req, res) => {
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
        if (updateData.feedbackType) {
            updateData.feedback_type = updateData.feedbackType;
        }
        if (updateData.isAnonymous !== undefined) {
            updateData.is_anonymous = updateData.isAnonymous;
        }
        if (updateData.respondedBy) {
            updateData.responded_by = updateData.respondedBy;
        }
        if (updateData.respondedAt) {
            updateData.responded_at = updateData.respondedAt;
        }
        
        updateData.updatedAt = new Date();
        updateData.updated_at = new Date();
        
        const updatedFeedback = await Feedback.findByIdAndUpdate(id, updateData, { new: true })
            .populate('patientId', 'firstName lastName')
            .populate('staffId', 'name role')
            .populate('departmentId', 'name')
            .populate('respondedBy', 'name role');
        
        if (!updatedFeedback) {
            return res.status(404).json({ 
                success: false,
                error: 'Feedback not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Feedback updated successfully',
            data: updatedFeedback
        });
    } catch (error) {
        console.error('Error updating feedback:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedFeedback = await Feedback.findByIdAndDelete(id);
        
        if (!deletedFeedback) {
            return res.status(404).json({ 
                success: false,
                error: 'Feedback not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Feedback deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const respondToFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { response, respondedBy } = req.body;
        
        const updateData = {
            response,
            respondedBy,
            responded_by: respondedBy,
            respondedAt: new Date(),
            responded_at: new Date(),
            status: 'acknowledged',
            updatedAt: new Date(),
            updated_at: new Date()
        };
        
        const updatedFeedback = await Feedback.findByIdAndUpdate(id, updateData, { new: true })
            .populate('patientId', 'firstName lastName')
            .populate('respondedBy', 'name role');
        
        if (!updatedFeedback) {
            return res.status(404).json({ 
                success: false,
                error: 'Feedback not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Response added successfully',
            data: updatedFeedback
        });
    } catch (error) {
        console.error('Error responding to feedback:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    getAllFeedback,
    getFeedback,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    respondToFeedback
};