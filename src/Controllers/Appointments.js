const db = require('../Modules/Database/db');

const getAllAppointments = (req, res) => {
    const sql = `SELECT * FROM Appointments`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getAppointment = (req, res) => {
    const { appointment_id } = req.params;
    const sql = `SELECT * FROM Appointments WHERE Appointment_ID ?`;
    db.query(sql, appointment_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}   

const createAppointment = (req, res) => {
    const { Patient_ID, Doctor_ID, Department_ID, Appointment_Date, Status } = req.body;
    const sql = `INSERT INTO Appointments (Patient_ID, Doctor_ID, Department_ID, Appointment_Date, Status) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [Patient_ID, Doctor_ID, Department_ID, Appointment_Date, Status], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Appointment created successfully', appointmentId: result.insertId });
    });
}

const updateAppointment = (req, res) => {
    const { appointment_id } = req.params;
    const { Patient_ID, Doctor_ID, Department_ID, Appointment_Date, Status } = req.body;
    const sql = `UPDATE Appointments SET Patient_ID = ?, Doctor_ID = ?, Department_ID = ?, Appointment_Date = ?, Status = ? WHERE ID = ?`;
    db.query(sql, [Patient_ID, Doctor_ID, Department_ID, Appointment_Date, Status, appointment_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Appointment updated successfully' });
    });
}

const deleteAppointment = (req, res) => {
    const { appointment_id } = req.params;
    const sql = `DELETE FROM Appointments WHERE ID = ?`; // TODO : check if it's Appointment_ID -hasan: bi burda mı aklına geldi knk
    db.query(sql, appointment_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Appointment deleted successfully' });
    });
}

module.exports = {
    getAllAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    deleteAppointment
};