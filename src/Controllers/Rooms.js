const db = require("../Modules/Database/db");

const getAllRooms = (req, res) => {
    const sql = `SELECT * FROM Rooms`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getRoom = (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM Rooms WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createRoom = (req, res) => {
    const { Room_Number, Department_ID, Capacity } = req.body;
    const sql = `INSERT INTO Rooms (Room_Number, Department_ID, Capacity) VALUES (?, ?, ?)`;
    db.query(sql, [Room_Number, Department_ID, Capacity], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Room created successfully', roomId: result.insertId });
    });
}

const updateRoom = (req, res) => {
    const { id } = req.params;
    const { Room_Number, Department_ID, Capacity } = req.body;
    const sql = `UPDATE Rooms SET Room_Number = ?, Department_ID = ?, Capacity = ? WHERE ID = ?`;
    db.query(sql, [Room_Number, Department_ID, Capacity, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Room updated successfully' });
    });
}

const deleteRoom = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM Rooms WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Room deleted successfully' });
    });
}

module.exports = {
    getAllRooms,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom
};
