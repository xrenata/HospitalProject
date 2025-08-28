const { Hospital } = require('../Modules/Database/models');

const getAllHospitals = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { type: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } }
            ];
        }
        
        const hospitals = await Hospital.find(query)
            .sort({ name: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Hospital.countDocuments(query);

        res.status(200).json({
            success: true,
            data: hospitals,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getHospital = async (req, res) => {
    try {
        const { id } = req.params;
        
        const hospital = await Hospital.findById(id);
        
        if (!hospital) {
            return res.status(404).json({ 
                success: false,
                error: 'Hospital not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: hospital
        });
    } catch (error) {
        console.error('Error fetching hospital:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const createHospital = async (req, res) => {
    try {
        const { 
            name, type, capacity, address, ambulanceCount, equipment,
            phone, email, website, establishedDate, licenseNumber, status
        } = req.body;
        
        const newHospital = new Hospital({
            name,
            type,
            capacity,
            address,
            ambulanceCount: ambulanceCount || 0,
            ambulance_count: ambulanceCount || 0,
            equipment,
            phone,
            email,
            website,
            establishedDate,
            established_date: establishedDate,
            licenseNumber,
            license_number: licenseNumber,
            status: status || 'active'
        });
        
        const savedHospital = await newHospital.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Hospital created successfully', 
            hospitalId: savedHospital._id,
            data: savedHospital
        });
    } catch (error) {
        console.error('Error creating hospital:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const updateHospital = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        // Add compatibility fields
        if (updateData.ambulanceCount) {
            updateData.ambulance_count = updateData.ambulanceCount;
        }
        if (updateData.establishedDate) {
            updateData.established_date = updateData.establishedDate;
        }
        if (updateData.licenseNumber) {
            updateData.license_number = updateData.licenseNumber;
        }
        
        updateData.updatedAt = new Date();
        updateData.updated_at = new Date();
        
        const updatedHospital = await Hospital.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!updatedHospital) {
            return res.status(404).json({ 
                success: false,
                error: 'Hospital not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Hospital updated successfully',
            data: updatedHospital
        });
    } catch (error) {
        console.error('Error updating hospital:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const deleteHospital = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedHospital = await Hospital.findByIdAndDelete(id);
        
        if (!deletedHospital) {
            return res.status(404).json({ 
                success: false,
                error: 'Hospital not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Hospital deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting hospital:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    getAllHospitals,
    getHospital,
    createHospital,
    updateHospital,
    deleteHospital
};