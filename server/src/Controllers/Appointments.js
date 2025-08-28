const { Appointment } = require('../Modules/Database/models');
const { executeQuery, getPaginatedResults } = require('../Modules/Database/queryHelper');

const getAllAppointments = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, date } = req.query;
        let filter = {};
        
        // Add status filter
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        // Add date filter
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            
            filter.appointmentDate = {
                $gte: startDate,
                $lt: endDate
            };
        }
        
        const result = await getPaginatedResults(Appointment, filter, { 
            page, 
            limit,
            sort: { appointmentDate: 1 }
        });
        
        if (result.success) {
            // Populate patient and staff information
            await Appointment.populate(result.data, [
                { path: 'patientId', select: 'firstName lastName email phone' },
                { path: 'staffId', select: 'name role specialization' },
                { path: 'departmentId', select: 'name' }
            ]);
            
            res.status(200).json({
                appointments: result.data,
                pagination: result.pagination
            });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAppointment = async (req, res) => {
    try {
        const { appointment_id } = req.params;
        const appointment = await Appointment.findById(appointment_id)
            .populate('patientId', 'firstName lastName email phone')
            .populate('staffId', 'name role specialization')
            .populate('departmentId', 'name');
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        res.status(200).json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createAppointment = async (req, res) => {
    try {
        const { 
            patient_id, 
            staff_id, 
            department_id, 
            appointment_date, 
            appointment_time, 
            reason, 
            notes 
        } = req.body;
        
        const appointment = new Appointment({
            patientId: patient_id,
            staffId: staff_id,
            departmentId: department_id,
            appointmentDate: appointment_date,
            appointmentTime: appointment_time,
            reason,
            notes,
            status: 'scheduled'
        });
        
        const savedAppointment = await appointment.save();
        
        // Populate the created appointment
        await Appointment.populate(savedAppointment, [
            { path: 'patientId', select: 'firstName lastName email phone' },
            { path: 'staffId', select: 'name role specialization' },
            { path: 'departmentId', select: 'name' }
        ]);
        
        res.status(201).json({ 
            message: 'Appointment created successfully', 
            appointment: savedAppointment 
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const updateAppointment = async (req, res) => {
    try {
        const { appointment_id } = req.params;
        const { 
            patient_id, 
            staff_id, 
            department_id, 
            appointment_date, 
            appointment_time, 
            reason, 
            notes,
            status
        } = req.body;
        
        // Convert field names to match model schema
        const updateData = {};
        if (patient_id) updateData.patientId = patient_id;
        if (staff_id) updateData.staffId = staff_id;
        if (department_id) updateData.departmentId = department_id;
        if (appointment_date) updateData.appointmentDate = appointment_date;
        if (appointment_time) updateData.appointmentTime = appointment_time;
        if (reason) updateData.reason = reason;
        if (notes) updateData.notes = notes;
        if (status) updateData.status = status;
        
        const appointment = await Appointment.findByIdAndUpdate(
            appointment_id, 
            updateData, 
            { new: true, runValidators: true }
        ).populate([
            { path: 'patientId', select: 'firstName lastName email phone' },
            { path: 'staffId', select: 'name role specialization' },
            { path: 'departmentId', select: 'name' }
        ]);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        res.status(200).json({ 
            message: 'Appointment updated successfully', 
            appointment 
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteAppointment = async (req, res) => {
    try {
        const { appointment_id } = req.params;
        const appointment = await Appointment.findByIdAndDelete(appointment_id);
        
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        
        res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    deleteAppointment
};