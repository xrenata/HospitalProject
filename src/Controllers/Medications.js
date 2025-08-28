const { Medication } = require('../Modules/Database/models');

const getAllMedications = async (req, res) => {
    try {
        const { page = 1, limit = 10, category, search } = req.query;
        
        let query = {};
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { manufacturer: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }
        
        const medications = await Medication.find(query)
            .sort({ name: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Medication.countDocuments(query);

        res.status(200).json({
            success: true,
            data: medications,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        console.error('Error fetching medications:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getMedicationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const medication = await Medication.findById(id);
        
        if (!medication) {
            return res.status(404).json({ 
                success: false,
                error: 'Medication not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: medication
        });
    } catch (error) {
        console.error('Error fetching medication:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const createMedication = async (req, res) => {
    try {
        const { 
            name, description, dosage, manufacturer, expiryDate,
            stockQuantity, price, category, sideEffects
        } = req.body;
        
        const newMedication = new Medication({
            name,
            description,
            dosage,
            manufacturer,
            expiryDate,
            stockQuantity: stockQuantity || 0,
            price,
            category,
            sideEffects
        });
        
        const savedMedication = await newMedication.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Medication created successfully', 
            medicationId: savedMedication._id,
            data: savedMedication
        });
    } catch (error) {
        console.error('Error creating medication:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const updateMedication = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        updateData.updatedAt = new Date();
        
        const updatedMedication = await Medication.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!updatedMedication) {
            return res.status(404).json({ 
                success: false,
                error: 'Medication not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Medication updated successfully',
            data: updatedMedication
        });
    } catch (error) {
        console.error('Error updating medication:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const deleteMedication = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedMedication = await Medication.findByIdAndDelete(id);
        
        if (!deletedMedication) {
            return res.status(404).json({ 
                success: false,
                error: 'Medication not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Medication deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting medication:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    getAllMedications,
    getMedicationById,
    createMedication,
    updateMedication,
    deleteMedication
};