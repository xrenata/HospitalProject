const express = require('express');
const mongoose = require('mongoose');
const { Invoice, BloodUnit, MaintenanceRequest, Incident, Ambulance } = require('../Modules/Database/modules');
const { audit } = require('../Modules/Functions/access');

/**
 * One small CRUD router per configured module (billing, blood bank, maintenance, incidents, ambulances).
 * `fields` is the whitelist of what a client may write; `filters` are the query parameters the list understands.
 */
const isId = (v) => mongoose.isValidObjectId(v);

const crud = (Model, cfg) => {
    const router = express.Router();
    const { fields, search = [], filters = [], populate = [], sort = { createdAt: -1 }, prepare, label } = cfg;

    const pick = (body) => {
        const data = {};
        for (const key of fields) {
            if (body[key] === undefined) continue;
            const value = typeof body[key] === 'string' ? body[key].trim() : body[key];
            if (value === '' && /Id$/.test(key)) { data[key] = null; continue; }
            data[key] = value;
        }

        return data;
    };

    const load = (query) => populate.reduce((q, p) => q.populate(p.path, p.select), query);

    router.get('/', async (req, res) => {
        try {
            const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 200);
            const query = {};
            for (const f of filters) {
                if (req.query[f] && req.query[f] !== 'all') query[f] = req.query[f];
            }
            if (req.query.search) {
                const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                query.$or = search.map((f) => ({ [f]: rx }));
            }
            const [rows, total] = await Promise.all([
                load(Model.find(query).sort(sort).skip((page - 1) * limit).limit(limit)).lean(),
                Model.countDocuments(query),
            ]);
            res.json({
                success: true, data: rows, items: rows,
                pagination: { currentPage: page, totalPages: Math.max(Math.ceil(total / limit), 1), totalItems: total, itemsPerPage: limit },
            });
        } catch (error) {
            console.error(`${label} list:`, error);
            res.status(500).json({ error: 'Could not load the list' });
        }
    });

    router.get('/:id', async (req, res) => {
        if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
        const doc = await load(Model.findById(req.params.id)).lean();
        if (!doc) return res.status(404).json({ error: 'Not found' });
        res.json(doc);
    });

    router.post('/', async (req, res) => {
        try {
            const data = pick(req.body || {});
            if (prepare) await prepare(data, { req, isNew: true });
            const doc = await Model.create(data);
            await audit(req, `${label}.created`, { type: label, id: doc._id, name: data.title || data.callSign || data.invoiceNumber });
            res.status(201).json(doc);
        } catch (error) {
            const status = error.status || (error.name === 'ValidationError' ? 400 : 500);
            if (status === 500) console.error(`${label} create:`, error);
            res.status(status).json({ error: status === 500 ? 'Could not save' : error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
            const doc = await Model.findById(req.params.id);
            if (!doc) return res.status(404).json({ error: 'Not found' });
            const data = pick(req.body || {});
            Object.assign(doc, data);
            if (prepare) await prepare(doc, { req, isNew: false });
            await doc.save();
            res.json(doc);
        } catch (error) {
            const status = error.status || (error.name === 'ValidationError' ? 400 : 500);
            if (status === 500) console.error(`${label} update:`, error);
            res.status(status).json({ error: status === 500 ? 'Could not save' : error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ error: 'Not found' });
        await audit(req, `${label}.deleted`, { type: label, id: doc._id });
        res.json({ message: 'Removed' });
    });

    return router;
};

const staff = { path: 'reportedBy', select: 'name' };

const totals = (doc) => {
    const items = Array.isArray(doc.items) ? doc.items : [];
    const subtotal = items.reduce((a, i) => a + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0);
    doc.subtotal = subtotal;
    doc.insuranceCovered = Math.min(Number(doc.insuranceCovered) || 0, subtotal);
    doc.total = Math.max(subtotal - doc.insuranceCovered, 0);
    doc.paid = Math.min(Math.max(Number(doc.paid) || 0, 0), doc.total);
};

const invoices = crud(Invoice, {
    label: 'invoice',
    fields: ['patientId', 'items', 'insuranceCovered', 'paid', 'status', 'issueDate', 'dueDate', 'paymentMethod', 'notes'],
    search: ['invoiceNumber', 'notes'],
    filters: ['status', 'patientId'],
    sort: { issueDate: -1 },
    populate: [{ path: 'patientId', select: 'firstName lastName first_name last_name' }],
    async prepare(doc, { isNew }) {
        totals(doc);
        if (isNew && !doc.invoiceNumber) {
            const count = await Invoice.countDocuments();
            doc.invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
        }
        if (doc.status !== 'cancelled' && doc.status !== 'draft') {
            if (doc.total > 0 && doc.paid >= doc.total) doc.status = 'paid';
            else if (doc.paid > 0) doc.status = 'partial';
            else if (doc.dueDate && new Date(doc.dueDate) < new Date() && doc.status === 'issued') doc.status = 'overdue';
        }
    },
});

const blood = crud(BloodUnit, {
    label: 'blood_unit',
    fields: ['bloodType', 'component', 'units', 'donorName', 'collectedDate', 'expiryDate', 'location', 'status', 'notes'],
    search: ['donorName', 'bloodType', 'location'],
    filters: ['status', 'bloodType', 'component'],
    sort: { expiryDate: 1 },
    prepare(doc) {
        if (!doc.expiryDate) {
            const days = doc.component === 'platelets' ? 5 : doc.component === 'plasma' ? 365 : 42;
            doc.expiryDate = new Date(new Date(doc.collectedDate || Date.now()).getTime() + days * 86400000);
        }
        if (doc.status === 'available' && doc.expiryDate && new Date(doc.expiryDate) < new Date()) doc.status = 'expired';
    },
});

const maintenance = crud(MaintenanceRequest, {
    label: 'maintenance',
    fields: ['title', 'description', 'equipmentId', 'roomId', 'location', 'priority', 'status', 'assignedTo', 'dueDate', 'cost', 'notes'],
    search: ['title', 'description', 'location'],
    filters: ['status', 'priority'],
    populate: [staff, { path: 'assignedTo', select: 'name' }, { path: 'equipmentId', select: 'name' }, { path: 'roomId', select: 'roomNumber' }],
    prepare(doc, { req, isNew }) {
        if (isNew) doc.reportedBy = req.access.id;
        if (['resolved', 'closed'].includes(doc.status) && !doc.resolvedAt) doc.resolvedAt = new Date();
    },
});

const incidents = crud(Incident, {
    label: 'incident',
    fields: ['title', 'incidentType', 'severity', 'description', 'location', 'occurredAt', 'patientId', 'status', 'actionsTaken'],
    search: ['title', 'description', 'location'],
    filters: ['status', 'severity', 'incidentType'],
    sort: { occurredAt: -1 },
    populate: [staff, { path: 'patientId', select: 'firstName lastName first_name last_name' }],
    prepare(doc, { req, isNew }) { if (isNew) doc.reportedBy = req.access.id; },
});

const ambulances = crud(Ambulance, {
    label: 'ambulance',
    fields: ['callSign', 'plate', 'vehicleType', 'status', 'station', 'driverId', 'crew', 'lastService', 'nextService', 'mileage', 'notes'],
    search: ['callSign', 'plate', 'station', 'crew'],
    filters: ['status', 'vehicleType'],
    sort: { callSign: 1 },
    populate: [{ path: 'driverId', select: 'name' }],
});

module.exports = { invoices, blood, maintenance, incidents, ambulances };
