const db = require("../Modules/Database/db");

const getAllShifts = (req, res) => {
    const sql = `SELECT * FROM Shifts`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getShift = (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM Shifts WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createShift = (req, res) => {
    const { Staff_ID, Shift_Start, Shift_End } = req.body;
    const sql = `INSERT INTO Shifts (Staff_ID, Shift_Start, Shift_End) VALUES (?, ?, ?)`;
    db.query(sql, [Staff_ID, Shift_Start, Shift_End], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Shift created successfully', shiftId: result.insertId });
    });
}

const updateShift = (req, res) => {
    const { id } = req.params;
    const { Staff_ID, Shift_Start, Shift_End } = req.body;
    const sql = `UPDATE Shifts SET Staff_ID = ?, Shift_Start = ?, Shift_End = ? WHERE ID = ?`;
    db.query(sql, [Staff_ID, Shift_Start, Shift_End, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Shift updated successfully' });
    });
}

const deleteShift = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM Shifts WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Shift deleted successfully' });
    });
}

module.exports = {
    getAllShifts,
    getShift,
    createShift,
    updateShift,
    deleteShift
};
