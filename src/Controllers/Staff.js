const db = require('../Modules/Database/db');

const getAllStaff = (req, res) => {
    const sql = `SELECT * FROM Staff`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getStaff = (req, res) => {
    const { staff_id } = req.params;
    const sql = `SELECT * FROM Staff WHERE ID = ?`;
    db.query(sql, staff_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createStaff = (req, res) => {
    const { Hospital_ID, First_Name, Last_Name, Gender, Contact_Info, Department, Leave_Status, Salary, Working_Hours } = req.body;
    const sql = `INSERT INTO Staff (Hospital_ID, First_Name, Last_Name, Gender, Contact_Info, Department, Leave_Status, Salary, Working_Hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [Hospital_ID, First_Name, Last_Name, Gender, Contact_Info, Department, Leave_Status, Salary, Working_Hours], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Staff created successfully', staffId: result.insertId });
    });
}

const updateStaff = (req, res) => {
    const { staff_id } = req.params;
    const { Hospital_ID, First_Name, Last_Name, Gender, Contact_Info, Department, Leave_Status, Salary, Working_Hours } = req.body;
    const sql = `UPDATE Staff SET Hospital_ID = ?, First_Name = ?, Last_Name = ?, Gender = ?, Contact_Info = ?, Department = ?, Leave_Status = ?, Salary = ?, Working_Hours = ? WHERE ID = ?`;
    db.query(sql, [Hospital_ID, First_Name, Last_Name, Gender, Contact_Info, Department, Leave_Status, Salary, Working_Hours, staff_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Staff updated successfully' });
    });
}

const deleteStaff = (req, res) => {
    const { staff_id } = req.params;
    const sql = `DELETE FROM Staff WHERE ID = ?`;
    db.query(sql, staff_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Staff deleted successfully' });
    });
}

module.exports = {
    getAllStaff,
    getStaff,
    createStaff,
    updateStaff,
    deleteStaff
};
