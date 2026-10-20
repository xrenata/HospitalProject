// Adds demo rooms, patients, appointments and treatments so the dashboard charts have something to show.
// Non-destructive: everything it creates is tagged ("demo-seed") and can be removed with `--clean`.
//   npm run seed-demo            add demo data
//   npm run seed-demo -- --clean remove it again
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/Modules/Database/db');
const {
    Patient, Staff, Room, Appointment, Treatment, Medication, Equipment, Test, Surgery, Visit,
    Prescription, Complaint, Insurance, Shift, Feedback, Department, Notification, Hospital, Role, Vital
} = require('../src/Modules/Database/models');

const TAG = 'demo-seed';
const DAYS = 28; // two 14-day periods so the "vs previous period" delta has something to compare
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n, hour = 9) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(hour, rand(0, 59), 0, 0);
    return d;
};

const FIRST = ['Ayşe', 'Mehmet', 'Fatma', 'Ali', 'Zeynep', 'Mustafa', 'Elif', 'Ahmet', 'Selin', 'Burak', 'Derya', 'Emre', 'Gül', 'Kerem', 'Nur', 'Can'];
const LAST = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan'];
const REASONS = ['Check-up', 'Follow-up', 'Chest pain', 'Headache', 'Blood test', 'Vaccination', 'Skin rash', 'Back pain'];
const TREATMENTS = ['Physical therapy', 'Antibiotic course', 'Wound care', 'Cardiac monitoring', 'Imaging', 'Minor procedure'];

// Several collections require both camelCase and snake_case spellings of the same field.
const withTwins = (doc) => {
    const out = { ...doc };
    for (const [key, value] of Object.entries(doc)) {
        const snake = key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
        if (snake !== key) out[snake] = value;
    }
    return out;
};

async function clean() {
    const patients = await Patient.find({ email: /^demo\+.*@hospital\.local$/ }).select('_id');
    const ids = patients.map((p) => p._id);
    const byPatient = { patientId: { $in: ids } };
    await Promise.all([Appointment, Treatment, Test, Surgery, Visit, Prescription, Insurance, Vital].map((M) => M.deleteMany(byPatient)));
    const results = await Promise.all([
        Appointment.deleteMany({ notes: TAG }),
        Treatment.deleteMany({ notes: TAG }),
        Room.deleteMany({ notes: TAG }),
        Medication.deleteMany({ description: TAG }),
        Equipment.deleteMany({ description: TAG }),
        Test.deleteMany({ notes: TAG }),
        Surgery.deleteMany({ notes: TAG }),
        Visit.deleteMany({ notes: TAG }),
        Prescription.deleteMany({ notes: TAG }),
        Insurance.deleteMany({ notes: TAG }),
        Shift.deleteMany({ notes: TAG }),
        Complaint.deleteMany(byPatient),
        Feedback.deleteMany(byPatient),
        Staff.deleteMany({ email: /@demo-staff\.local$/ }),
        Department.deleteMany({ description: TAG }),
        Notification.deleteMany({ 'data.demo': true }),
        Hospital.deleteMany({ licenseNumber: TAG }),
        Patient.deleteMany({ _id: { $in: ids } }),
    ]);
    console.log('Removed demo data:', results.reduce((a, r) => a + r.deletedCount, 0), 'documents');
}

async function seed() {
    const staff = await Staff.findOne({ username: 'doctor' }) || await Staff.findOne();
    if (!staff) throw new Error('No staff found. Run `npm run create-users` first.');

    // Rooms
    const roomStatuses = ['occupied', 'occupied', 'occupied', 'occupied', 'occupied', 'available', 'available', 'available', 'available', 'maintenance', 'reserved', 'occupied'];
    const types = ['general', 'private', 'icu', 'operation', 'emergency'];
    for (let i = 0; i < roomStatuses.length; i++) {
        const roomNumber = `D-${100 + i}`;
        if (await Room.exists({ roomNumber })) continue;
        const status = roomStatuses[i];
        await Room.create({
            roomNumber,
            roomType: types[i % types.length],
            capacity: 2,
            currentOccupancy: status === 'occupied' ? 2 : 0,
            status,
            notes: TAG,
        });
    }

    // Patients: 0-4 new per day, a bit busier in the recent half so the trend is positive
    const patients = [];
    let counter = 0;
    for (let d = DAYS - 1; d >= 0; d--) {
        const perDay = d < DAYS / 2 ? rand(1, 5) : rand(0, 3);
        for (let k = 0; k < perDay; k++) {
            counter++;
            const first = pick(FIRST);
            const last = pick(LAST);
            patients.push({
                firstName: first,
                lastName: last,
                tcNumber: String(99000000000 + Date.now() % 1000000 * 100 + counter).slice(0, 11),
                dateOfBirth: new Date(1950 + rand(0, 55), rand(0, 11), rand(1, 28)),
                gender: pick(['Male', 'Female']),
                phone: `555${rand(1000000, 9999999)}`,
                email: `demo+${counter}@hospital.local`,
                address: 'Demo Mah. Örnek Sk. No:' + rand(1, 99),
                bloodType: pick(['A+', 'A+', 'A-', 'B+', 'B-', 'AB+', 'O+', 'O+', 'O-']),
                allergies: Math.random() < 0.3 ? pick(['Penicillin', 'Peanuts', 'Latex', 'Pollen, dust mites', 'Sulfa drugs']) : undefined,
                medicalHistory: Math.random() < 0.55 ? pick(['Hypertension (2018)', 'Type 2 diabetes', 'Asthma since childhood', 'Appendectomy (2011)', 'Hypothyroidism, on levothyroxine']) : undefined,
                insuranceInfo: Math.random() < 0.8 ? pick(['Allianz', 'Axa', 'Anadolu Sigorta', 'Mapfre']) : undefined,
                emergencyContactName: `${pick(FIRST)} ${last}`,
                emergencyContactPhone: `555${rand(1000000, 9999999)}`,
                createdAt: daysAgo(d, rand(8, 17)),
            });
        }
    }
    const createdPatients = await Patient.insertMany(patients);
    let cycle = 0;
    const nextPatient = () => createdPatients[cycle++ % createdPatients.length]._id;

    // Appointments: spread over the period, a few upcoming ones
    const appointments = [];
    for (let d = DAYS - 1; d >= -3; d--) {
        const perDay = d >= DAYS / 2 ? rand(2, 6) : rand(4, 10);
        for (let k = 0; k < perDay; k++) {
            const when = daysAgo(d, rand(8, 16));
            const past = d > 0;
            const roll = Math.random();
            appointments.push({
                patientId: nextPatient(),
                staffId: staff._id,
                appointmentDate: when,
                appointmentTime: `${String(when.getHours()).padStart(2, '0')}:${pick(['00', '15', '30', '45'])}`,
                reason: pick(REASONS),
                status: !past ? 'scheduled' : roll < 0.72 ? 'completed' : roll < 0.86 ? 'cancelled' : roll < 0.93 ? 'no-show' : 'scheduled',
                notes: TAG,
            });
        }
    }
    await Appointment.insertMany(appointments);

    // Treatments (revenue)
    const treatments = [];
    for (let d = DAYS - 1; d >= 0; d--) {
        const perDay = d < DAYS / 2 ? rand(2, 6) : rand(1, 4);
        for (let k = 0; k < perDay; k++) {
            treatments.push({
                patientId: nextPatient(),
                staffId: staff._id,
                treatmentType: pick(TREATMENTS),
                description: pick(TREATMENTS),
                startDate: daysAgo(d, rand(8, 17)),
                status: Math.random() < 0.3 ? 'ongoing' : 'completed',
                cost: rand(4, 60) * 100,
                notes: TAG,
            });
        }
    }
    await Treatment.insertMany(treatments);

    // ---- other collections (so every list page has something to show) -----------------
    const doctor = staff._id;
    const patientId = nextPatient;
    const spreadDay = (max = DAYS) => daysAgo(rand(0, max - 1), rand(8, 17));

    await Medication.insertMany([
        ['Paracetamol', '500 mg', 'Pharma A', 'analgesic', 340, 12], ['Ibuprofen', '400 mg', 'Pharma A', 'analgesic', 120, 18],
        ['Amoxicillin', '875 mg', 'MedLab', 'antibiotic', 60, 42], ['Azithromycin', '500 mg', 'MedLab', 'antibiotic', 25, 55],
        ['Metformin', '850 mg', 'Pharma B', 'diabetes', 210, 30], ['Atorvastatin', '20 mg', 'Pharma B', 'cardiovascular', 95, 65],
        ['Omeprazole', '20 mg', 'GastroCare', 'gastro', 18, 28], ['Salbutamol', '100 mcg', 'RespiraCo', 'respiratory', 70, 48],
        ['Insulin glargine', '100 U/ml', 'DiabCare', 'diabetes', 12, 210], ['Loratadine', '10 mg', 'AllergyX', 'antihistamine', 150, 22],
    ].map(([name, dosage, manufacturer, category, stockQuantity, price], i) => ({
        name, dosage, manufacturer, category, stockQuantity, price,
        expiryDate: new Date(Date.now() + (60 + i * 45) * 86400000), description: TAG,
    })));

    await Equipment.insertMany([
        ['MRI Scanner', 'Siemens', 'Magnetom', 'operational'], ['CT Scanner', 'GE', 'Revolution', 'operational'],
        ['Ventilator V1', 'Dräger', 'Evita', 'operational'], ['Ventilator V2', 'Dräger', 'Evita', 'maintenance'],
        ['Ultrasound U3', 'Philips', 'EPIQ', 'operational'], ['X-Ray Unit', 'Fuji', 'FDR', 'out-of-order'],
        ['Defibrillator D1', 'Zoll', 'R Series', 'operational'], ['Infusion Pump P7', 'B. Braun', 'Infusomat', 'operational'],
        ['ECG Monitor E2', 'Philips', 'PageWriter', 'retired'], ['Surgical Light L1', 'Stryker', 'Visum', 'operational'],
    ].map(([name, manufacturer, model, status], i) => ({
        name, manufacturer, model, status, cost: 8000 + i * 4500,
        purchaseDate: new Date(Date.now() - (200 + i * 120) * 86400000), description: TAG,
    })));

    await Complaint.insertMany(Array.from({ length: 18 }, () => withTwins({
        patientId: patientId(), title: pick(['Long waiting time', 'Billing mistake', 'Noisy ward', 'Rude reception', 'Unclear discharge info']),
        description: 'Demo complaint', complaintType: pick(['service', 'billing', 'facility', 'medical', 'administrative']),
        priority: pick(['low', 'medium', 'medium', 'high', 'urgent']), status: pick(['pending', 'in_review', 'resolved', 'resolved', 'closed']),
        createdAt: spreadDay(),
    })));

    await Feedback.insertMany(Array.from({ length: 22 }, () => withTwins({
        patientId: patientId(), title: pick(['Great care', 'Friendly staff', 'Clean rooms', 'Slow check-in', 'Helpful nurse']),
        comment: 'Demo feedback', rating: pick([5, 5, 5, 4, 4, 4, 3, 2, 1]),
        feedbackType: pick(['service', 'staff', 'facility', 'treatment', 'general']), status: pick(['pending', 'reviewed', 'acknowledged']),
        createdAt: spreadDay(),
    })));

    await Visit.insertMany(Array.from({ length: Math.max(120, createdPatients.length * 2) }, () => {
        const d = spreadDay();
        return withTwins({
            patientId: patientId(), staffId: doctor, visitDate: d, visitTime: '10:30', reason: pick(REASONS), notes: TAG,
            visitType: pick(['consultation', 'follow_up', 'routine_check', 'emergency']),
            status: pick(['completed', 'completed', 'completed', 'scheduled', 'cancelled']), createdAt: d,
        });
    }));

    await Prescription.insertMany(Array.from({ length: Math.max(120, createdPatients.length * 2) }, () => {
        const d = spreadDay();
        return withTwins({
            patientId: patientId(), staffId: doctor, medicationName: pick(['Paracetamol', 'Amoxicillin', 'Metformin', 'Omeprazole']),
            dosage: '1 tablet', frequency: 'twice daily', duration: '7 days', quantity: 14, notes: TAG,
            prescriptionDate: d, startDate: d, status: pick(['active', 'active', 'active', 'completed', 'completed', 'cancelled']), createdAt: d,
        });
    }));

    const testNames = ['Complete blood count', 'Lipid panel', 'Chest X-ray', 'ECG', 'Urinalysis', 'Glucose tolerance'];
    await Test.insertMany(Array.from({ length: Math.max(80, createdPatients.length) }, () => {
        const d = spreadDay();
        return withTwins({
            patientId: patientId(), staffId: doctor, testType: 'laboratory', testName: pick(testNames), testDate: d, testTime: '09:15',
            priority: pick(['low', 'normal', 'normal', 'high', 'urgent']),
            status: pick(['pending', 'in_progress', 'completed', 'completed', 'cancelled']), notes: TAG, createdAt: d,
        });
    }));

    // ---- blood panels: one Test document per analyte, three draws per patient ------------
    const ANALYTES = [
        ['Hemoglobin', 'g/dL', 12, 16, 1], ['White blood cells', '10³/µL', 4, 11, 1], ['Platelets', '10³/µL', 150, 450, 0],
        ['Glucose (fasting)', 'mg/dL', 70, 100, 0], ['Total cholesterol', 'mg/dL', 125, 200, 0], ['Creatinine', 'mg/dL', 0.6, 1.3, 2],
        ['ALT', 'U/L', 7, 56, 0], ['TSH', 'µIU/mL', 0.4, 4, 2],
    ];
    const labs = [];
    for (const patient of createdPatients) {
        const base = {};
        for (const [name, , lo, hi] of ANALYTES) base[name] = lo + (hi - lo) * (0.25 + Math.random() * 0.5); // starts in range
        [75, 38, rand(1, 6)].forEach((ago, drawIndex) => {
            const d = daysAgo(ago, 8);
            for (const [name, unit, lo, hi, decimals] of ANALYTES) {
                // a slow drift plus the occasional value outside the reference range
                base[name] += (hi - lo) * (Math.random() - 0.45) * 0.12;
                if (drawIndex === 2 && Math.random() < 0.3) base[name] = Math.random() < 0.5 ? lo * (0.72 + Math.random() * 0.2) : hi * (1.08 + Math.random() * 0.15);
                labs.push(withTwins({
                    patientId: patient._id, staffId: doctor, testType: 'blood', testName: name, testDate: d, testTime: '08:10',
                    resultValue: Math.max(base[name], 0).toFixed(decimals), normalRange: `${lo} - ${hi}`, unit, sampleType: 'blood',
                    priority: 'normal', status: 'completed', notes: TAG, createdAt: d,
                }));
            }
        });
    }
    await Test.insertMany(labs);

    // ---- vital signs: six readings over the last months per patient --------------------------------------------
    const vitals = [];
    for (const patient of createdPatients) {
        let sys = rand(108, 135), dia = rand(68, 86), hr = rand(62, 92), weight = rand(52, 96);
        const height = rand(155, 190);
        [150, 110, 70, 40, 14, rand(0, 3)].forEach((ago) => {
            sys += rand(-6, 7); dia += rand(-4, 5); hr += rand(-5, 6); weight += (Math.random() - 0.5) * 1.2;
            vitals.push({
                patientId: patient._id, staffId: doctor, recordedAt: daysAgo(ago, rand(8, 16)),
                systolic: sys, diastolic: dia, heartRate: hr, temperature: Math.round((36.4 + Math.random() * 0.9) * 10) / 10,
                spo2: rand(94, 99), respiratoryRate: rand(13, 19), weight: Math.round(weight * 10) / 10, height,
            });
        });
    }
    await Vital.insertMany(vitals);

    await Surgery.insertMany(Array.from({ length: 14 }, () => {
        const d = spreadDay();
        return withTwins({
            patientId: patientId(), surgeonId: doctor, surgeryType: pick(['orthopedic', 'general', 'cardiac']),
            surgeryName: pick(['Appendectomy', 'Knee arthroscopy', 'Hernia repair', 'Bypass']), surgeryDate: d, startTime: '08:30', notes: TAG,
            status: pick(['scheduled', 'completed', 'completed', 'in_progress', 'postponed']),
            priority: pick(['low', 'normal', 'normal', 'high', 'emergency']), createdAt: d,
        });
    }));

    const allStaff = await Staff.find().select('_id');
    await Shift.insertMany(Array.from({ length: 30 }, () => {
        const d = spreadDay();
        return withTwins({
            staffId: pick(allStaff)._id, shiftDate: d, startTime: '08:00', endTime: '16:00', notes: TAG,
            shiftType: pick(['morning', 'afternoon', 'night', 'full_day']),
            status: pick(['completed', 'completed', 'scheduled', 'active', 'cancelled']), createdAt: d,
        });
    }));

    await Insurance.insertMany(createdPatients.filter((_, i) => i % 5 !== 4).map((_, i) => withTwins({
        patientId: createdPatients.filter((__, j) => j % 5 !== 4)[i]._id, insuranceCompany: pick(['Allianz', 'Axa', 'Anadolu Sigorta', 'Mapfre']), policyNumber: `DEMO-${1000 + i}`,
        coverageType: pick(['basic', 'premium', 'comprehensive']), coverageAmount: rand(20, 200) * 1000,
        startDate: new Date(Date.now() - 200 * 86400000), endDate: new Date(Date.now() + rand(-30, 300) * 86400000), notes: TAG,
        status: pick(['active', 'active', 'active', 'expired', 'cancelled', 'suspended']), createdAt: spreadDay(),
    })));

    // ---- departments, alerts and hospital info ------------------------------------------
    const deptNames = ['Cardiology', 'Emergency', 'Pediatrics', 'Orthopedics', 'Radiology', 'Internal Medicine'];
    const departments = await Department.insertMany(deptNames.map((name, i) => ({
        name, description: TAG, location: `Block ${'ABC'[i % 3]}, floor ${1 + (i % 4)}`, capacity: 20 + i * 6,
        budget: 150000 + i * 40000, status: i === 5 ? 'inactive' : 'active', phone: `0212 555 01${i}0`, email: `${name.toLowerCase().replace(/ /g, '')}@hospital.local`,
    })));
    await Staff.updateMany({ username: 'doctor' }, { department_id: departments[0]._id, departmentId: departments[0]._id });

    await Notification.insertMany([
        ['critical', 'high', 'system', 'Generator test failed', 'Backup generator B did not start during the weekly test.'],
        ['critical', 'high', 'patient', 'Patient fall reported', 'A fall was reported in ward 3, doctor on call has been notified.'],
        ['warning', 'medium', 'inventory', 'Low stock: Insulin glargine', 'Only 12 units remain in the pharmacy.'],
        ['warning', 'medium', 'inventory', 'Low stock: Omeprazole', 'Stock dropped below the reorder level.'],
        ['warning', 'low', 'staff', 'Shift gap tomorrow', 'The night shift has one open position.'],
        ['info', 'low', 'appointment', 'Schedule updated', 'Dr. Smith moved three appointments to the afternoon.'],
        ['info', 'low', 'system', 'Maintenance window', 'The records system will be read-only on Sunday 02:00-03:00.'],
        ['success', 'low', 'system', 'Backup completed', 'Nightly backup finished without errors.'],
    ].map(([type, priority, category, title, message], i) => ({
        type, priority, category, title, message, data: { demo: true }, isRead: i > 4, createdAt: daysAgo(i % 5, 9 + i),
    })));

    // ---- a hospital-sized workforce (480 people) to see how the staff screens cope ---------------------------------
    const roleKeys = await Role.find().select('key').lean();
    const roleId = Object.fromEntries(roleKeys.map((r) => [r.key, r._id]));
    const JOBS = [
        ['Doctor', 'doctor', 22], ['Nurse', 'nurse', 55], ['Receptionist', 'receptionist', 8], ['Lab technician', 'lab_technician', 7],
        ['Pharmacist', 'pharmacist', 5], ['Billing clerk', 'billing', 3], ['Cleaner', 'nurse', 0], ['Technician', 'nurse', 0],
    ];
    const SPECS = ['Cardiology', 'Pediatrics', 'Orthopedics', 'Radiology', 'Emergency medicine', 'Internal medicine', 'Neurology', 'Oncology'];
    const deptDocs = await Department.find().select('_id').lean();
    const crowd = [];
    const weighted = JOBS.flatMap(([title, key, weight]) => Array(Math.max(weight, 1)).fill([title, key]));
    for (let i = 0; i < 480; i++) {
        const [title, key] = pick(weighted);
        const first = pick(FIRST);
        const last = pick(LAST);
        const withLogin = ['doctor', 'receptionist', 'billing', 'lab_technician', 'pharmacist'].includes(key) || Math.random() < 0.6;
        crowd.push({
            name: `${first} ${last}`,
            role: title,
            department_id: deptDocs.length ? pick(deptDocs)._id : undefined,
            email: `${first}.${last}.${i}@demo-staff.local`.toLowerCase().replace(/[^a-z0-9.@-]/g, (c) => ({ 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'İ': 'i', 'Ç': 'c', 'Ğ': 'g', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' }[c] || '')),
            phone: `555${rand(1000000, 9999999)}`,
            specialization: key === 'doctor' ? pick(SPECS) : undefined,
            hire_date: new Date(Date.now() - rand(30, 3000) * 86400000),
            salary: rand(30, 180) * 1000,
            status: Math.random() < 0.93 ? 'active' : 'inactive',
            roleId: roleId[key],
            permLevel: key === 'doctor' ? 2 : 1,
            lastLogin: withLogin && Math.random() < 0.85 ? new Date(Date.now() - rand(0, 40) * 86400000) : undefined,
            created_at: new Date(Date.now() - rand(10, 900) * 86400000),
        });
    }
    await Staff.insertMany(crowd);

    if (!(await Hospital.exists({}))) {
        await Hospital.create({
            name: 'Demo City Hospital', type: 'general', capacity: 320, address: '12 Example Street, Istanbul', status: 'active',
            phone: '0212 555 0100', email: 'info@hospital.local', website: 'https://hospital.local', licenseNumber: TAG,
        });
    }

    console.log(`Added ${createdPatients.length} patients, ${appointments.length} appointments, ${treatments.length} treatments, rooms and demo data for the other pages.`);
}

(async () => {
    try {
        await connectDB();
        if (process.argv.includes('--clean')) await clean();
        else await seed();
    } catch (error) {
        console.error(error.message || error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
})();
