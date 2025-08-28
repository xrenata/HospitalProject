const { Prescription, Patient, Staff, Medication } = require('../Modules/Database/models');

const getAllPrescriptions = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, patientId, staffId } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (patientId) query.patientId = patientId;
        if (staffId) query.staffId = staffId;
        
        const prescriptions = await Prescription.find(query)
            .populate('patientId', 'firstName lastName tcNumber')
            .populate('staffId', 'name role')
            .populate('medicationId', 'name dosage')
            .sort({ prescriptionDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Prescription.countDocuments(query);

        res.status(200).json({
            success: true,
            data: prescriptions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getPrescription = async (req, res) => {
    try {
        const { id } = req.params;
        
        const prescription = await Prescription.findById(id)
            .populate('patientId', 'firstName lastName tcNumber phone')
            .populate('staffId', 'name role specialization')
            .populate('medicationId', 'name dosage manufacturer');
        
        if (!prescription) {
            return res.status(404).json({ 
                success: false,
                error: 'Prescription not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: prescription
        });
    } catch (error) {
        console.error('Error fetching prescription:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const createPrescription = async (req, res) => {
    try {
        const { 
            patientId, staffId, medicationId, medicationName, dosage, 
            frequency, duration, quantity, instructions, prescriptionDate,
            startDate, endDate, status, notes
        } = req.body;
        
        const newPrescription = new Prescription({
            patientId,
            patient_id: patientId,
            staffId,
            staff_id: staffId,
            medicationId,
            medication_id: medicationId,
            medicationName,
            medication_name: medicationName,
            dosage,
            frequency,
            duration,
            quantity,
            instructions,
            prescriptionDate,
            prescription_date: prescriptionDate,
            startDate,
            start_date: startDate,
            endDate,
            end_date: endDate,
            status: status || 'active',
            notes
        });
        
        const savedPrescription = await newPrescription.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Prescription created successfully', 
            prescriptionId: savedPrescription._id,
            data: savedPrescription
        });
    } catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const updatePrescription = async (req, res) => {
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
        if (updateData.medicationId) {
            updateData.medication_id = updateData.medicationId;
        }
        if (updateData.medicationName) {
            updateData.medication_name = updateData.medicationName;
        }
        if (updateData.prescriptionDate) {
            updateData.prescription_date = updateData.prescriptionDate;
        }
        if (updateData.startDate) {
            updateData.start_date = updateData.startDate;
        }
        if (updateData.endDate) {
            updateData.end_date = updateData.endDate;
        }
        
        updateData.updatedAt = new Date();
        updateData.updated_at = new Date();
        
        const updatedPrescription = await Prescription.findByIdAndUpdate(id, updateData, { new: true })
            .populate('patientId', 'firstName lastName')
            .populate('staffId', 'name role')
            .populate('medicationId', 'name');
        
        if (!updatedPrescription) {
            return res.status(404).json({ 
                success: false,
                error: 'Prescription not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Prescription updated successfully',
            data: updatedPrescription
        });
    } catch (error) {
        console.error('Error updating prescription:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const deletePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedPrescription = await Prescription.findByIdAndDelete(id);
        
        if (!deletedPrescription) {
            return res.status(404).json({ 
                success: false,
                error: 'Prescription not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Prescription deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting prescription:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    getAllPrescriptions,
    getPrescription,
    createPrescription,
    updatePrescription,
    deletePrescription
};