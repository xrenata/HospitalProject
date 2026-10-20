const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const {
    Patient, Staff, Appointment, Visit, Treatment, Prescription, Test, Insurance, Vital,
} = require('../Modules/Database/models');
const { can } = require('../Modules/Functions/access');

/**
 * Everything you can add to, change in or remove from a patient's file, behind one consistent API:
 *
 *   POST   /api/patient-records/:patientId/:type            add a record
 *   POST   /api/patient-records/:patientId/lab-panel        add many lab results at once
 *   PATCH  /api/patient-records/:patientId/:type/:recordId  change status / result / notes
 *   DELETE /api/patient-records/:patientId/:type/:recordId  remove a record
 *
 * Each type follows the permission of what it is (appointments.create, tests.edit, ...). Several collections
 * store both camelCase and snake_case spellings, which `twins` keeps in step.
 */

const isId = (v) => mongoose.isValidObjectId(v);
const num = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? undefined : Number(v));
const str = (v) => (typeof v === 'string' ? v.trim() : v);
const twins = (doc) => {
    const out = { ...doc };
    for (const [key, value] of Object.entries(doc)) {
        const snake = key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
        if (snake !== key) out[snake] = value;
    }
    return out;
};
const bad = (message, field) => Object.assign(new Error(message), { status: 400, field });
const required = (value, field, label = field) => {
    if (value === undefined || value === null || value === '') throw bad(`${label} is required`, field);

    return value;
};
const when = (date, time) => {
    const d = new Date(`${date}T${time || '00:00'}:00`);
    if (Number.isNaN(d.getTime())) throw bad('Invalid date or time', 'date');

    return d;
};

/** Staff member responsible for the record: the one picked in the form, otherwise whoever is signed in. */
const staffFor = async (req, body) => {
    const id = body.staffId || req.access.id;
    if (!isId(id)) throw bad('Pick the responsible staff member', 'staffId');
    const staff = await Staff.findById(id).select('name department_id status').lean();
    if (!staff) throw bad('Staff member not found', 'staffId');

    return staff;
};

const TYPES = {
    appointments: {
        model: Appointment, resource: 'appointments',
        patch: ['status', 'notes', 'reason'],
        async build(req, body, patient) {
            const staff = await staffFor(req, body);
            const date = required(body.date, 'date', 'Date');
            const time = required(body.time, 'time', 'Time');
            when(date, time);

            const clash = await Appointment.exists({
                staffId: staff._id, appointmentTime: time, status: { $in: ['scheduled'] },
                appointmentDate: { $gte: new Date(`${date}T00:00:00`), $lt: new Date(`${date}T23:59:59.999`) },
            });
            if (clash) throw Object.assign(bad('This doctor already has an appointment at that time', 'time'), { status: 409 });

            return {
                patientId: patient._id, staffId: staff._id, departmentId: body.departmentId || staff.department_id,
                appointmentDate: new Date(`${date}T00:00:00`), appointmentTime: time, reason: str(required(body.reason, 'reason', 'Reason')),
                notes: str(body.notes), status: 'scheduled',
            };
        },
    },
    visits: {
        model: Visit, resource: 'visits',
        patch: ['status', 'notes', 'diagnosis', 'treatment'],
        async build(req, body, patient) {
            const staff = await staffFor(req, body);
            const date = required(body.date, 'date', 'Date');

            return twins({
                patientId: patient._id, staffId: staff._id, departmentId: body.departmentId || staff.department_id,
                visitDate: when(date, body.time || '09:00'), visitTime: body.time || '09:00',
                visitType: body.visitType || 'consultation', reason: str(required(body.reason, 'reason', 'Reason')),
                diagnosis: str(body.diagnosis), treatment: str(body.treatment), nextVisit: body.nextVisit ? new Date(body.nextVisit) : undefined,
                status: body.status || 'completed', notes: str(body.notes), cost: num(body.cost),
            });
        },
    },
    treatments: {
        model: Treatment, resource: 'treatments',
        patch: ['status', 'notes', 'endDate', 'medication'],
        async build(req, body, patient) {
            const staff = await staffFor(req, body);

            return {
                patientId: patient._id, staffId: staff._id, treatmentType: str(body.treatmentType), diagnosis: str(body.diagnosis),
                description: str(required(body.description, 'description', 'Description')), medication: str(body.medication),
                startDate: body.startDate ? new Date(body.startDate) : new Date(), endDate: body.endDate ? new Date(body.endDate) : undefined,
                status: body.status || 'ongoing', cost: num(body.cost), notes: str(body.notes),
            };
        },
    },
    prescriptions: {
        model: Prescription, resource: 'prescriptions',
        patch: ['status', 'notes', 'instructions'],
        async build(req, body, patient) {
            const staff = await staffFor(req, body);
            const start = body.startDate ? new Date(body.startDate) : new Date();

            return twins({
                patientId: patient._id, staffId: staff._id, medicationId: isId(body.medicationId) ? body.medicationId : undefined,
                medicationName: str(required(body.medicationName, 'medicationName', 'Medication')),
                dosage: str(required(body.dosage, 'dosage', 'Dosage')), frequency: str(required(body.frequency, 'frequency', 'Frequency')),
                duration: str(required(body.duration, 'duration', 'Duration')), quantity: num(body.quantity) ?? 1,
                instructions: str(body.instructions), prescriptionDate: new Date(), startDate: start,
                endDate: body.endDate ? new Date(body.endDate) : undefined, status: body.status || 'active', notes: str(body.notes),
            });
        },
    },
    tests: {
        model: Test, resource: 'tests',
        patch: ['status', 'notes', 'resultValue', 'normalRange', 'unit', 'results', 'priority'],
        twinPatch: true,
        async build(req, body, patient) {
            const staff = await staffFor(req, body);
            const date = body.testDate || new Date().toISOString().slice(0, 10);
            const hasResult = body.resultValue !== undefined && body.resultValue !== '';

            return twins({
                patientId: patient._id, staffId: staff._id, departmentId: body.departmentId || staff.department_id,
                testType: str(body.testType) || 'laboratory', testName: str(required(body.testName, 'testName', 'Test')),
                testDate: when(date, body.testTime || '09:00'), testTime: body.testTime || '09:00',
                priority: body.priority || 'normal', status: body.status || (hasResult ? 'completed' : 'pending'),
                resultValue: hasResult ? String(body.resultValue) : undefined, normalRange: str(body.normalRange), unit: str(body.unit),
                results: str(body.results), sampleType: str(body.sampleType), instructions: str(body.instructions), notes: str(body.notes),
                cost: num(body.cost),
            });
        },
    },
    insurance: {
        model: Insurance, resource: 'insurance',
        patch: ['status', 'notes', 'endDate'],
        async build(req, body, patient) {
            return twins({
                patientId: patient._id, insuranceCompany: str(required(body.insuranceCompany, 'insuranceCompany', 'Insurance company')),
                policyNumber: str(required(body.policyNumber, 'policyNumber', 'Policy number')), coverageType: body.coverageType || 'basic',
                coverageAmount: num(body.coverageAmount) ?? 0, deductible: num(body.deductible) ?? 0,
                startDate: new Date(required(body.startDate, 'startDate', 'Start date')), endDate: new Date(required(body.endDate, 'endDate', 'End date')),
                status: body.status || 'active', notes: str(body.notes),
            });
        },
    },
    vitals: {
        model: Vital, resource: 'visits',
        patch: ['notes'],
        async build(req, body, patient) {
            const staff = await staffFor(req, body);
            const doc = {
                patientId: patient._id, staffId: staff._id, recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
                systolic: num(body.systolic), diastolic: num(body.diastolic), heartRate: num(body.heartRate), temperature: num(body.temperature),
                spo2: num(body.spo2), respiratoryRate: num(body.respiratoryRate), weight: num(body.weight), height: num(body.height), notes: str(body.notes),
            };
            const filled = ['systolic', 'diastolic', 'heartRate', 'temperature', 'spo2', 'respiratoryRate', 'weight', 'height'].some((k) => doc[k] !== undefined);
            if (!filled) throw bad('Enter at least one measurement', 'systolic');
            if ((doc.systolic !== undefined) !== (doc.diastolic !== undefined)) throw bad('Blood pressure needs both numbers', 'systolic');

            return doc;
        },
    },
};

const send = (res, error) => {
    if (error?.status) return res.status(error.status).json({ error: error.message, field: error.field });
    if (error?.name === 'ValidationError') return res.status(400).json({ error: error.message });
    console.error('patient-records:', error);

    return res.status(500).json({ error: 'Something went wrong' });
};

const loadPatient = async (req, res, next) => {
    if (!isId(req.params.patientId)) return res.status(400).json({ error: 'Invalid patient' });
    const patient = await Patient.findById(req.params.patientId).select('_id').lean();
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    req.patient = patient;
    next();
};

const need = (action) => (req, res, next) => {
    const def = TYPES[req.params.type] || (req.params.type === 'lab-panel' ? TYPES.tests : null);
    if (!def) return res.status(404).json({ error: 'Unknown record type' });
    const key = `${def.resource}.${action}`;
    if (!can(req.access, key)) return res.status(403).json({ message: 'Insufficient permissions', required: key });
    req.def = def;
    next();
};

/** Times already booked for a doctor on a day (the appointment form greys them out). */
router.get('/availability', async (req, res) => {
    try {
        if (!can(req.access, 'appointments.view') && !can(req.access, 'appointments.create')) return res.status(403).json({ message: 'Insufficient permissions' });
        const { staffId, date } = req.query;
        if (!isId(staffId) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return res.status(400).json({ error: 'staffId and date are required' });
        const rows = await Appointment.find({
            staffId, status: 'scheduled',
            appointmentDate: { $gte: new Date(`${date}T00:00:00`), $lt: new Date(`${date}T23:59:59.999`) },
        }).select('appointmentTime').lean();
        res.json({ booked: rows.map((r) => r.appointmentTime) });
    } catch (error) {
        send(res, error);
    }
});

/** Many lab results from one blood draw. Rows without a value are ignored. */
router.post('/:patientId/lab-panel', loadPatient, (req, res, next) => { req.params.type = 'lab-panel'; next(); }, need('create'), async (req, res) => {
    try {
        const { results, testDate, testTime, sampleType = 'blood', priority = 'normal', notes, panel } = req.body;
        if (!Array.isArray(results) || results.length > 80) throw bad('Send between 1 and 80 results', 'results');
        const rows = results.filter((r) => r && r.testName && r.resultValue !== undefined && r.resultValue !== '' && !Number.isNaN(Number(r.resultValue)));
        if (!rows.length) throw bad('Enter at least one result', 'results');

        const staff = await staffFor(req, req.body);
        const at = when(testDate || new Date().toISOString().slice(0, 10), testTime || '08:00');
        const docs = rows.map((r) => twins({
            patientId: req.patient._id, staffId: staff._id, departmentId: staff.department_id, testType: 'blood', testName: str(r.testName),
            testDate: at, testTime: testTime || '08:00', priority, status: 'completed', resultValue: String(r.resultValue),
            normalRange: str(r.normalRange), unit: str(r.unit), sampleType, notes: str(notes), instructions: panel ? `Panel: ${panel}` : undefined,
        }));
        const saved = await Test.insertMany(docs);
        res.status(201).json({ created: saved.length });
    } catch (error) {
        send(res, error);
    }
});

router.post('/:patientId/:type', loadPatient, need('create'), async (req, res) => {
    try {
        const doc = await req.def.build(req, req.body || {}, req.patient);
        const saved = await req.def.model.create(doc);
        res.status(201).json(saved);
    } catch (error) {
        send(res, error);
    }
});

router.patch('/:patientId/:type/:recordId', loadPatient, need('edit'), async (req, res) => {
    try {
        if (!isId(req.params.recordId)) throw bad('Invalid record');
        const update = {};
        for (const key of req.def.patch) {
            if (req.body[key] !== undefined) update[key] = req.body[key];
        }
        if (req.def.twinPatch) Object.assign(update, twins(update));
        if (update.status === 'completed' && req.params.type === 'treatments' && !update.endDate) update.endDate = new Date();
        update.updatedAt = new Date();

        const saved = await req.def.model.findOneAndUpdate({ _id: req.params.recordId, patientId: req.patient._id }, update, { new: true, runValidators: true });
        if (!saved) return res.status(404).json({ error: 'Record not found' });
        res.json(saved);
    } catch (error) {
        send(res, error);
    }
});

router.delete('/:patientId/:type/:recordId', loadPatient, need('delete'), async (req, res) => {
    try {
        if (!isId(req.params.recordId)) throw bad('Invalid record');
        const removed = await req.def.model.findOneAndDelete({ _id: req.params.recordId, patientId: req.patient._id });
        if (!removed) return res.status(404).json({ error: 'Record not found' });
        res.json({ message: 'Removed' });
    } catch (error) {
        send(res, error);
    }
});

module.exports = router;
