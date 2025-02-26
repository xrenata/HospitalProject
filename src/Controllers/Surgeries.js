const db = require('../Modules/Database/db');

const getAllSurgeries = (req, res) => {
    const sql = `SELECT * FROM Surgeries`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getSurgery = (req, res) => {
    const { surgery_id } = req.params;
    const sql = `SELECT * FROM Surgeries WHERE ID = ?`;
    db.query(sql, surgery_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createSurgery = (req, res) => {
    const { Patient_ID, Participants, Type, Date, Duration, Outcome } = req.body;
    const sql = `INSERT INTO Surgeries (Patient_ID, Participants, Type, Date, Duration, Outcome) VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(sql, [Patient_ID, Participants, Type, Date, Duration, Outcome], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Surgery created successfully', surgeryId: result.insertId });
    });
}

const updateSurgery = (req, res) => {
    const { surgery_id } = req.params;
    const { Patient_ID, Participants, Type, Date, Duration, Outcome } = req.body;
    const sql = `UPDATE Surgeries SET Patient_ID = ?, Participants = ?, Type = ?, Date = ?, Duration = ?, Outcome = ? WHERE ID = ?`;
    db.query(sql, [Patient_ID, Participants, Type, Date, Duration, Outcome, surgery_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Surgery updated successfully' });
    });
}

const deleteSurgery = (req, res) => {
    const { surgery_id } = req.params;
    const sql = `DELETE FROM Surgeries WHERE ID = ?`;
    db.query(sql, surgery_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Surgery deleted successfully' });
    });
}

module.exports = {
    getAllSurgeries,
    getSurgery,
    createSurgery,
    updateSurgery,
    deleteSurgery
};
