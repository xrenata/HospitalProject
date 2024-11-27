const db = require("../Modules/Database/db");

const getAllComplaints = (req, res) => {
    const sql = `SELECT * FROM Complaints`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getComplaint = (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM Complaints WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createComplaint = async (req, res) => {
    const { department_name, description, status, outcome, complainer_id } = req.body;
    const sql = `INSERT INTO Complaints (Department_Name, Description, Status, Outcome, Complainer_ID) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [department_name, description, status, outcome, complainer_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Complaint created successfully" });
    });
}

const updateComplaint = async (req, res) => {
    const { id } = req.params;
    const { department_name, description, status, outcome, complainer_id } = req.body;
    const sql = `UPDATE Complaints SET Department_Name = ?, Description = ?, Status = ?, Outcome = ?, Complainer_ID = ? WHERE ID = ?`;
    db.query(sql, [department_name, description, status, outcome, complainer_id, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Complaint updated successfully" });
    });
}

const deleteComplaint = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM Complaints WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: "Complaint deleted successfully" });
    });
}

const getComplaintsByUser = (req, res) => {
    const { complainer_id } = req.params;
    const sql = `SELECT * FROM Complaints WHERE Complainer_ID = ?`;
    db.query(sql, complainer_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getComplaintsByStatus = (req, res) => {
    const { status } = req.params;
    const sql = `SELECT * FROM Complaints WHERE Status = ?`;
    db.query(sql, status, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getComplaintsByDepartment = (req, res) => {
    const { department_name } = req.params;
    const sql = `SELECT * FROM Complaints WHERE Department_Name = ?`;
    db.query(sql, department_name, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getComplaintsByUserAndStatus = (req, res) => {
    const { complainer_id, status } = req.params;
    const sql = `SELECT * FROM Complaints WHERE Complainer_ID = ? AND Status = ?`;
    db.query(sql, [complainer_id, status], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getComplaintsByUserAndDepartment = (req, res) => {
    const { complainer_id, department_name } = req.params;
    const sql = `SELECT * FROM Complaints WHERE Complainer_ID = ? AND Department_Name = ?`;
    db.query(sql, [complainer_id, department_name], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

module.exports = {
    getAllComplaints,
    getComplaint,
    createComplaint,
    updateComplaint,
    deleteComplaint,
    getComplaintsByUser,
    getComplaintsByStatus,
    getComplaintsByDepartment,
    getComplaintsByUserAndStatus,
    getComplaintsByUserAndDepartment
};
