const db = require('../Modules/Database/db');

const getAllTests = (req, res) => {
    const sql = `SELECT * FROM Tests`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getTest = (req, res) => {
    const { test_id } = req.params;
    const sql = `SELECT * FROM Tests WHERE ID = ?`;
    db.query(sql, test_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createTest = (req, res) => {
    const { Patient_ID, Test_Name, Results, Date } = req.body;
    const sql = `INSERT INTO Tests (Patient_ID, Test_Name, Results, Date) VALUES (?, ?, ?, ?)`;
    db.query(sql, [Patient_ID, Test_Name, Results, Date], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Test created successfully', testId: result.insertId });
    });
}

const updateTest = (req, res) => {
    const { test_id } = req.params;
    const { Patient_ID, Test_Name, Results, Date } = req.body;
    const sql = `UPDATE Tests SET Patient_ID = ?, Test_Name = ?, Results = ?, Date = ? WHERE ID = ?`;
    db.query(sql, [Patient_ID, Test_Name, Results, Date, test_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Test updated successfully' });
    });
}

const deleteTest = (req, res) => {
    const { test_id } = req.params;
    const sql = `DELETE FROM Tests WHERE ID = ?`;
    db.query(sql, test_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Test deleted successfully' });
    });
}

module.exports = {
    getAllTests,
    getTest,
    createTest,
    updateTest,
    deleteTest
};
