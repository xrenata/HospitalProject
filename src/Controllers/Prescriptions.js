const db = require("../Modules/Database/db");

const getAllPrescriptions = (req, res) => {
    const sql = `SELECT * FROM Prescriptions`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getPrescription = (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM Prescriptions WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createPrescription = (req, res) => {
    const { Patient_ID, Medication_ID, Dosage, Start_Date, End_Date } = req.body;
    const sql = `INSERT INTO Prescriptions (Patient_ID, Medication_ID, Dosage, Start_Date, End_Date) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [Patient_ID, Medication_ID, Dosage, Start_Date, End_Date], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Prescription created successfully', prescriptionId: result.insertId });
    });
}

const updatePrescription = (req, res) => {
    const { id } = req.params;
    const { Patient_ID, Medication_ID, Dosage, Start_Date, End_Date } = req.body;
    const sql = `UPDATE Prescriptions SET Patient_ID = ?, Medication_ID = ?, Dosage = ?, Start_Date = ?, End_Date = ? WHERE ID = ?`;
    db.query(sql, [Patient_ID, Medication_ID, Dosage, Start_Date, End_Date, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Prescription updated successfully' });
    });
}

const deletePrescription = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM Prescriptions WHERE ID = ?`;
    db.query(sql, id, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Prescription deleted successfully' });
    });
}

module.exports = {
    getAllPrescriptions,
    getPrescription,
    createPrescription,
    updatePrescription,
    deletePrescription
};
