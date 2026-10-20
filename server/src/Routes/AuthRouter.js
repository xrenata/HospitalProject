const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Staff } = require('../Modules/Database/models');
const rateLimit = require('express-rate-limit');
const { authenticateToken, requirePermission } = require('../Modules/Functions/authMiddleware');
const { serialize, invalidate } = require('../Modules/Functions/access');
const perms = require('../Modules/Functions/permissions');
const { Role } = require('../Modules/Database/models');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts, please try again later' },
});

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
// Only admins (permLevel 3) can create accounts
router.post('/register', authenticateToken, requirePermission('staff.assign_roles'), async (req, res) => {
    try {
        const { username, password, permLevel, roleId, name, role, email } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        if (typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Invalid input' });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        // the access role: given directly, or derived from the old 1-3 level
        let accessRole = null;
        if (roleId) accessRole = await Role.findById(roleId);
        else if (permLevel !== undefined) accessRole = await Role.findOne({ key: perms.LEGACY_ROLE_BY_LEVEL[permLevel] });
        else accessRole = await Role.findOne({ key: 'nurse' });
        if (!accessRole) return res.status(400).json({ message: 'Unknown role' });
        if (!req.access.isAdmin && (accessRole.permissions.includes('*') || !accessRole.permissions.every((p) => req.access.permissions.has(p)))) {
            return res.status(403).json({ message: 'You can only give access you have yourself' });
        }

        if (await Staff.findOne({ username })) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const user = new Staff({
            name: name || username,
            role: role || accessRole.name,
            email: email || `${username}@hospital.local`,
            username,
            password: await bcrypt.hash(password, 10),
            roleId: accessRole._id,
            permLevel: perms.legacyLevel(new Set(accessRole.permissions))
        });

        await user.save();
        invalidate();
        res.status(201).json({ message: 'User registered successfully', id: user._id });
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
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        const user = await Staff.findOne({ username }).select('+password');
        
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

        if (user.status === 'inactive') {
            return res.status(403).json({ message: 'This account is disabled' });
        }
        await Staff.updateOne({ _id: user._id }, { lastLogin: new Date() });

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

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the signed-in user's profile
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile of the current user (no password)
 *       404:
 *         description: User no longer exists
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await Staff.findById(req.user.id).select('-password').lean();
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({
            id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            specialization: user.specialization,
            permLevel: user.permLevel,
            status: user.status,
            hireDate: user.hire_date || user.hireDate,
            ...serialize(req.access),
            exp: req.user.exp
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to load profile' });
    }
});

/**
 * @swagger
 * /api/auth/password:
 *   put:
 *     summary: Change the signed-in user's password
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Invalid input or wrong current password
 */
router.put('/password', authenticateToken, loginLimiter, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        const user = await Staff.findById(req.user.id).select('+password');
        if (!user || !user.password) return res.status(404).json({ message: 'User not found' });

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ message: 'Password updated' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update password' });
    }
});

module.exports = router;
