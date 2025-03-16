const db = require("../Modules/Database/db");

const getAllVisits = (req, res) => {
    const sql = `SELECT * FROM Visits`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getVisit = (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM Visits WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createVisit = (req, res) => {
    const { Patient_ID, Visit_Date, Reason } = req.body;
    const sql = `INSERT INTO Visits (Patient_ID, Visit_Date, Reason) VALUES (?, ?, ?)`;
    db.query(sql, [Patient_ID, Visit_Date, Reason], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Visit created successfully', visitId: result.insertId });
    });
}

const updateVisit = (req, res) => {
    const { id } = req.params;
    const { Patient_ID, Visit_Date, Reason } = req.body;
    const sql = `UPDATE Visits SET Patient_ID = ?, Visit_Date = ?, Reason = ? WHERE ID = ?`;
    db.query(sql, [Patient_ID, Visit_Date, Reason, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Visit updated successfully' });
    });
}

const deleteVisit = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM Visits WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Visit deleted successfully' });
    });
}

module.exports = {
    getAllVisits,
    getVisit,
    createVisit,
    updateVisit,
    deleteVisit
};
