const { Room, Department } = require('../Modules/Database/models');

const getAllRooms = async (req, res) => {
    try {
        const { search, status, type, departmentId, page = 1, limit = 10 } = req.query;
        
        // Build query
        let query = {};
        
        if (search) {
            query.$or = [
                { roomNumber: { $regex: search, $options: 'i' } },
                { equipment: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) {
            query.status = status;
        }
        
        if (type) {
            query.roomType = type;
        }
        
        if (departmentId) {
            query.departmentId = departmentId;
        }

        const rooms = await Room.find(query)
            .populate('departmentId', 'name')
            .sort({ roomNumber: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        // Format the response to match frontend expectations
        const formattedRooms = rooms.map(room => ({
            room_id: room._id.toString(),
            room_number: room.roomNumber,
            room_type: room.roomType,
            department_id: room.departmentId ? room.departmentId._id.toString() : null,
            capacity: room.capacity,
            current_occupancy: room.currentOccupancy,
            status: room.status,
            equipment: room.equipment,
            notes: room.notes,
            created_at: room.createdAt,
            updated_at: room.updatedAt
        }));
        
        res.status(200).json({
            success: true,
            data: formattedRooms,
            count: formattedRooms.length
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getRoom = async (req, res) => {
    try {
        const { id } = req.params;
        
        const room = await Room.findById(id).populate('departmentId', 'name');
        
        if (!room) {
            return res.status(404).json({ 
                success: false,
                error: 'Room not found' 
            });
        }
        
        const formattedRoom = {
            room_id: room._id.toString(),
            room_number: room.roomNumber,
            room_type: room.roomType,
            department_id: room.departmentId ? room.departmentId._id.toString() : null,
            capacity: room.capacity,
            current_occupancy: room.currentOccupancy,
            status: room.status,
            equipment: room.equipment,
            notes: room.notes,
            created_at: room.createdAt,
            updated_at: room.updatedAt
        };
        
        res.status(200).json({
            success: true,
            data: formattedRoom
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const createRoom = async (req, res) => {
    try {
        const { 
            room_number, 
            room_type, 
            department_id, 
            capacity, 
            equipment, 
            notes, 
            status 
        } = req.body;
        
        // Check if room number already exists
        const existingRoom = await Room.findOne({ roomNumber: room_number });
        if (existingRoom) {
            return res.status(400).json({
                success: false,
                error: 'Room number already exists'
            });
        }
        
        const newRoom = new Room({
            roomNumber: room_number,
            roomType: room_type || 'general',
            departmentId: department_id || null,
            capacity: capacity || 1,
            currentOccupancy: 0,
            status: status || 'available',
            equipment: equipment || '',
            notes: notes || ''
        });
        
        const savedRoom = await newRoom.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Room created successfully', 
            roomId: savedRoom._id,
            data: {
                room_id: savedRoom._id.toString(),
                room_number: savedRoom.roomNumber,
                room_type: savedRoom.roomType,
                department_id: savedRoom.departmentId ? savedRoom.departmentId.toString() : null,
                capacity: savedRoom.capacity,
                current_occupancy: savedRoom.currentOccupancy,
                status: savedRoom.status,
                equipment: savedRoom.equipment,
                notes: savedRoom.notes
            }
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            room_number, 
            room_type, 
            department_id, 
            capacity, 
            equipment, 
            notes, 
            status 
        } = req.body;
        
        // Check if room exists
        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({ 
                success: false,
                error: 'Room not found' 
            });
        }
        
        // Check if room number already exists (if changing room number)
        if (room_number && room_number !== room.roomNumber) {
            const existingRoom = await Room.findOne({ roomNumber: room_number, _id: { $ne: id } });
            if (existingRoom) {
                return res.status(400).json({
                    success: false,
                    error: 'Room number already exists'
                });
            }
        }
        
        // Update fields
        const updateData = {};
        if (room_number) updateData.roomNumber = room_number;
        if (room_type) updateData.roomType = room_type;
        if (department_id) updateData.departmentId = department_id;
        if (capacity) updateData.capacity = capacity;
        if (equipment !== undefined) updateData.equipment = equipment;
        if (notes !== undefined) updateData.notes = notes;
        if (status) updateData.status = status;
        updateData.updatedAt = new Date();
        
        const updatedRoom = await Room.findByIdAndUpdate(id, updateData, { new: true })
            .populate('departmentId', 'name');
        
        res.status(200).json({ 
            success: true,
            message: 'Room updated successfully',
            data: {
                room_id: updatedRoom._id.toString(),
                room_number: updatedRoom.roomNumber,
                room_type: updatedRoom.roomType,
                department_id: updatedRoom.departmentId ? updatedRoom.departmentId._id.toString() : null,
                capacity: updatedRoom.capacity,
                current_occupancy: updatedRoom.currentOccupancy,
                status: updatedRoom.status,
                equipment: updatedRoom.equipment,
                notes: updatedRoom.notes
            }
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedRoom = await Room.findByIdAndDelete(id);
        
        if (!deletedRoom) {
            return res.status(404).json({ 
                success: false,
                error: 'Room not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Room deleted successfully' 
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

// Get room statistics
const getRoomStats = async (req, res) => {
    try {
        const totalRooms = await Room.countDocuments();
        const availableRooms = await Room.countDocuments({ status: 'available' });
        const occupiedRooms = await Room.countDocuments({ status: 'occupied' });
        const maintenanceRooms = await Room.countDocuments({ status: 'maintenance' });
        const reservedRooms = await Room.countDocuments({ status: 'reserved' });
        
        // Calculate total capacity and occupancy
        const capacityStats = await Room.aggregate([
            {
                $group: {
                    _id: null,
                    totalCapacity: { $sum: '$capacity' },
                    totalOccupancy: { $sum: '$currentOccupancy' },
                    avgCapacity: { $avg: '$capacity' }
                }
            }
        ]);
        
        const stats = capacityStats[0] || { totalCapacity: 0, totalOccupancy: 0, avgCapacity: 0 };
        const occupancyRate = stats.totalCapacity > 0 
            ? Math.round((stats.totalOccupancy / stats.totalCapacity) * 100) 
            : 0;
        
        res.status(200).json({
            success: true,
            data: {
                totalRooms,
                availableRooms,
                occupiedRooms,
                maintenanceRooms,
                reservedRooms,
                totalCapacity: stats.totalCapacity,
                totalOccupancy: stats.totalOccupancy,
                occupancyRate,
                averageCapacity: Math.round(stats.avgCapacity * 10) / 10
            }
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    getAllRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    getRoomStats
};
