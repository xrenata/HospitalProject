const db = require("../Modules/Database/db");

const getAllEquipment = (req, res) => {
    const sql = `SELECT * FROM Equipment`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
};

const getEquipment = (req, res) => {
    const { equipment_id } = req.params;
    const sql = `SELECT * FROM Equipment WHERE ID = ?`;
    db.query(sql, equipment_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
};

const createEquipment = (req, res) => {
    const { Name, Description, Quantity, Department_ID } = req.body;
    const sql = `INSERT INTO Equipment (Name, Description, Quantity, Department_ID) VALUES (?, ?, ?, ?)`;
    db.query(sql, [Name, Description, Quantity, Department_ID], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Equipment created successfully', equipmentId: result.insertId });
    });
};

const updateEquipment = (req, res) => {
    const { equipment_id } = req.params;
    // Add your logic to update equipment by ID
    res.send(`Equipment with ID: ${equipment_id} updated`);
};

const deleteEquipment = (req, res) => {
    const { equipment_id } = req.params;
    // Add your logic to delete equipment by ID
    res.send(`Equipment with ID: ${equipment_id} deleted`);
};

module.exports = {
    getAllEquipment,
    getEquipment,
    createEquipment,
    updateEquipment,
    deleteEquipment
};