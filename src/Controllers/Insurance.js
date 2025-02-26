const db = require("../Modules/Database/db");

const getAllInsurance = (req, res) => {
    const sql = `SELECT * FROM Insurance`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getInsurance = (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM Insurance WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createInsurance = (req, res) => {
    const { Name, Description, Coverage } = req.body;
    const sql = `INSERT INTO Insurance (Name, Description, Coverage) VALUES (?, ?, ?)`;
    db.query(sql, [Name, Description, Coverage], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Insurance created successfully', insuranceId: result.insertId });
    });
}

const updateInsurance = (req, res) => {
    const { id } = req.params;
    const { Name, Description, Coverage } = req.body;
    const sql = `UPDATE Insurance SET Name = ?, Description = ?, Coverage = ? WHERE ID = ?`;
    db.query(sql, [Name, Description, Coverage, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Insurance updated successfully' });
    });
}

const deleteInsurance = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM Insurance WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Insurance deleted successfully' });
    });
}

module.exports = {
    getAllInsurance,
    getInsurance,
    createInsurance,
    updateInsurance,
    deleteInsurance
};
