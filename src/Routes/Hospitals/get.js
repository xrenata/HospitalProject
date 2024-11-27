const express = require('express');
const router = express.Router();
const db = require('../../Modules/Database/db');

router.get('/', (req, res) => {
  const sql = 'SELECT * FROM Hospital';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM Hospital WHERE ID = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Not found.' });
    res.status(200).json(results[0]);
  });
});

module.exports = router;
