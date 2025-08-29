const { Staff } = require('../Modules/Database/models');

const getAllStaff = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, role, status } = req.query;
        let filter = {};
        
        // Add search functionality
        if (search) {
            filter = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { specialization: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        // Add role filter
        if (role && role !== 'all') {
            filter.role = role;
        }
        
        // Add status filter
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        // Add department filter
        if (req.query.department_id && req.query.department_id !== 'all') {
            filter.department_id = req.query.department_id;
        }
        
        const skip = (page - 1) * limit;
        const staff = await Staff.find(filter)
            .populate('department_id', 'name')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ created_at: -1 });
            
        const total = await Staff.countDocuments(filter);
        
        res.status(200).json({
            data: staff,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getStaff = async (req, res) => {
    try {
        const { staff_id } = req.params;
        const staff = await Staff.findById(staff_id).populate('department_id', 'name');
        
        if (!staff) {
            return res.status(404).json({ error: 'Staff member not found' });
        }
        
        res.status(200).json(staff);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createStaff = async (req, res) => {
    try {
        const { 
            name, 
            role, 
            department_id, 
            email, 
            phone, 
            specialization, 
            hire_date, 
            salary 
        } = req.body;
        
        const staff = new Staff({
            name,
            role,
            department_id,
            email,
            phone,
            specialization,
            hire_date,
            salary,
            status: 'active'
        });
        
        const savedStaff = await staff.save();
        res.status(201).json({ 
            message: 'Staff created successfully', 
            staff: savedStaff 
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateStaff = async (req, res) => {
    try {
        const { staff_id } = req.params;
        const updateData = req.body;
        
        const staff = await Staff.findByIdAndUpdate(
            staff_id, 
            updateData, 
            { new: true, runValidators: true }
        );
        
        if (!staff) {
            return res.status(404).json({ error: 'Staff member not found' });
        }
        
        res.status(200).json({ 
            message: 'Staff updated successfully', 
            staff 
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteStaff = async (req, res) => {
    try {
        const { staff_id } = req.params;
        const staff = await Staff.findByIdAndDelete(staff_id);
        
        if (!staff) {
            return res.status(404).json({ error: 'Staff member not found' });
        }
        
        res.status(200).json({ message: 'Staff deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllStaff,
    getStaff,
    createStaff,
    updateStaff,
    deleteStaff
};
