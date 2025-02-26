const db = require('../Modules/Database/db');

const getAllSurgeryTeams = (req, res) => {
    const sql = `SELECT * FROM Surgery_Team`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const getSurgeryTeam = (req, res) => {
    const { surgery_team_id } = req.params;
    const sql = `SELECT * FROM Surgery_Team WHERE ID = ?`;
    db.query(sql, surgery_team_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result);
    });
}

const createSurgeryTeam = (req, res) => {
    const { Staff_ID, Surgery_Type, Surgery_Date, Surgery_Duration, Outcome } = req.body;
    const sql = `INSERT INTO Surgery_Team (Staff_ID, Surgery_Type, Surgery_Date, Surgery_Duration, Outcome) VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [Staff_ID, Surgery_Type, Surgery_Date, Surgery_Duration, Outcome], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Surgery team created successfully', surgeryTeamId: result.insertId });
    });
}

const updateSurgeryTeam = (req, res) => {
    const { surgery_team_id } = req.params;
    const { Staff_ID, Surgery_Type, Surgery_Date, Surgery_Duration, Outcome } = req.body;
    const sql = `UPDATE Surgery_Team SET Staff_ID = ?, Surgery_Type = ?, Surgery_Date = ?, Surgery_Duration = ?, Outcome = ? WHERE ID = ?`;
    db.query(sql, [Staff_ID, Surgery_Type, Surgery_Date, Surgery_Duration, Outcome, surgery_team_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Surgery team updated successfully' });
    });
}

const deleteSurgeryTeam = (req, res) => {
    const { surgery_team_id } = req.params;
    const sql = `DELETE FROM Surgery_Team WHERE ID = ?`;
    db.query(sql, surgery_team_id, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Surgery team deleted successfully' });
    });
}

module.exports = {
    getAllSurgeryTeams,
    getSurgeryTeam,
    createSurgeryTeam,
    updateSurgeryTeam,
    deleteSurgeryTeam
};
