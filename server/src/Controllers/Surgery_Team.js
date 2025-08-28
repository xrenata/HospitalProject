const { Surgery, Staff } = require('../Modules/Database/models');

const getAllSurgeryTeams = async (req, res) => {
    try {
        const { page = 1, limit = 10, surgeryId } = req.query;
        
        let query = {};
        if (surgeryId) query._id = surgeryId;
        
        const surgeryTeams = await Surgery.find(query)
            .populate('surgeonId', 'name role specialization')
            .populate('participants', 'name role specialization')
            .populate('patientId', 'firstName lastName')
            .sort({ surgeryDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Surgery.countDocuments(query);

        res.status(200).json({
            success: true,
            data: surgeryTeams,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
    } catch (error) {
        console.error('Error fetching surgery teams:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const getSurgeryTeam = async (req, res) => {
    try {
        const { id } = req.params;
        
        const surgeryTeam = await Surgery.findById(id)
            .populate('surgeonId', 'name role specialization phone email')
            .populate('participants', 'name role specialization phone email')
            .populate('patientId', 'firstName lastName tcNumber')
            .populate('departmentId', 'name')
            .populate('roomId', 'roomNumber');
        
        if (!surgeryTeam) {
            return res.status(404).json({ 
                success: false,
                error: 'Surgery team not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: surgeryTeam
        });
    } catch (error) {
        console.error('Error fetching surgery team:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const createSurgeryTeam = async (req, res) => {
    try {
        const { surgeryId, participants } = req.body;
        
        // Add participants to surgery
        const updatedSurgery = await Surgery.findByIdAndUpdate(
            surgeryId, 
            { 
                participants: participants || [],
                updatedAt: new Date(),
                updated_at: new Date()
            }, 
            { new: true }
        )
            .populate('surgeonId', 'name role')
            .populate('participants', 'name role specialization');
        
        if (!updatedSurgery) {
            return res.status(404).json({ 
                success: false,
                error: 'Surgery not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Surgery team created successfully',
            data: updatedSurgery
        });
    } catch (error) {
        console.error('Error creating surgery team:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const updateSurgeryTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { participants, surgeonId } = req.body;
        
        const updateData = {
            updatedAt: new Date(),
            updated_at: new Date()
        };
        
        if (participants) updateData.participants = participants;
        if (surgeonId) {
            updateData.surgeonId = surgeonId;
            updateData.surgeon_id = surgeonId;
        }
        
        const updatedSurgery = await Surgery.findByIdAndUpdate(id, updateData, { new: true })
            .populate('surgeonId', 'name role')
            .populate('participants', 'name role specialization');
        
        if (!updatedSurgery) {
            return res.status(404).json({ 
                success: false,
                error: 'Surgery not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Surgery team updated successfully',
            data: updatedSurgery
        });
    } catch (error) {
        console.error('Error updating surgery team:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const deleteSurgeryTeam = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Remove all participants from surgery
        const updatedSurgery = await Surgery.findByIdAndUpdate(
            id, 
            { 
                participants: [],
                updatedAt: new Date(),
                updated_at: new Date()
            }, 
            { new: true }
        );
        
        if (!updatedSurgery) {
            return res.status(404).json({ 
                success: false,
                error: 'Surgery not found' 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Surgery team removed successfully' 
        });
    } catch (error) {
        console.error('Error removing surgery team:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const addTeamMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { staffId } = req.body;
        
        const surgery = await Surgery.findById(id);
        if (!surgery) {
            return res.status(404).json({ 
                success: false,
                error: 'Surgery not found' 
            });
        }
        
        // Check if staff member is already in the team
        if (surgery.participants.includes(staffId)) {
            return res.status(400).json({ 
                success: false,
                error: 'Staff member is already in the surgery team' 
            });
        }
        
        surgery.participants.push(staffId);
        surgery.updatedAt = new Date();
        surgery.updated_at = new Date();
        
        const updatedSurgery = await surgery.save();
        await updatedSurgery.populate('participants', 'name role specialization');
        
        res.status(200).json({ 
            success: true,
            message: 'Team member added successfully',
            data: updatedSurgery
        });
    } catch (error) {
        console.error('Error adding team member:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

const removeTeamMember = async (req, res) => {
    try {
        const { id, staffId } = req.params;
        
        const surgery = await Surgery.findById(id);
        if (!surgery) {
            return res.status(404).json({ 
                success: false,
                error: 'Surgery not found' 
            });
        }
        
        surgery.participants = surgery.participants.filter(
            participantId => participantId.toString() !== staffId
        );
        surgery.updatedAt = new Date();
        surgery.updated_at = new Date();
        
        const updatedSurgery = await surgery.save();
        await updatedSurgery.populate('participants', 'name role specialization');
        
        res.status(200).json({ 
            success: true,
            message: 'Team member removed successfully',
            data: updatedSurgery
        });
    } catch (error) {
        console.error('Error removing team member:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    getAllSurgeryTeams,
    getSurgeryTeam,
    createSurgeryTeam,
    updateSurgeryTeam,
    deleteSurgeryTeam,
    addTeamMember,
    removeTeamMember
};