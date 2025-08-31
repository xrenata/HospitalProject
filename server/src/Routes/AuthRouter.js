const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Staff } = require('../Modules/Database/models');
const { executeQuery } = require('../Modules/Database/queryHelper');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user with username, password, and permission level
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - permLevel
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username for the user
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password (will be hashed)
 *                 example: "securepassword123"
 *               permLevel:
 *                 type: integer
 *                 description: Permission level
 *                 example: 1
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *       400:
 *         description: Bad request - Missing or invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Missing required fields
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error message
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password, permLevel } = req.body;
        if (!username || !password || permLevel === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Check if user already exists
        const existingUser = await Staff.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new Staff({
            username,
            password: hashedPassword,
            permLevel
        });
        
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate a user
 *     description: Login with username and password to receive an authentication token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: User's username
 *                 example: "johndoe"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: "securepassword123"
 *     responses:
 *       200:
 *         description: Successful authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid credentials or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Database query failed"
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const user = await Staff.findOne({ username });
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        if (!user.password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ 
            id: user._id, 
            username: user.username, 
            permLevel: user.permLevel 
        }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Error during authentication' });
    }
});

module.exports = router;
