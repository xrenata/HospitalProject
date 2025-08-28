const { Insurance, Patient } = require('../Modules/Database/models');

const getAllInsurance = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, patientId, company } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (patientId) query.patientId = patientId;
        if (company) query.insuranceCompany = { $regex: company, $options: 'i' };
        
        const insurance = await Insurance.find(query)
            .populate('patientId', 'firstName lastName tcNumber')
            .sort({ startDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Insurance.countDocuments(query);

        res.status(200).json({
            success: true,
            data: insurance,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        console.error('Error fetching insurance:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getInsurance = async (req, res) => {
    try {
        const { id } = req.params;
        
        const insurance = await Insurance.findById(id)
            .populate('patientId', 'firstName lastName tcNumber phone email');
        
        if (!insurance) {
            return res.status(404).json({ 
                success: false,
                error: 'Insurance not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: insurance
        });
    } catch (error) {
        console.error('Error fetching insurance:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const createInsurance = async (req, res) => {
    try {
        const { 
            patientId, insuranceCompany, policyNumber, coverageType,
            coverageAmount, deductible, startDate, endDate, status, notes
        } = req.body;
        
        const newInsurance = new Insurance({
            patientId,
            patient_id: patientId,
            insuranceCompany,
            insurance_company: insuranceCompany,
            policyNumber,
            policy_number: policyNumber,
            coverageType,
            coverage_type: coverageType,
            coverageAmount,
            coverage_amount: coverageAmount,
            deductible: deductible || 0,
            startDate,
            start_date: startDate,
            endDate,
            end_date: endDate,
            status: status || 'active',
            notes
        });
        
        const savedInsurance = await newInsurance.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Insurance created successfully', 
            insuranceId: savedInsurance._id,
            data: savedInsurance
        });
    } catch (error) {
        console.error('Error creating insurance:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const updateInsurance = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        // Add compatibility fields
        if (updateData.patientId) {
            updateData.patient_id = updateData.patientId;
        }
        if (updateData.insuranceCompany) {
            updateData.insurance_company = updateData.insuranceCompany;
        }
        if (updateData.policyNumber) {
            updateData.policy_number = updateData.policyNumber;
        }
        if (updateData.coverageType) {
            updateData.coverage_type = updateData.coverageType;
        }
        if (updateData.coverageAmount) {
            updateData.coverage_amount = updateData.coverageAmount;
        }
        if (updateData.startDate) {
            updateData.start_date = updateData.startDate;
        }
        if (updateData.endDate) {
            updateData.end_date = updateData.endDate;
        }
        
        updateData.updatedAt = new Date();
        updateData.updated_at = new Date();
        
        const updatedInsurance = await Insurance.findByIdAndUpdate(id, updateData, { new: true })
            .populate('patientId', 'firstName lastName');
        
        if (!updatedInsurance) {
            return res.status(404).json({ 
                success: false,
                error: 'Insurance not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Insurance updated successfully',
            data: updatedInsurance
        });
    } catch (error) {
        console.error('Error updating insurance:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const deleteInsurance = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedInsurance = await Insurance.findByIdAndDelete(id);
        
        if (!deletedInsurance) {
            return res.status(404).json({ 
                success: false,
                error: 'Insurance not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Insurance deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting insurance:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    getAllInsurance,
    getInsurance,
    createInsurance,
    updateInsurance,
    deleteInsurance
};