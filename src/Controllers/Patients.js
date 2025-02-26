const db = require("../Modules/Database/db");

const getAllPatients = (req, res) => {
    const sql = `SELECT * FROM Patients`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getPatient = (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM Patients WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createPatient = (req, res) => {
    const { Name, Age, Gender, Address, Phone, Email } = req.body;
    const sql = `INSERT INTO Patients (Name, Age, Gender, Address, Phone, Email) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [Name, Age, Gender, Address, Phone, Email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Patient created successfully', patientId: result.insertId });
    });
}

const updatePatient = (req, res) => {
    const { id } = req.params;
    const { Name, Age, Gender, Address, Phone, Email } = req.body;
    const sql = `UPDATE Patients SET Name = ?, Age = ?, Gender = ?, Address = ?, Phone = ?, Email = ? WHERE ID = ?`;
    db.query(sql, [Name, Age, Gender, Address, Phone, Email, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Patient updated successfully' });
    });
}

const deletePatient = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM Patients WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Patient deleted successfully' });
    });
}

module.exports = {
    getAllPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient
};
