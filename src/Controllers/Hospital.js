const db = require("../Modules/Database/db");

const getAllHospitals = (req, res) => {
    const sql = `SELECT * FROM Hospital`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getHospital = (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM Hospital WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createHospital = (req, res) => {
    const { Name, Address, Phone, Email } = req.body;
    const sql = `INSERT INTO Hospital (Name, Address, Phone, Email) VALUES (?, ?, ?, ?)`;
    db.query(sql, [Name, Address, Phone, Email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Hospital created successfully', hospitalId: result.insertId });
    });
}

const updateHospital = (req, res) => {
    const { id } = req.params;
    const { Name, Address, Phone, Email } = req.body;
    const sql = `UPDATE Hospital SET Name = ?, Address = ?, Phone = ?, Email = ? WHERE ID = ?`;
    db.query(sql, [Name, Address, Phone, Email, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Hospital updated successfully' });
    });
}

const deleteHospital = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM Hospital WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Hospital deleted successfully' });
    });
}

module.exports = {
    getAllHospitals,
    getHospital,
    createHospital,
    updateHospital,
    deleteHospital
};

