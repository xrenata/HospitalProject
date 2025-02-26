const db = require("../Modules/Database/db");

const getAllMedications = (req, res) => {
    const sql = `SELECT * FROM Medications`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getMedication = (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM Medications WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createMedication = (req, res) => {
    const { Name, Description, Dosage, Side_Effects } = req.body;
    const sql = `INSERT INTO Medications (Name, Description, Dosage, Side_Effects) VALUES (?, ?, ?, ?)`;
    db.query(sql, [Name, Description, Dosage, Side_Effects], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Medication created successfully', medicationId: result.insertId });
    });
}

const updateMedication = (req, res) => {
    const { id } = req.params;
    const { Name, Description, Dosage, Side_Effects } = req.body;
    const sql = `UPDATE Medications SET Name = ?, Description = ?, Dosage = ?, Side_Effects = ? WHERE ID = ?`;
    db.query(sql, [Name, Description, Dosage, Side_Effects, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Medication updated successfully' });
    });
}

const deleteMedication = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM Medications WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Medication deleted successfully' });
    });
}

module.exports = {
    getAllMedications,
    getMedication,
    createMedication,
    updateMedication,
    deleteMedication
};
