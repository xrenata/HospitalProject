const mongoose = require('mongoose');
const { Hospital, Staff, Role } = require('../Database/models');
const scope = require('../Database/hospitalScope');

const TTL = 10 * 1000;
let cache = { at: 0, list: [] };

const invalidateHospitals = () => { cache = { at: 0, list: [] }; };

const list = async () => {
    if (Date.now() - cache.at < TTL && cache.list.length) return cache.list;
    const rows = await Hospital.find().sort({ name: 1 }).lean();
    cache = { at: Date.now(), list: rows };

    return rows;
};

/** The administrators' role: they belong to every hospital. */
const adminStaffFilter = async () => {
    const admin = await Role.findOne({ key: 'admin' }).select('_id').lean();

    return admin ? { roleId: admin._id } : null;
};

const grantAdmins = async (hospitalIds) => {
    const filter = await adminStaffFilter();
    if (!filter || !hospitalIds.length) return;
    await Staff.collection.updateMany(filter, { $addToSet: { hospitalIds: { $each: hospitalIds.map((id) => new mongoose.Types.ObjectId(String(id))) } } });
};

/** First start: make sure there is a default hospital, give existing data to it, and let admins into every hospital. */
const ensureHospitals = async () => {
    let def = await Hospital.findOne({ isDefault: true }).lean();
    if (!def) {
        const first = await Hospital.findOne().sort({ createdAt: 1 }).lean();
        if (first) {
            await Hospital.updateOne({ _id: first._id }, { $set: { isDefault: true } });
            def = { ...first, isDefault: true };
        } else {
            def = (await Hospital.create({
                name: 'Main Hospital', type: 'general', capacity: 0, address: '-', isDefault: true, status: 'active',
            })).toObject();
        }
    }
    scope.setDefaultHospital(def._id);
    await scope.backfill();
    const all = await Hospital.find().select('_id').lean();
    await grantAdmins(all.map((h) => h._id));
    invalidateHospitals();
};

const idsOf = (access) => (access?.hospitalIds || []).map(String);

/** Hospitals this person may work in. Administrators: all of them. */
const allowedFor = async (access) => {
    const rows = await list();
    if (access?.isAdmin) return rows;
    const ids = new Set(idsOf(access));
    if (access?.homeHospital) ids.add(String(access.homeHospital));
    if (!ids.size && scope.getDefaultHospital()) ids.add(scope.getDefaultHospital());

    return rows.filter((h) => ids.has(String(h._id)));
};

const EXEMPT = /^\/(auth|access|hospitals)(\/|$)/;

/**
 * Runs the rest of the request inside the chosen hospital. The client sends X-Hospital-Id (a hospital id, or
 * "all" for administrators who want to look across hospitals; changes are not allowed in that mode).
 */
const hospitalContext = async (req, res, next) => {
    try {
        const allowed = await allowedFor(req.access);
        const active = allowed.filter((h) => h.status !== 'inactive');
        const requested = req.header('X-Hospital-Id');

        if (requested === 'all') {
            if (!req.access?.isAdmin) return res.status(403).json({ message: 'Not allowed to view all hospitals', code: 'HOSPITAL_FORBIDDEN' });
            if (req.method !== 'GET' && !EXEMPT.test(req.path)) {
                return res.status(400).json({ message: 'Pick one hospital to make changes', code: 'HOSPITAL_REQUIRED' });
            }
            req.hospital = { id: null, all: true };

            return scope.run({ hospitalId: null, all: true }, next);
        }

        let hospital = null;
        if (requested) {
            hospital = allowed.find((h) => String(h._id) === requested);
            if (!hospital) return res.status(403).json({ message: 'No access to that hospital', code: 'HOSPITAL_FORBIDDEN' });
        } else {
            const home = req.access?.homeHospital ? String(req.access.homeHospital) : scope.getDefaultHospital();
            hospital = active.find((h) => String(h._id) === home) || active[0] || allowed[0];
        }
        if (!hospital) return res.status(403).json({ message: 'You are not assigned to a hospital', code: 'HOSPITAL_FORBIDDEN' });

        req.hospital = { id: String(hospital._id), all: false };

        return scope.run({ hospitalId: String(hospital._id), all: false }, next);
    } catch (error) {
        console.error('hospital context:', error);

        return res.status(500).json({ message: 'Could not determine the hospital' });
    }
};

module.exports = { ensureHospitals, hospitalContext, allowedFor, invalidateHospitals, grantAdmins, list };
