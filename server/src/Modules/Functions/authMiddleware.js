const jwt = require('jsonwebtoken');
const { loadAccess, can } = require('./access');
const { legacyLevel } = require('./permissions');

const ACTION_BY_METHOD = { GET: 'view', HEAD: 'view', POST: 'create', PUT: 'edit', PATCH: 'edit', DELETE: 'delete' };

/**
 * Verifies the token, then loads the person's current access from the database. Deleted or
 * deactivated accounts are rejected here even if their token has not expired yet.
 */
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });

        try {
            const access = await loadAccess(user.id);
            if (!access) return res.status(401).json({ message: 'Account no longer exists' });
            if (!access.active) return res.status(403).json({ message: 'Account is disabled' });
            req.user = { ...user, role: access.role?.name, permLevel: legacyLevel(access.permissions) };
            req.access = access;
            next();
        } catch (error) {
            res.status(500).json({ message: 'Could not verify access' });
        }
    });
};

/** Allow the request only if the person holds this exact permission, e.g. requirePermission('roles.edit'). */
const requirePermission = (key) => (req, res, next) => {
    if (can(req.access, key)) return next();
    res.status(403).json({ message: 'Insufficient permissions', required: key });
};

/**
 * Guard a whole resource: GET needs "<resource>.view", POST ".create", PUT/PATCH ".edit", DELETE ".delete".
 * `readAny` lets any signed-in person read it (reference data such as the staff directory); the handler is
 * then expected to limit what it returns.
 */
const authorizeResource = (resource, { readAny = false } = {}) => (req, res, next) => {
    const action = ACTION_BY_METHOD[req.method] || 'view';
    const key = `${resource}.${action}`;
    if (can(req.access, key) || (readAny && action === 'view')) return next();
    res.status(403).json({ message: 'Insufficient permissions', required: key });
};

// Kept so older route files keep working: maps the legacy 1-3 level onto the permissions people hold.
const authorizePermLevel = (requiredPermLevel) => (req, res, next) => {
    const level = can(req.access, 'roles.edit') ? 3 : [...(req.access?.permissions || [])].some((p) => /\.(create|edit|delete)$/.test(p)) ? 2 : 1;
    if (level < requiredPermLevel) return res.status(403).json({ message: 'Insufficient permissions' });
    next();
};

module.exports = { authenticateToken, authorizeResource, requirePermission, authorizePermLevel };
