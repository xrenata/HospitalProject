const mongoose = require('mongoose');
const {
    Hospital, Patient, Staff, Department, Room, Appointment, Equipment, Medication,
} = require('../Modules/Database/models');
const scope = require('../Modules/Database/hospitalScope');
const { allowedFor, grantAdmins, invalidateHospitals } = require('../Modules/Functions/hospitals');
const { can, audit } = require('../Modules/Functions/access');

const FIELDS = [
    'name', 'type', 'capacity', 'address', 'ambulanceCount', 'equipment', 'phone', 'email', 'website', 'establishedDate',
    'licenseNumber', 'status', 'group', 'code', 'city',
];

const clean = (body) => {
    const data = {};
    for (const key of FIELDS) {
        if (body[key] === undefined) continue;
        data[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
    }
    if (data.capacity !== undefined) data.capacity = Number(data.capacity) || 0;
    if (data.ambulanceCount !== undefined) data.ambulanceCount = Number(data.ambulanceCount) || 0;
    if (data.status && !['active', 'inactive', 'under_maintenance'].includes(data.status)) delete data.status;
    // older documents carry snake_case twins of a few fields
    if (data.ambulanceCount !== undefined) data.ambulance_count = data.ambulanceCount;
    if (data.establishedDate) data.established_date = data.establishedDate;
    if (data.licenseNumber !== undefined) data.license_number = data.licenseNumber;
    data.updatedAt = new Date();
    data.updated_at = new Date();

    return data;
};

const countsFor = async (id) => {
    const filter = { hospitalId: new mongoose.Types.ObjectId(String(id)) };
    const opts = { allHospitals: true };
    const isDefault = String(id) === scope.getDefaultHospital();
    const where = isDefault ? { $or: [filter, { hospitalId: { $exists: false } }] } : filter;
    const staffWhere = { $or: [filter, { hospitalIds: filter.hospitalId }] };
    const [patients, staff, departments, rooms, equipment, medications, upcoming] = await Promise.all([
        Patient.countDocuments(where).setOptions(opts),
        Staff.countDocuments(staffWhere).setOptions(opts),
        Department.countDocuments(where).setOptions(opts),
        Room.countDocuments(where).setOptions(opts),
        Equipment.countDocuments(where).setOptions(opts),
        Medication.countDocuments(where).setOptions(opts),
        Appointment.countDocuments({ ...where, status: 'scheduled', appointmentDate: { $gte: new Date() } }).setOptions(opts),
    ]);

    return { patients, staff, departments, rooms, equipment, medications, upcoming };
};

// Management list: every hospital with its group and a few numbers
const getAllHospitals = async (req, res) => {
    try {
        const { search, status } = req.query;
        const query = {};
        if (status) query.status = status;
        if (search) {
            const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            query.$or = [{ name: rx }, { group: rx }, { city: rx }, { code: rx }];
        }
        const rows = await Hospital.find(query).sort({ group: 1, name: 1 }).lean();
        const withCounts = req.query.counts === '0' ? rows : await Promise.all(rows.map(async (h) => ({ ...h, counts: await countsFor(h._id) })));

        res.json({ success: true, data: withCounts, pagination: { currentPage: 1, totalPages: 1, totalItems: withCounts.length } });
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// For the switcher in the sidebar: what this person may open
const getMine = async (req, res) => {
    try {
        const rows = await allowedFor(req.access);
        res.json({
            success: true,
            current: req.hospital?.all ? 'all' : req.hospital?.id,
            canAll: Boolean(req.access?.isAdmin) && rows.length > 1,
            data: rows.map((h) => ({
                _id: h._id, name: h.name, group: h.group, code: h.code, city: h.city, status: h.status, isDefault: Boolean(h.isDefault),
            })),
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getHospital = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id).lean();
        if (!hospital) return res.status(404).json({ success: false, error: 'Hospital not found' });
        res.json({ success: true, data: { ...hospital, counts: await countsFor(hospital._id) } });
    } catch (error) {
        res.status(404).json({ success: false, error: 'Hospital not found' });
    }
};

const createHospital = async (req, res) => {
    try {
        const data = clean(req.body);
        if (!data.name) return res.status(400).json({ success: false, error: 'Name is required' });
        if (await Hospital.exists({ name: new RegExp(`^${data.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'), ...(data.group ? { group: data.group } : {}) })) {
            return res.status(409).json({ success: false, error: 'A hospital with this name already exists' });
        }
        const saved = await Hospital.create({ type: 'general', capacity: 0, address: '', status: 'active', ...data });
        await grantAdmins([saved._id]);
        invalidateHospitals();
        await audit(req, 'hospital.created', { type: 'hospital', id: saved._id, name: saved.name });

        res.status(201).json({ success: true, message: 'Hospital created successfully', hospitalId: saved._id, data: saved });
    } catch (error) {
        console.error('Error creating hospital:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const updateHospital = async (req, res) => {
    try {
        const update = clean(req.body);
        const hospital = await Hospital.findById(req.params.id);
        if (!hospital) return res.status(404).json({ success: false, error: 'Hospital not found' });
        if (update.status === 'inactive' && hospital.isDefault) {
            return res.status(400).json({ success: false, error: 'The default hospital cannot be deactivated. Make another hospital the default first.' });
        }
        if (req.body.isDefault === true && !hospital.isDefault) {
            await Hospital.updateMany({ isDefault: true }, { $set: { isDefault: false } });
            update.isDefault = true;
            scope.setDefaultHospital(hospital._id);
        }
        const saved = await Hospital.findByIdAndUpdate(req.params.id, update, { new: true });
        invalidateHospitals();
        await audit(req, 'hospital.updated', { type: 'hospital', id: saved._id, name: saved.name }, Object.keys(update));

        res.json({ success: true, message: 'Hospital updated successfully', data: saved });
    } catch (error) {
        console.error('Error updating hospital:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Only hospitals with no data can be removed; otherwise deactivate them.
const deleteHospital = async (req, res) => {
    try {
        if (!can(req.access, 'hospital.delete')) return res.status(403).json({ success: false, error: 'Insufficient permissions' });
        const hospital = await Hospital.findById(req.params.id).lean();
        if (!hospital) return res.status(404).json({ success: false, error: 'Hospital not found' });
        if (hospital.isDefault) return res.status(400).json({ success: false, error: 'The default hospital cannot be deleted' });
        const counts = await countsFor(hospital._id);
        const homeStaff = await Staff.countDocuments({ hospitalId: hospital._id }).setOptions({ allHospitals: true });
        if (counts.patients || homeStaff || counts.departments) {
            return res.status(409).json({ success: false, error: 'This hospital still has patients, staff or departments. Deactivate it instead.', counts });
        }
        await Hospital.findByIdAndDelete(req.params.id);
        await Staff.collection.updateMany({}, { $pull: { hospitalIds: hospital._id } });
        invalidateHospitals();
        await audit(req, 'hospital.deleted', { type: 'hospital', id: hospital._id, name: hospital.name });

        res.json({ success: true, message: 'Hospital deleted successfully' });
    } catch (error) {
        console.error('Error deleting hospital:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { getAllHospitals, getMine, getHospital, createHospital, updateHospital, deleteHospital };
