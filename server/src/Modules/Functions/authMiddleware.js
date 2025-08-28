const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

const authorizePermLevel = (requiredPermLevel) => {
    return (req, res, next) => {
        if (req.user.permLevel < requiredPermLevel) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizePermLevel };
