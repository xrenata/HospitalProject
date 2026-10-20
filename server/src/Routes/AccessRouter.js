const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const { Staff, Role, AuditLog } = require('../Modules/Database/models');
const perms = require('../Modules/Functions/permissions');
const { can, serialize, audit, invalidate } = require('../Modules/Functions/access');
const { authenticateToken, requirePermission } = require('../Modules/Functions/authMiddleware');
const scope = require('../Modules/Database/hospitalScope');
const { Hospital } = require('../Modules/Database/models');

/**
 * Roles, the permission catalog, per-person access and the access audit log.
 *
 * @swagger
 * tags:
 *   - name: Access
 *     description: Roles and permissions
 */

router.use(authenticateToken);
// roles and people's access are shared across hospitals
router.use((req, res, next) => scope.run({ hospitalId: null, all: true }, next));

const isId = (value) => mongoose.isValidObjectId(value);

/** Someone who is not an administrator may only hand out permissions they hold themselves. */
const canGrant = (req, list) => req.access.isAdmin || list.every((p) => can(req.access, p));

const slug = (text) => text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'role';

const anyOf = (...keys) => (req, res, next) =>
    keys.some((k) => can(req.access, k)) ? next() : res.status(403).json({ message: 'Insufficient permissions', required: keys[0] });

const adminRole = () => Role.findOne({ key: 'admin' }).lean();

/** Would at least one other active administrator remain if `staffId` stops being one? */
const otherAdminsExist = async (staffId) => {
    const admin = await adminRole();
    if (!admin) return true;

    return (await Staff.countDocuments({ roleId: admin._id, status: { $ne: 'inactive' }, _id: { $ne: staffId } })) > 0;
};

// --- who am I -------------------------------------------------------------------------------------------------------

router.get('/me', (req, res) => res.json({ id: req.access.id, name: req.access.name, ...serialize(req.access) }));

// --- catalog ----------------------------------------------------------------------------------------------------------

router.get('/catalog', (req, res) => res.json({ groups: perms.CATALOG, all: perms.ALL_PERMISSIONS }));

// --- roles ----------------------------------------------------------------------------------------------------------

router.get('/roles', anyOf('roles.view', 'staff.assign_roles', 'staff.view'), async (req, res) => {
    try {
        const [roles, counts] = await Promise.all([
            Role.find().sort({ isSystem: -1, name: 1 }).lean(),
            Staff.aggregate([{ $group: { _id: '$roleId', n: { $sum: 1 } } }]),
        ]);
        const byRole = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

        res.json(roles.map((r) => ({ ...r, memberCount: byRole[String(r._id)] || 0 })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/roles', requirePermission('roles.create'), async (req, res) => {
    try {
        const { name, description = '', color = 'default' } = req.body;
        const permissions = perms.sanitize(req.body.permissions);
        if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ message: 'A role needs a name' });
        if (permissions.includes('*')) return res.status(400).json({ message: 'Only the Administrator role has full access' });
        if (!canGrant(req, permissions)) return res.status(403).json({ message: 'You can only give permissions you have yourself' });

        let key = slug(name);
        for (let i = 2; await Role.exists({ key }); i++) key = `${slug(name)}_${i}`;

        const role = await Role.create({ key, name: name.trim(), description, color, permissions });
        await audit(req, 'role.created', { type: 'role', id: role._id, name: role.name }, { permissions: permissions.length });
        invalidate();
        res.status(201).json({ ...role.toObject(), memberCount: 0 });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.put('/roles/:id', requirePermission('roles.edit'), async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
        const role = await Role.findById(req.params.id);
        if (!role) return res.status(404).json({ message: 'Role not found' });

        const before = new Set(role.permissions);
        const update = {};
        if (typeof req.body.name === 'string' && req.body.name.trim()) update.name = req.body.name.trim();
        if (typeof req.body.description === 'string') update.description = req.body.description;
        if (typeof req.body.color === 'string') update.color = req.body.color;

        if (req.body.permissions !== undefined) {
            if (role.locked) return res.status(400).json({ message: 'The permissions of this role cannot be changed' });
            const permissions = perms.sanitize(req.body.permissions);
            if (permissions.includes('*')) return res.status(400).json({ message: 'Only the Administrator role has full access' });
            if (!canGrant(req, permissions)) return res.status(403).json({ message: 'You can only give permissions you have yourself' });
            update.permissions = permissions;
        }

        Object.assign(role, update, { updatedAt: new Date() });
        await role.save();

        const after = new Set(role.permissions);
        const added = [...after].filter((p) => !before.has(p));
        const removed = [...before].filter((p) => !after.has(p));
        await audit(req, 'role.updated', { type: 'role', id: role._id, name: role.name }, { added, removed, fields: Object.keys(update).filter((k) => k !== 'permissions') });
        invalidate();
        res.json(role);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/roles/:id', requirePermission('roles.delete'), async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
        const role = await Role.findById(req.params.id);
        if (!role) return res.status(404).json({ message: 'Role not found' });
        if (role.isSystem) return res.status(400).json({ message: 'Built-in roles cannot be deleted' });

        const members = await Staff.countDocuments({ roleId: role._id });
        if (members > 0) {
            const target = req.query.reassignTo;
            if (!isId(target)) return res.status(409).json({ message: 'This role still has members', memberCount: members });
            const replacement = await Role.findById(target);
            if (!replacement || String(replacement._id) === String(role._id)) return res.status(400).json({ message: 'Pick a different role to move members to' });
            if (!canGrant(req, replacement.permissions)) return res.status(403).json({ message: 'You can only give permissions you have yourself' });
            await Staff.updateMany({ roleId: role._id }, { $set: { roleId: replacement._id } });
        }
        await role.deleteOne();
        await audit(req, 'role.deleted', { type: 'role', id: role._id, name: role.name }, { moved: members });
        invalidate();
        res.json({ message: 'Role deleted', moved: members });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/** People holding a role, paged. */
router.get('/roles/:id/members', requirePermission('roles.view'), async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
        const limit = Math.min(50, parseInt(req.query.limit, 10) || 10);
        const filter = { roleId: req.params.id };
        const [data, total] = await Promise.all([
            Staff.find(filter).select('name email role status').sort({ name: 1 }).limit(limit).lean(),
            Staff.countDocuments(filter),
        ]);
        res.json({ data, total });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- per-person access ---------------------------------------------------------------------------------------------

const describe = async (staffId) => {
    const staff = await Staff.findById(staffId)
        .select('name email role status permLevel roleId extraPermissions deniedPermissions hospitalId hospitalIds')
        .populate('roleId', 'key name color permissions')
        .lean();
    if (!staff) return null;
    const role = staff.roleId;
    const set = perms.effective(role?.permissions || [], staff.extraPermissions, staff.deniedPermissions);

    return {
        id: String(staff._id),
        name: staff.name,
        email: staff.email,
        jobTitle: staff.role,
        status: staff.status,
        role: role ? { id: String(role._id), key: role.key, name: role.name, color: role.color } : null,
        hospitalIds: (staff.hospitalIds || []).map(String),
        homeHospital: staff.hospitalId ? String(staff.hospitalId) : null,
        extraPermissions: staff.extraPermissions || [],
        deniedPermissions: staff.deniedPermissions || [],
        effective: set.has('*') ? ['*'] : Array.from(set).sort(),
    };
};

router.get('/staff/:id', anyOf('roles.view', 'staff.assign_roles'), async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
        const data = await describe(req.params.id);
        if (!data) return res.status(404).json({ message: 'Staff member not found' });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/** Apply a role and/or per-person grants and denies to one person. Returns an error string or null. */
const applyAccess = async (req, staffId, { roleId, extraPermissions, deniedPermissions }) => {
    const staff = await Staff.findById(staffId).populate('roleId', 'key permissions');
    if (!staff) return { status: 404, message: 'Staff member not found' };
    if (String(staff._id) === req.access.id && !req.access.isAdmin) return { status: 403, message: 'You cannot change your own access' };

    let role = staff.roleId;
    if (roleId !== undefined) {
        if (!isId(roleId)) return { status: 400, message: 'Invalid role' };
        role = await Role.findById(roleId);
        if (!role) return { status: 404, message: 'Role not found' };
    }
    const extra = extraPermissions !== undefined ? perms.sanitize(extraPermissions).filter((p) => p !== '*') : staff.extraPermissions;
    const denied = deniedPermissions !== undefined ? perms.sanitize(deniedPermissions).filter((p) => p !== '*') : staff.deniedPermissions;

    if (!canGrant(req, [...(role?.permissions || []), ...extra].filter((p) => p !== '*')) || (!req.access.isAdmin && (role?.permissions || []).includes('*'))) {
        return { status: 403, message: 'You can only give access you have yourself' };
    }

    const wasAdmin = staff.roleId?.key === 'admin';
    const willBeAdmin = role?.key === 'admin';
    if (wasAdmin && !willBeAdmin && !(await otherAdminsExist(staff._id))) {
        return { status: 400, message: 'There must always be at least one administrator' };
    }

    const before = await describe(staff._id);
    const set = perms.effective(role?.permissions || [], extra, denied);
    staff.roleId = role?._id;
    staff.extraPermissions = extra;
    staff.deniedPermissions = denied;
    staff.permLevel = perms.legacyLevel(set);
    await staff.save();

    const after = await describe(staff._id);
    await audit(req, 'staff.access_changed', { type: 'staff', id: staff._id, name: staff.name }, {
        role: [before.role?.name, after.role?.name],
        extra: [before.extraPermissions.length, after.extraPermissions.length],
        denied: [before.deniedPermissions.length, after.deniedPermissions.length],
    });

    return null;
};

router.put('/staff/:id', requirePermission('staff.assign_roles'), async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
        const problem = await applyAccess(req, req.params.id, req.body);
        invalidate();
        if (problem) return res.status(problem.status).json({ message: problem.message });
        res.json(await describe(req.params.id));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/** Which hospitals a person works in. Body: { hospitalIds: [...], homeHospital } */
router.put('/staff/:id/hospitals', requirePermission('staff.assign_roles'), async (req, res) => {
    try {
        if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
        const ids = Array.isArray(req.body.hospitalIds) ? req.body.hospitalIds.filter(isId) : [];
        if (!ids.length) return res.status(400).json({ message: 'Pick at least one hospital' });
        const found = await Hospital.find({ _id: { $in: ids } }).select('_id').lean();
        const valid = found.map((h) => String(h._id));
        const home = valid.includes(String(req.body.homeHospital)) ? String(req.body.homeHospital) : valid[0];
        const staff = await Staff.findByIdAndUpdate(req.params.id, { hospitalIds: valid, hospitalId: home }, { new: true }).select('name');
        if (!staff) return res.status(404).json({ message: 'Staff member not found' });
        invalidate();
        await audit(req, 'staff.hospitals_changed', { type: 'staff', id: staff._id, name: staff.name }, { hospitals: valid.length });
        res.json(await describe(req.params.id));
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

/** Give many people the same role in one go. Body: { ids: [...], roleId } */
router.put('/staff', requirePermission('staff.assign_roles'), async (req, res) => {
    try {
        const { ids, roleId } = req.body;
        if (!Array.isArray(ids) || !ids.length || ids.length > 500 || !ids.every(isId)) return res.status(400).json({ message: 'Pick between 1 and 500 people' });
        if (!isId(roleId)) return res.status(400).json({ message: 'Pick a role' });

        const results = { updated: 0, skipped: [] };
        for (const id of ids) {
            const problem = await applyAccess(req, id, { roleId });
            if (problem) results.skipped.push({ id, reason: problem.message });
            else results.updated++;
        }
        invalidate();
        res.json(results);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- audit log ------------------------------------------------------------------------------------------------------

router.get('/audit', requirePermission('roles.view'), async (req, res) => {
    try {
        const limit = Math.min(100, parseInt(req.query.limit, 10) || 30);
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const filter = {};
        if (req.query.targetType) filter.targetType = req.query.targetType;
        if (req.query.targetId && isId(req.query.targetId)) filter.targetId = req.query.targetId;
        const [data, total] = await Promise.all([
            AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            AuditLog.countDocuments(filter),
        ]);
        res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
