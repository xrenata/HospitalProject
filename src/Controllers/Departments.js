const { Department, Staff } = require("../Modules/Database/models");

const getAllDepartments = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;
        let filter = {};
        
        // Add search functionality
        if (search) {
            filter = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        // Add status filter
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        const skip = (page - 1) * limit;
        const departments = await Department.find(filter)
            .populate('head_staff_id', 'name email role')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
            
        const total = await Department.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        
        // Get staff count for each department
        const departmentsWithStats = await Promise.all(
            departments.map(async (dept) => {
                const staffCount = await Staff.countDocuments({ 
                    $or: [
                        { department_id: dept._id },
                        { departmentId: dept._id }
                    ]
                });
                return {
                    ...dept.toObject(),
                    staffCount
                };
            })
        );
        
        res.status(200).json({
            departments: departmentsWithStats,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: total,
                itemsPerPage: parseInt(limit),
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const department = await Department.findById(id)
            .populate('head_staff_id', 'name email role specialization');
        
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }
        
        // Get department staff
        const staff = await Staff.find({
            $or: [
                { department_id: id },
                { departmentId: id }
            ]
        }).select('name email role specialization status');
        
        // Get department statistics
        const totalStaff = staff.length;
        const activeStaff = staff.filter(s => s.status === 'active').length;
        const doctorCount = staff.filter(s => s.role.toLowerCase() === 'doctor').length;
        const nurseCount = staff.filter(s => s.role.toLowerCase() === 'nurse').length;
        
        res.status(200).json({
            ...department.toObject(),
            staff,
            statistics: {
                totalStaff,
                activeStaff,
                doctorCount,
                nurseCount
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createDepartment = async (req, res) => {
    try {
        const { 
            name, 
            description, 
            head_staff_id, 
            budget, 
            location, 
            phone, 
            email,
            capacity,
            status = 'active'
        } = req.body;
        
        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: 'Department name is required' });
        }
        
        // Check if department name already exists
        const existingDept = await Department.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });
        
        if (existingDept) {
            return res.status(400).json({ error: 'Department with this name already exists' });
        }
        
        // Validate head staff if provided
        if (head_staff_id) {
            const staff = await Staff.findById(head_staff_id);
            if (!staff) {
                return res.status(400).json({ error: 'Head staff member not found' });
            }
        }
        
        const department = new Department({
            name,
            description,
            head_staff_id,
            budget: budget ? parseFloat(budget) : undefined,
            location,
            phone,
            email,
            capacity: capacity ? parseInt(capacity) : undefined,
            status
        });
        
        const savedDepartment = await department.save();
        
        // Populate head staff for response
        const populatedDepartment = await Department.findById(savedDepartment._id)
            .populate('head_staff_id', 'name email role');
        
        res.status(201).json({ 
            message: 'Department created successfully', 
            department: populatedDepartment 
        });
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(400).json({ 
            error: 'Failed to create department',
            details: error.message 
        });
    }
};

const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        
        // Process numeric fields
        if (updateData.budget) {
            updateData.budget = parseFloat(updateData.budget);
        }
        if (updateData.capacity) {
            updateData.capacity = parseInt(updateData.capacity);
        }
        
        // Validate head staff if provided
        if (updateData.head_staff_id) {
            const staff = await Staff.findById(updateData.head_staff_id);
            if (!staff) {
                return res.status(400).json({ error: 'Head staff member not found' });
            }
        }
        
        // Check if name is being changed and already exists
        if (updateData.name) {
            const existingDept = await Department.findOne({ 
                name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
                _id: { $ne: id }
            });
            
            if (existingDept) {
                return res.status(400).json({ error: 'Department with this name already exists' });
            }
        }
        
        // Add updated timestamp
        updateData.updatedAt = new Date();
        
        const department = await Department.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        ).populate('head_staff_id', 'name email role');
        
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }
        
        res.status(200).json({ 
            message: 'Department updated successfully', 
            department 
        });
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(400).json({ 
            error: 'Failed to update department',
            details: error.message 
        });
    }
};

const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if department has staff members
        const staffCount = await Staff.countDocuments({
            $or: [
                { department_id: id },
                { departmentId: id }
            ]
        });
        
        if (staffCount > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete department with active staff members',
                staffCount 
            });
        }
        
        const department = await Department.findByIdAndDelete(id);
        
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }
        
        res.status(200).json({ 
            message: 'Department deleted successfully',
            deletedDepartment: {
                id: department._id,
                name: department.name
            }
        });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ 
            error: 'Failed to delete department',
            details: error.message 
        });
    }
};

// Get department statistics
const getDepartmentStats = async (req, res) => {
    try {
        const totalDepartments = await Department.countDocuments();
        const activeDepartments = await Department.countDocuments({ status: 'active' });
        const inactiveDepartments = await Department.countDocuments({ status: 'inactive' });
        
        // Department with most staff
        const departmentStaffCounts = await Staff.aggregate([
            {
                $group: {
                    _id: { $ifNull: ['$departmentId', '$department_id'] },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        
        // Populate department names
        const topDepartments = await Promise.all(
            departmentStaffCounts.map(async (item) => {
                if (!item._id) return { name: 'Unassigned', count: item.count };
                const dept = await Department.findById(item._id);
                return {
                    name: dept ? dept.name : 'Unknown',
                    count: item.count,
                    id: item._id
                };
            })
        );
        
        // Total staff across all departments
        const totalStaff = await Staff.countDocuments();
        const assignedStaff = await Staff.countDocuments({
            $or: [
                { department_id: { $exists: true, $ne: null } },
                { departmentId: { $exists: true, $ne: null } }
            ]
        });
        
        res.json({
            totalDepartments,
            activeDepartments,
            inactiveDepartments,
            totalStaff,
            assignedStaff,
            unassignedStaff: totalStaff - assignedStaff,
            topDepartments
        });
    } catch (error) {
        console.error('Error fetching department stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch department statistics',
            details: error.message 
        });
    }
};

module.exports = {
    getAllDepartments,
    getDepartment,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentStats
};
