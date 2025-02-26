const db = require('../Modules/Database/db');

const getAllTreatments = (req, res) => {
    const sql = `SELECT * FROM Treatments`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getTreatment = (req, res) => {
    const { treatment_id } = req.params;
    const sql = `SELECT * FROM Treatments WHERE ID = ?`;
    db.query(sql, treatment_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createTreatment = (req, res) => {
    const { Date, Status, Description } = req.body;
    const sql = `INSERT INTO Treatments (Date, Status, Description) VALUES (?, ?, ?)`;
    db.query(sql, [Date, Status, Description], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Treatment created successfully', treatmentId: result.insertId });
    });
}

const updateTreatment = (req, res) => {
    const { treatment_id } = req.params;
    const { Date, Status, Description } = req.body;
    const sql = `UPDATE Treatments SET Date = ?, Status = ?, Description = ? WHERE ID = ?`;
    db.query(sql, [Date, Status, Description, treatment_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Treatment updated successfully' });
    });
}

const deleteTreatment = (req, res) => {
    const { treatment_id } = req.params;
    const sql = `DELETE FROM Treatments WHERE ID = ?`;
    db.query(sql, treatment_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Treatment deleted successfully' });
    });
}

module.exports = {
    getAllTreatments,
    getTreatment,
    createTreatment,
    updateTreatment,
    deleteTreatment
};
