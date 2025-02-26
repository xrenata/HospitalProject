const db = require("../Modules/Database/db");

const getAllStaffDepartments = (req, res) => {
    const sql = `SELECT * FROM Staff_Department`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getStaffDepartment = (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM Staff_Department WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createStaffDepartment = (req, res) => {
    const { Name, Description } = req.body;
    const sql = `INSERT INTO Staff_Department (Name, Description) VALUES (?, ?)`;
    db.query(sql, [Name, Description], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Staff Department created successfully', departmentId: result.insertId });
    });
}

const updateStaffDepartment = (req, res) => {
    const { id } = req.params;
    const { Name, Description } = req.body;
    const sql = `UPDATE Staff_Department SET Name = ?, Description = ? WHERE ID = ?`;
    db.query(sql, [Name, Description, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Staff Department updated successfully' });
    });
}

const deleteStaffDepartment = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM Staff_Department WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Staff Department deleted successfully' });
    });
}

module.exports = {
    getAllStaffDepartments,
    getStaffDepartment,
    createStaffDepartment,
    updateStaffDepartment,
    deleteStaffDepartment
};
