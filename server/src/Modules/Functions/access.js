const { Staff, Role, AuditLog } = require('../Database/models');
const perms = require('./permissions');

const TTL = 20 * 1000;
const cache = new Map(); // staffId -> { at, value }

/** Call after any change to a role or to someone's access so it takes effect immediately. */
const invalidate = () => cache.clear();

/**
 * Load what a person may currently do. Always read from the database (cached for a few seconds), never
 * from the token, so changing a role or disabling an account applies right away.
 */
const loadAccess = async (staffId) => {
    const hit = cache.get(String(staffId));
    if (hit && Date.now() - hit.at < TTL) return hit.value;

    const staff = await Staff.findById(staffId)
        .setOptions({ allHospitals: true })
        .select('name username status permLevel roleId extraPermissions deniedPermissions hospitalId hospitalIds')
        .populate('roleId', 'key name color permissions')
        .lean();

    let value = null;
    if (staff) {
        let role = staff.roleId;
        if (!role) {
            // accounts created before roles existed: fall back on the old 1-3 level
            role = await Role.findOne({ key: perms.LEGACY_ROLE_BY_LEVEL[staff.permLevel] || 'nurse' }).lean();
        }
        const set = perms.effective(role?.permissions || [], staff.extraPermissions, staff.deniedPermissions);
        value = {
            id: String(staff._id),
            name: staff.name,
            username: staff.username,
            active: staff.status !== 'inactive',
            role: role ? { id: String(role._id), key: role.key, name: role.name, color: role.color } : null,
            permissions: set,
            isAdmin: set.has('*'),
            homeHospital: staff.hospitalId ? String(staff.hospitalId) : null,
            hospitalIds: (staff.hospitalIds || []).map(String),
        };
    }
    cache.set(String(staffId), { at: Date.now(), value });

    return value;
};

const can = (access, key) => perms.can(access?.permissions, key);

/** Compact form for the client: ["*"] for administrators, otherwise the explicit list. */
const serialize = (access) => ({
    accessRole: access.role,
    isAdmin: access.isAdmin,
    permissions: access.isAdmin ? ['*'] : Array.from(access.permissions).sort(),
});

const audit = async (req, action, target = {}, details) => {
    try {
        await AuditLog.create({
            actorId: req.user?.id,
            actorName: req.access?.name || req.user?.username,
            action,
            targetType: target.type,
            targetId: target.id ? String(target.id) : undefined,
            targetName: target.name,
            details,
        });
    } catch (error) {
        console.error('Could not write audit log:', error.message);
    }
};

/**
 * Make sure the built-in roles exist and that every existing account has a role.
 * Existing roles are never overwritten, so edits made in the UI survive restarts.
 */
const ensureAccessControl = async () => {
    for (const def of perms.DEFAULT_ROLES) {
        await Role.updateOne(
            { key: def.key },
            {
                $setOnInsert: {
                    key: def.key, name: def.name, description: def.description, color: def.color,
                    permissions: def.permissions, isSystem: true, locked: Boolean(def.locked),
                },
            },
            { upsert: true },
        );
    }
    // permissions for resources added after a role was created are offered to the built-in roles once
    const offered = perms.NEW_RESOURCES.map((r) => `${r}.`);
    for (const def of perms.DEFAULT_ROLES) {
        if (def.permissions.includes('*')) continue;
        const fresh = def.permissions.filter((p) => offered.some((o) => p.startsWith(o)));
        if (!fresh.length) continue;
        await Role.updateOne({ key: def.key, offeredResources: { $ne: perms.NEW_RESOURCES.join(',') } }, { $addToSet: { permissions: { $each: fresh } }, $set: { offeredResources: perms.NEW_RESOURCES.join(',') } }, { strict: false });
    }
    const roles = await Role.find({ key: { $in: Object.values(perms.LEGACY_ROLE_BY_LEVEL) } }).lean();
    const byKey = Object.fromEntries(roles.map((r) => [r.key, r._id]));

    for (const [level, key] of Object.entries(perms.LEGACY_ROLE_BY_LEVEL)) {
        if (!byKey[key]) continue;
        await Staff.updateMany({ roleId: { $exists: false }, permLevel: Number(level) }, { $set: { roleId: byKey[key] } });
    }
    // accounts with no permLevel at all behave like nurses
    if (byKey.nurse) await Staff.updateMany({ roleId: { $exists: false } }, { $set: { roleId: byKey.nurse } });
    invalidate();
};

module.exports = { loadAccess, can, serialize, audit, invalidate, ensureAccessControl };
