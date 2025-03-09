const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../Modules/Database/db');

router.post('/register', async (req, res) => {
    const { username, password, permLevel } = req.body;
    if (!username || !password || permLevel === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO Users (username, password, permLevel) VALUES (?, ?, ?)`;
    db.query(sql, [username, hashedPassword, permLevel], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'User registered successfully' });
    });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const sql = `SELECT * FROM Users WHERE username = ?`;
    db.query(sql, [username], async (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

        const user = result[0];
        console.log(user);
        if (!user.Password) {
            return res.status(400).json({ message: 'Invalid credentials' });
            
        }
        try {
            const validPassword = await bcrypt.compare(password, user.Password);
            console.log(validPassword);
            if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

            const token = jwt.sign({ id: user.id, username: user.username, permLevel: user.permLevel }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
});

module.exports = router;
