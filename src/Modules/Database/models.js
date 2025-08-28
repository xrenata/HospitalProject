const mongoose = require('mongoose');

// Patient Schema
const patientSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    tcNumber: { 
        type: String, 
        required: true, 
        unique: true,
        validate: {
            validator: function(v) {
                // TC kimlik numarası 11 haneli olmalı ve sadece rakam içermeli
                return /^\d{11}$/.test(v);
            },
            message: 'TC kimlik numarası 11 haneli olmalıdır'
        }
    },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    emergencyContactName: String,
    emergencyContactPhone: String,
    bloodType: String,
    allergies: String,
    medicalHistory: String,
    insuranceInfo: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Add virtual fields
patientSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

patientSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

// Staff Schema
const staffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }, // For compatibility
    email: { type: String, required: true, unique: true },
    phone: String,
    specialization: String,
    hire_date: { type: Date, default: Date.now },
    hireDate: { type: Date, default: Date.now }, // For compatibility
    salary: Number,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    username: String,
    password: String,
    permLevel: { type: Number, default: 1 }, // 1=Nurse, 2=Doctor, 3=Admin
    permissionLevel: { type: Number, default: 1 }, // For compatibility with frontend
    
    // Admin-specific fields
    isSystemAdmin: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canAccessAllDepartments: { type: Boolean, default: false },
    lastLogin: Date,
    
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Add virtual field for staff_id
staffSchema.virtual('staff_id').get(function() {
    return this._id.toString();
});

// Department Schema
const departmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    head_staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    budget: Number,
    location: String,
    phone: String,
    email: String,
    capacity: Number,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Add virtual field for department_id
departmentSchema.virtual('department_id').get(function() {
    return this._id.toString();
});

// Room Schema
const roomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true, unique: true },
    roomType: { 
        type: String, 
        enum: ['general', 'private', 'icu', 'operation', 'emergency'],
        required: true 
    },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    capacity: { type: Number, required: true },
    currentOccupancy: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['available', 'occupied', 'maintenance', 'reserved'],
        default: 'available' 
    },
    equipment: String,
    notes: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Add virtual fields
roomSchema.virtual('isOccupied').get(function() {
    return this.currentOccupancy >= this.capacity;
});

roomSchema.virtual('availableSpots').get(function() {
    return this.capacity - this.currentOccupancy;
});

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    reason: String,
    status: { 
        type: String, 
        enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled' 
    },
    notes: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Treatment Schema
const treatmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    treatmentType: String,
    diagnosis: String,
    description: { type: String, required: true },
    medication: String,
    startDate: { type: Date, required: true },
    endDate: Date,
    status: { 
        type: String, 
        enum: ['ongoing', 'completed', 'cancelled'],
        default: 'ongoing' 
    },
    cost: Number,
    notes: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Equipment Schema
const equipmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    manufacturer: { type: String, required: true },
    model: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    warrantyExpiry: Date,
    maintenanceSchedule: String,
    status: { 
        type: String, 
        enum: ['operational', 'maintenance', 'out-of-order', 'retired'],
        default: 'operational' 
    },
    cost: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Medication Schema
const medicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    dosage: { type: String, required: true },
    manufacturer: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    stockQuantity: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    sideEffects: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Test Schema
const testSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    testType: { type: String, required: true },
    test_type: { type: String, required: true },
    testName: { type: String, required: true },
    test_name: { type: String, required: true },
    testDate: { type: Date, required: true },
    test_date: { type: Date, required: true },
    testTime: { type: String, required: true },
    test_time: { type: String, required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    results: String,
    resultValue: String,
    result_value: String,
    normalRange: String,
    normal_range: String,
    unit: String,
    priority: { 
        type: String, 
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal' 
    },
    status: { 
        type: String, 
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending' 
    },
    cost: Number,
    notes: String,
    instructions: String,
    sampleType: String,
    sample_type: String,
    createdAt: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Update timestamps before save
const updateTimestamp = function(next) {
    this.updated_at = Date.now();
    next();
};

// Configure JSON output to include virtuals
staffSchema.set('toJSON', { virtuals: true });
departmentSchema.set('toJSON', { virtuals: true });

patientSchema.pre('save', updateTimestamp);
staffSchema.pre('save', updateTimestamp);
departmentSchema.pre('save', updateTimestamp);
roomSchema.pre('save', updateTimestamp);
appointmentSchema.pre('save', updateTimestamp);
treatmentSchema.pre('save', updateTimestamp);
equipmentSchema.pre('save', updateTimestamp);
medicationSchema.pre('save', updateTimestamp);
testSchema.pre('save', updateTimestamp);

// Create and export models
const Patient = mongoose.model('Patient', patientSchema);
const Staff = mongoose.model('Staff', staffSchema);
const Department = mongoose.model('Department', departmentSchema);
const Room = mongoose.model('Room', roomSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const Treatment = mongoose.model('Treatment', treatmentSchema);
const Equipment = mongoose.model('Equipment', equipmentSchema);
const Medication = mongoose.model('Medication', medicationSchema);
const Test = mongoose.model('Test', testSchema);

// Notification Schema
const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['critical', 'warning', 'info', 'success'], 
        required: true 
    },
    priority: { 
        type: String, 
        enum: ['high', 'medium', 'low'], 
        default: 'medium' 
    },
    category: { 
        type: String, 
        enum: ['system', 'appointment', 'patient', 'staff', 'inventory', 'security'], 
        required: true 
    },
    isRead: { type: Boolean, default: false },
    
    // Target user(s)
    targetUsers: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Staff' 
    }],
    targetRoles: [{ 
        type: String, 
        enum: ['Admin', 'Doktor', 'Hemşire', 'Sekreter', 'Teknisyen'] 
    }],
    targetDepartments: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Department' 
    }],
    
    // Sender information
    sender: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
        name: String,
        role: String,
        system: { type: Boolean, default: false }
    },
    
    // Additional data
    data: mongoose.Schema.Types.Mixed,
    actionUrl: String,
    expiresAt: Date,
    
    // Read tracking
    readBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
        readAt: { type: Date, default: Date.now }
    }],
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Indexes for better performance
notificationSchema.index({ 'targetUsers': 1, 'isRead': 1, 'createdAt': -1 });
notificationSchema.index({ 'targetRoles': 1, 'isRead': 1, 'createdAt': -1 });
notificationSchema.index({ 'category': 1, 'type': 1 });
notificationSchema.index({ 'expiresAt': 1 }, { expireAfterSeconds: 0 });

// Virtual to check if notification is expired
notificationSchema.virtual('isExpired').get(function() {
    return this.expiresAt && new Date() > this.expiresAt;
});

// Method to mark as read by a user
notificationSchema.methods.markAsRead = function(userId) {
    if (!this.readBy.find(read => read.userId.toString() === userId.toString())) {
        this.readBy.push({ userId, readAt: new Date() });
        
        // Check if all target users have read it
        if (this.targetUsers.length > 0) {
            const allRead = this.targetUsers.every(targetUserId => 
                this.readBy.some(read => read.userId.toString() === targetUserId.toString())
            );
            if (allRead) {
                this.isRead = true;
            }
        } else {
            this.isRead = true;
        }
    }
    return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);

// Surgery Schema
const surgerySchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    surgeonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    surgeon_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
    surgeryType: { type: String, required: true },
    surgery_type: { type: String, required: true },
    surgeryName: { type: String, required: true },
    surgery_name: { type: String, required: true },
    surgeryDate: { type: Date, required: true },
    surgery_date: { type: Date, required: true },
    startTime: { type: String, required: true },
    start_time: { type: String, required: true },
    endTime: String,
    end_time: String,
    duration: Number, // in minutes
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }],
    anesthesiaType: String,
    anesthesia_type: String,
    complications: String,
    outcome: String,
    notes: String,
    status: { 
        type: String, 
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'],
        default: 'scheduled' 
    },
    priority: { 
        type: String, 
        enum: ['low', 'normal', 'high', 'emergency'],
        default: 'normal' 
    },
    cost: Number,
    createdAt: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Visit Schema
const visitSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    visitDate: { type: Date, required: true },
    visit_date: { type: Date, required: true },
    visitTime: { type: String, required: true },
    visit_time: { type: String, required: true },
    visitType: { 
        type: String, 
        enum: ['consultation', 'follow_up', 'emergency', 'routine_check'],
        required: true 
    },
    visit_type: { 
        type: String, 
        enum: ['consultation', 'follow_up', 'emergency', 'routine_check'],
        required: true 
    },
    reason: String,
    diagnosis: String,
    treatment: String,
    prescriptions: String,
    nextVisit: Date,
    next_visit: Date,
    status: { 
        type: String, 
        enum: ['scheduled', 'completed', 'cancelled', 'no_show'],
        default: 'scheduled' 
    },
    notes: String,
    cost: Number,
    createdAt: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Prescription Schema
const prescriptionSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    medicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication' },
    medication_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication' },
    medicationName: { type: String, required: true },
    medication_name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    quantity: { type: Number, required: true },
    instructions: String,
    prescriptionDate: { type: Date, required: true },
    prescription_date: { type: Date, required: true },
    startDate: { type: Date, required: true },
    start_date: { type: Date, required: true },
    endDate: Date,
    end_date: Date,
    status: { 
        type: String, 
        enum: ['active', 'completed', 'cancelled', 'expired'],
        default: 'active' 
    },
    notes: String,
    createdAt: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Complaint Schema
const complaintSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    complaintType: { 
        type: String, 
        enum: ['medical', 'service', 'administrative', 'facility', 'billing', 'other'],
        required: true 
    },
    complaint_type: { 
        type: String, 
        enum: ['medical', 'service', 'administrative', 'facility', 'billing', 'other'],
        required: true 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium' 
    },
    status: { 
        type: String, 
        enum: ['pending', 'in_review', 'resolved', 'closed'],
        default: 'pending' 
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    resolution: String,
    resolvedAt: Date,
    resolved_at: Date,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    createdAt: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Pre-save middleware to update timestamps
surgerySchema.pre('save', updateTimestamp);
visitSchema.pre('save', updateTimestamp);
prescriptionSchema.pre('save', updateTimestamp);
complaintSchema.pre('save', updateTimestamp);

const Surgery = mongoose.model('Surgery', surgerySchema);
const Visit = mongoose.model('Visit', visitSchema);
const Prescription = mongoose.model('Prescription', prescriptionSchema);
const Complaint = mongoose.model('Complaint', complaintSchema);

// Hospital Schema
const hospitalSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    capacity: { type: Number, required: true },
    address: { type: String, required: true },
    ambulanceCount: { type: Number, default: 0 },
    ambulance_count: { type: Number, default: 0 },
    equipment: String,
    phone: String,
    email: String,
    website: String,
    establishedDate: Date,
    established_date: Date,
    licenseNumber: String,
    license_number: String,
    status: { 
        type: String, 
        enum: ['active', 'inactive', 'under_maintenance'],
        default: 'active' 
    },
    createdAt: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Insurance Schema
const insuranceSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    insuranceCompany: { type: String, required: true },
    insurance_company: { type: String, required: true },
    policyNumber: { type: String, required: true, unique: true },
    policy_number: { type: String, required: true, unique: true },
    coverageType: { 
        type: String, 
        enum: ['basic', 'premium', 'comprehensive'],
        required: true 
    },
    coverage_type: { 
        type: String, 
        enum: ['basic', 'premium', 'comprehensive'],
        required: true 
    },
    coverageAmount: { type: Number, required: true },
    coverage_amount: { type: Number, required: true },
    deductible: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    start_date: { type: Date, required: true },
    endDate: { type: Date, required: true },
    end_date: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ['active', 'expired', 'cancelled', 'suspended'],
        default: 'active' 
    },
    notes: String,
    createdAt: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Shift Schema
const shiftSchema = new mongoose.Schema({
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    shiftType: { 
        type: String, 
        enum: ['morning', 'afternoon', 'night', 'full_day'],
        required: true 
    },
    shift_type: { 
        type: String, 
        enum: ['morning', 'afternoon', 'night', 'full_day'],
        required: true 
    },
    shiftDate: { type: Date, required: true },
    shift_date: { type: Date, required: true },
    startTime: { type: String, required: true },
    start_time: { type: String, required: true },
    endTime: { type: String, required: true },
    end_time: { type: String, required: true },
    actualStartTime: String,
    actual_start_time: String,
    actualEndTime: String,
    actual_end_time: String,
    status: { 
        type: String, 
        enum: ['scheduled', 'active', 'completed', 'cancelled', 'no_show'],
        default: 'scheduled' 
    },
    notes: String,
    createdAt: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    feedbackType: { 
        type: String, 
        enum: ['service', 'facility', 'staff', 'treatment', 'general'],
        required: true 
    },
    feedback_type: { 
        type: String, 
        enum: ['service', 'facility', 'staff', 'treatment', 'general'],
        required: true 
    },
    rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        required: true 
    },
    title: { type: String, required: true },
    comment: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    is_anonymous: { type: Boolean, default: false },
    status: { 
        type: String, 
        enum: ['pending', 'reviewed', 'acknowledged'],
        default: 'pending' 
    },
    response: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    responded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    respondedAt: Date,
    responded_at: Date,
    createdAt: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

hospitalSchema.pre('save', updateTimestamp);
insuranceSchema.pre('save', updateTimestamp);
shiftSchema.pre('save', updateTimestamp);
feedbackSchema.pre('save', updateTimestamp);

const Hospital = mongoose.model('Hospital', hospitalSchema);
const Insurance = mongoose.model('Insurance', insuranceSchema);
const Shift = mongoose.model('Shift', shiftSchema);
const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = {
    Patient,
    Staff,
    Department,
    Room,
    Appointment,
    Treatment,
    Equipment,
    Medication,
    Test,
    Notification,
    Surgery,
    Visit,
    Prescription,
    Complaint,
    Hospital,
    Insurance,
    Shift,
    Feedback
};