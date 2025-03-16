const db = require("../Modules/Database/db");

const getAllFeedback = (req, res) => {
    const sql = `SELECT * FROM Feedback`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getFeedback = (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM Feedback WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createFeedback = (req, res) => {
    const { Patient_ID, Staff_ID, Feedback_Date, Comments, Rating } = req.body;
    const sql = `INSERT INTO Feedback (Patient_ID, Staff_ID, Feedback_Date, Comments, Rating) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [Patient_ID, Staff_ID, Feedback_Date, Comments, Rating], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Feedback created successfully', feedbackId: result.insertId });
    });
}

const updateFeedback = (req, res) => {
    const { id } = req.params;
    const { Patient_ID, Staff_ID, Feedback_Date, Comments, Rating } = req.body;
    const sql = `UPDATE Feedback SET Patient_ID = ?, Staff_ID = ?, Feedback_Date = ?, Comments = ?, Rating = ? WHERE ID = ?`;
    db.query(sql, [Patient_ID, Staff_ID, Feedback_Date, Comments, Rating, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Feedback updated successfully' });
    });
}

const deleteFeedback = (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM Feedback WHERE ID = ?`;
    db.query(sql, id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Feedback deleted successfully' });
    });
}

module.exports = {
    getAllFeedback,
    getFeedback,
    createFeedback,
    updateFeedback,
    deleteFeedback
};
