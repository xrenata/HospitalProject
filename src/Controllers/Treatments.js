const { Treatment, Patient, Staff } = require('../Modules/Database/models');

const getAllTreatments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, patientId, staffId } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (patientId) query.patientId = patientId;
        if (staffId) query.staffId = staffId;
        
        const treatments = await Treatment.find(query)
            .populate('patientId', 'firstName lastName tcNumber')
            .populate('staffId', 'name role')
            .sort({ startDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Treatment.countDocuments(query);

        res.status(200).json({
            success: true,
            data: treatments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        console.error('Error fetching treatments:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getTreatment = async (req, res) => {
    try {
        const { treatment_id } = req.params;
        
        const treatment = await Treatment.findById(treatment_id)
            .populate('patientId', 'firstName lastName tcNumber phone email')
            .populate('staffId', 'name role specialization');
        
        if (!treatment) {
            return res.status(404).json({ 
                success: false,
                error: 'Treatment not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: treatment
        });
    } catch (error) {
        console.error('Error fetching treatment:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const createTreatment = async (req, res) => {
    try {
        const { 
            patientId, staffId, treatmentType, diagnosis, description,
            medication, startDate, endDate, status, cost, notes
        } = req.body;
        
        const newTreatment = new Treatment({
            patientId,
            staffId,
            treatmentType,
            diagnosis,
            description,
            medication,
            startDate,
            endDate,
            status: status || 'ongoing',
            cost,
            notes
        });
        
        const savedTreatment = await newTreatment.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Treatment created successfully', 
            treatmentId: savedTreatment._id,
            data: savedTreatment
        });
    } catch (error) {
        console.error('Error creating treatment:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const updateTreatment = async (req, res) => {
    try {
        const { treatment_id } = req.params;
        const updateData = { ...req.body };
        
        updateData.updatedAt = new Date();
        
        const updatedTreatment = await Treatment.findByIdAndUpdate(treatment_id, updateData, { new: true })
            .populate('patientId', 'firstName lastName')
            .populate('staffId', 'name role');
        
        if (!updatedTreatment) {
            return res.status(404).json({ 
                success: false,
                error: 'Treatment not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Treatment updated successfully',
            data: updatedTreatment
        });
    } catch (error) {
        console.error('Error updating treatment:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const deleteTreatment = async (req, res) => {
    try {
        const { treatment_id } = req.params;
        
        const deletedTreatment = await Treatment.findByIdAndDelete(treatment_id);
        
        if (!deletedTreatment) {
            return res.status(404).json({ 
                success: false,
                error: 'Treatment not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Treatment deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting treatment:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    getAllTreatments,
    getTreatment,
    createTreatment,
    updateTreatment,
    deleteTreatment
};