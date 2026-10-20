const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { Staff, Role } = require('../Modules/Database/models');
const perms = require('../Modules/Functions/permissions');
const { can, audit, invalidate } = require('../Modules/Functions/access');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Everyone signed in may read the staff directory (names for dropdowns); the full record is for staff.view.
const DIRECTORY_FIELDS = 'name role department_id specialization status';

const hasFullView = (req) => can(req.access, 'staff.view');

const fieldsFor = (req) => (hasFullView(req) ? (can(req.access, 'staff.salary') ? '' : '-salary') : DIRECTORY_FIELDS);

const SORTS = {
    name: { name: 1 },
    '-name': { name: -1 },
    newest: { created_at: -1 },
    oldest: { created_at: 1 },
    last_login: { lastLogin: -1 },
};

const getAllStaff = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const { search, role, status, department_id: departmentId, accessRole, sort = 'name' } = req.query;
        const filter = {};

        if (search && search.trim()) {
            const rx = new RegExp(escapeRegex(search.trim()), 'i');
            filter.$or = [{ name: rx }, { email: rx }, { specialization: rx }, { role: rx }, ...(hasFullView(req) ? [{ username: rx }] : [])];
        }
        if (role && role !== 'all') filter.role = role;
        if (status && status !== 'all') filter.status = status;
        if (departmentId && departmentId !== 'all' && mongoose.isValidObjectId(departmentId)) filter.department_id = departmentId;
        if (accessRole && accessRole !== 'all' && mongoose.isValidObjectId(accessRole)) filter.roleId = accessRole;

        const query = Staff.find(filter)
            .select(fieldsFor(req))
            .populate('department_id', 'name')
            .sort(SORTS[sort] || SORTS.name)
            .skip((page - 1) * limit)
            .limit(limit);
        if (hasFullView(req)) query.populate('roleId', 'key name color');

        const [staff, total] = await Promise.all([query.lean(), Staff.countDocuments(filter)]);

        res.status(200).json({
            data: staff,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getStaff = async (req, res) => {
    try {
        const { staff_id } = req.params;
        if (!mongoose.isValidObjectId(staff_id)) return res.status(400).json({ error: 'Invalid id' });
        const query = Staff.findById(staff_id).select(fieldsFor(req)).populate('department_id', 'name');
        if (hasFullView(req)) query.populate('roleId', 'key name color');
        const staff = await query.lean();

        if (!staff) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        res.status(200).json(staff);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createStaff = async (req, res) => {
    try {
        const { name, role, department_id, email, phone, specialization, hire_date, salary, username, password, roleId } = req.body;
        const data = { name, role, department_id: department_id || undefined, email, phone, specialization, hire_date, status: 'active' };
        if (salary !== undefined && can(req.access, 'staff.salary')) data.salary = salary;

        // an account (username + password + access role) is optional: some staff never sign in
        if (username || password || roleId) {
            if (!can(req.access, 'staff.assign_roles')) return res.status(403).json({ error: 'You are not allowed to create sign-in accounts or give access' });
            if (!username || !password) return res.status(400).json({ error: 'A username and a password are both needed for a sign-in account' });
            if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
            if (await Staff.exists({ username })) return res.status(400).json({ error: 'That username is already taken' });

            const accessRole = roleId ? await Role.findById(roleId) : await Role.findOne({ key: 'nurse' });
            if (!accessRole) return res.status(400).json({ error: 'Unknown role' });
            if (!req.access.isAdmin && (accessRole.permissions.includes('*') || !accessRole.permissions.every((p) => req.access.permissions.has(p)))) {
                return res.status(403).json({ error: 'You can only give access you have yourself' });
            }
            Object.assign(data, {
                username,
                password: await bcrypt.hash(String(password), 10),
                roleId: accessRole._id,
                permLevel: perms.legacyLevel(new Set(accessRole.permissions)),
            });
        } else {
            const nurse = await Role.findOne({ key: 'nurse' });
            if (nurse) Object.assign(data, { roleId: nurse._id, permLevel: 1 }); // can't sign in anyway (no password)
        }

        const saved = await new Staff(data).save();
        await audit(req, 'staff.created', { type: 'staff', id: saved._id, name: saved.name }, { account: Boolean(username) });
        invalidate();
        const out = saved.toObject();
        delete out.password;
        res.status(201).json({ message: 'Staff created successfully', staff: out });
    } catch (error) {
        res.status(400).json({ error: error.code === 11000 ? 'That email is already used by another staff member' : error.message });
    }
};

const updateStaff = async (req, res) => {
    try {
        const { staff_id } = req.params;
        if (!mongoose.isValidObjectId(staff_id)) return res.status(400).json({ error: 'Invalid id' });

        // Only these fields may be changed here. Access (role, permissions) has its own endpoint, and the
        // account password / activation are handled below with their own checks.
        const update = {};
        for (const key of ['name', 'role', 'email', 'phone', 'specialization', 'hire_date']) {
            if (req.body[key] !== undefined) update[key] = req.body[key];
        }
        if (req.body.department_id !== undefined) update.department_id = req.body.department_id || null;
        if (req.body.salary !== undefined && can(req.access, 'staff.salary')) update.salary = req.body.salary;

        if (req.body.status !== undefined) {
            if (!['active', 'inactive'].includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
            if (req.body.status === 'inactive') {
                if (staff_id === req.access.id) return res.status(400).json({ error: 'You cannot deactivate your own account' });
                const target = await Staff.findById(staff_id).populate('roleId', 'key');
                if (target?.roleId?.key === 'admin') {
                    const others = await Staff.countDocuments({ roleId: target.roleId._id, status: { $ne: 'inactive' }, _id: { $ne: target._id } });
                    if (!others) return res.status(400).json({ error: 'There must always be at least one active administrator' });
                }
            }
            update.status = req.body.status;
        }
        if (req.body.password !== undefined) {
            if (!can(req.access, 'staff.assign_roles')) return res.status(403).json({ error: 'You are not allowed to reset passwords' });
            if (String(req.body.password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
            update.password = await bcrypt.hash(String(req.body.password), 10);
        }
        update.updated_at = new Date();

        const staff = await Staff.findByIdAndUpdate(staff_id, update, { new: true, runValidators: true }).select(fieldsFor(req));
        if (!staff) {
            return res.status(404).json({ error: 'Staff member not found' });
        }
        if (update.status || update.password) {
            await audit(req, update.password ? 'staff.password_reset' : 'staff.status_changed', { type: 'staff', id: staff._id, name: staff.name }, update.status ? { status: update.status } : undefined);
        }
        invalidate();
        res.status(200).json({ message: 'Staff updated successfully', staff });
    } catch (error) {
        res.status(400).json({ error: error.code === 11000 ? 'That email is already used by another staff member' : error.message });
    }
};

const deleteStaff = async (req, res) => {
    try {
        const { staff_id } = req.params;
        if (!mongoose.isValidObjectId(staff_id)) return res.status(400).json({ error: 'Invalid id' });
        if (staff_id === req.access.id) return res.status(400).json({ error: 'You cannot delete your own account' });

        const target = await Staff.findById(staff_id).populate('roleId', 'key');
        if (!target) return res.status(404).json({ error: 'Staff member not found' });
        if (target.roleId?.key === 'admin') {
            const others = await Staff.countDocuments({ roleId: target.roleId._id, status: { $ne: 'inactive' }, _id: { $ne: target._id } });
            if (!others) return res.status(400).json({ error: 'There must always be at least one active administrator' });
        }

        await target.deleteOne();
        await audit(req, 'staff.deleted', { type: 'staff', id: target._id, name: target.name });
        invalidate();
        res.status(200).json({ message: 'Staff deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllStaff,
    getStaff,
    createStaff,
    updateStaff,
    deleteStaff
};
