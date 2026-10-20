const mongoose = require('mongoose');
require('./models'); // registers the hospital-scope plugin before these models compile

const { Schema } = mongoose;
const ref = (model, extra = {}) => ({ type: Schema.Types.ObjectId, ref: model, ...extra });
const stamp = { createdAt: { type: Date, default: Date.now }, updatedAt: { type: Date, default: Date.now } };

const invoiceSchema = new Schema({
    invoiceNumber: { type: String, index: true },
    patientId: ref('Patient', { required: true }),
    items: [{ description: String, quantity: { type: Number, default: 1 }, unitPrice: { type: Number, default: 0 }, _id: false }],
    subtotal: { type: Number, default: 0 },
    insuranceCovered: { type: Number, default: 0 },
    total: { type: Number, default: 0 }, // what the patient owes
    paid: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'issued', 'partial', 'paid', 'overdue', 'cancelled'], default: 'issued' },
    issueDate: { type: Date, default: Date.now },
    dueDate: Date,
    paymentMethod: { type: String, enum: ['cash', 'card', 'transfer', 'insurance', ''], default: '' },
    notes: String,
    ...stamp,
});

const bloodUnitSchema = new Schema({
    bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true },
    component: { type: String, enum: ['whole_blood', 'red_cells', 'plasma', 'platelets'], default: 'whole_blood' },
    units: { type: Number, default: 1, min: 0 },
    donorName: String,
    collectedDate: { type: Date, default: Date.now },
    expiryDate: Date,
    location: String,
    status: { type: String, enum: ['available', 'reserved', 'used', 'expired', 'discarded'], default: 'available' },
    notes: String,
    ...stamp,
});

const maintenanceSchema = new Schema({
    title: { type: String, required: true },
    description: String,
    equipmentId: ref('Equipment'),
    roomId: ref('Room'),
    location: String,
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    reportedBy: ref('Staff'),
    assignedTo: ref('Staff'),
    dueDate: Date,
    resolvedAt: Date,
    cost: { type: Number, default: 0 },
    notes: String,
    ...stamp,
});

const incidentSchema = new Schema({
    title: { type: String, required: true },
    incidentType: { type: String, enum: ['patient_safety', 'fall', 'medication_error', 'equipment', 'security', 'infection', 'other'], default: 'other' },
    severity: { type: String, enum: ['minor', 'moderate', 'major', 'critical'], default: 'minor' },
    description: String,
    location: String,
    occurredAt: { type: Date, default: Date.now },
    patientId: ref('Patient'),
    reportedBy: ref('Staff'),
    status: { type: String, enum: ['reported', 'investigating', 'resolved', 'closed'], default: 'reported' },
    actionsTaken: String,
    ...stamp,
});

const ambulanceSchema = new Schema({
    callSign: { type: String, required: true },
    plate: String,
    vehicleType: { type: String, enum: ['basic', 'advanced', 'neonatal', 'patient_transport'], default: 'basic' },
    status: { type: String, enum: ['available', 'on_call', 'maintenance', 'out_of_service'], default: 'available' },
    station: String,
    driverId: ref('Staff'),
    crew: String,
    lastService: Date,
    nextService: Date,
    mileage: { type: Number, default: 0 },
    notes: String,
    ...stamp,
});

[invoiceSchema, bloodUnitSchema, maintenanceSchema, incidentSchema, ambulanceSchema].forEach((s) => {
    s.pre('save', function touch(next) { this.updatedAt = new Date(); next(); });
});

module.exports = {
    Invoice: mongoose.model('Invoice', invoiceSchema),
    BloodUnit: mongoose.model('BloodUnit', bloodUnitSchema),
    MaintenanceRequest: mongoose.model('MaintenanceRequest', maintenanceSchema),
    Incident: mongoose.model('Incident', incidentSchema),
    Ambulance: mongoose.model('Ambulance', ambulanceSchema),
};
