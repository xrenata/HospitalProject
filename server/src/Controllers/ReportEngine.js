const {
    Patient, Staff, Department, Room, Appointment, Treatment, Visit, Test, Prescription, Medication, Equipment,
    Complaint, Feedback, Insurance, Vital,
} = require('../Modules/Database/models');

/**
 * Report engine. Every template returns the same shape so one viewer can show any of them:
 *   { meta, kpis: [{ key, label, value, format }], sections: [{ key, title, type, data | columns+rows }] }
 * section types: "line" (daily series), "bar" (ranked list), "donut" (parts of a whole), "table".
 */

const TEXT = {
    en: {
        period: 'Period', patients_new: 'New patients', patients_total: 'Patients in total', insured: 'With insurance', avg_age: 'Average age',
        by_day_new: 'New patients per day', gender: 'By gender', blood: 'By blood type', age_groups: 'By age group', unknown: 'Not recorded',
        male: 'Male', female: 'Female', other: 'Other',
        appts: 'Appointments', completed: 'Completed', completion_rate: 'Completion rate', no_show_rate: 'No-show rate', cancelled: 'Cancelled',
        by_day_appts: 'Appointments per day', by_status: 'By status', by_doctor: 'Busiest doctors', by_hour: 'Busiest hours', by_dept: 'By department',
        revenue: 'Revenue', avg_treatment: 'Average treatment', treatments: 'Treatments', visits_cost: 'Visit charges', coverage: 'Insurance coverage on file',
        revenue_day: 'Revenue per day', revenue_type: 'Revenue by treatment type', top_treatments: 'Most profitable treatments',
        staff_total: 'Staff', staff_active: 'Active', staff_inactive: 'Inactive', staff_accounts: 'With sign-in', staff_by_role: 'By job title',
        staff_by_dept: 'By department', staff_workload: 'Appointments per doctor', hires: 'Hires per month', no_dept: 'No department',
        stock_value: 'Stock value', meds: 'Medications', low_stock: 'Low stock', expiring: 'Expiring in 90 days', equipment: 'Equipment', equip_attention: 'Needing attention',
        stock_by_cat: 'Stock value by category', low_stock_list: 'Running low', expiring_list: 'Expiring soon', equip_status: 'Equipment status',
        name: 'Name', quantity: 'Quantity', category: 'Category', expires: 'Expires', price: 'Price', dept: 'Department', rooms: 'Rooms', capacity: 'Capacity',
        dept_overview: 'Department overview', staff: 'Staff', complaints: 'Complaints', resolved: 'Resolved', resolution_rate: 'Resolution rate', avg_days: 'Avg. days to resolve',
        avg_rating: 'Average rating', feedback_n: 'Feedback received', c_type: 'Complaints by type', c_priority: 'Complaints by priority', c_status: 'Complaints by status',
        ratings: 'Rating distribution', c_day: 'Complaints per day',
        tests: 'Tests', pending: 'Pending', abnormal: 'Abnormal results', rx: 'Prescriptions', tests_status: 'Tests by status', tests_kind: 'Tests by type',
        top_abnormal: 'Most often out of range', top_meds: 'Most prescribed medications', samples: 'Samples', out_rate: 'Out of range', vitals: 'Vital readings',
        hospital: 'Hospital', scheduled: 'Scheduled', in_progress: 'In progress', cancelled_s: 'Cancelled', rate: 'Rate',
        star: '{n} stars',
    },
    tr: {
        period: 'Dönem', patients_new: 'Yeni hasta', patients_total: 'Toplam hasta', insured: 'Sigortalı', avg_age: 'Ortalama yaş',
        by_day_new: 'Günlük yeni hasta', gender: 'Cinsiyete göre', blood: 'Kan grubuna göre', age_groups: 'Yaş grubuna göre', unknown: 'Kayıtlı değil',
        male: 'Erkek', female: 'Kadın', other: 'Diğer',
        appts: 'Randevu', completed: 'Tamamlanan', completion_rate: 'Tamamlanma oranı', no_show_rate: 'Gelmeme oranı', cancelled: 'İptal',
        by_day_appts: 'Günlük randevu', by_status: 'Duruma göre', by_doctor: 'En yoğun hekimler', by_hour: 'En yoğun saatler', by_dept: 'Departmana göre',
        revenue: 'Gelir', avg_treatment: 'Ortalama tedavi', treatments: 'Tedavi', visits_cost: 'Ziyaret ücretleri', coverage: 'Kayıtlı sigorta teminatı',
        revenue_day: 'Günlük gelir', revenue_type: 'Tedavi türüne göre gelir', top_treatments: 'En kazandıran tedaviler',
        staff_total: 'Personel', staff_active: 'Aktif', staff_inactive: 'Pasif', staff_accounts: 'Giriş hesabı olan', staff_by_role: 'Unvana göre',
        staff_by_dept: 'Departmana göre', staff_workload: 'Hekim başına randevu', hires: 'Aylık işe alım', no_dept: 'Departmansız',
        stock_value: 'Stok değeri', meds: 'İlaç', low_stock: 'Düşük stok', expiring: '90 gün içinde bitecek', equipment: 'Ekipman', equip_attention: 'İlgi bekleyen',
        stock_by_cat: 'Kategoriye göre stok değeri', low_stock_list: 'Azalan stoklar', expiring_list: 'Süresi yaklaşanlar', equip_status: 'Ekipman durumu',
        name: 'Ad', quantity: 'Adet', category: 'Kategori', expires: 'Bitiş', price: 'Fiyat', dept: 'Departman', rooms: 'Oda', capacity: 'Kapasite',
        dept_overview: 'Departman özeti', staff: 'Personel', complaints: 'Şikayet', resolved: 'Çözülen', resolution_rate: 'Çözülme oranı', avg_days: 'Ort. çözüm süresi (gün)',
        avg_rating: 'Ortalama puan', feedback_n: 'Gelen geri bildirim', c_type: 'Türe göre şikayet', c_priority: 'Önceliğe göre şikayet', c_status: 'Duruma göre şikayet',
        ratings: 'Puan dağılımı', c_day: 'Günlük şikayet',
        tests: 'Test', pending: 'Bekleyen', abnormal: 'Referans dışı sonuç', rx: 'Reçete', tests_status: 'Duruma göre test', tests_kind: 'Türe göre test',
        top_abnormal: 'En sık referans dışı çıkanlar', top_meds: 'En çok yazılan ilaçlar', samples: 'Numune', out_rate: 'Referans dışı', vitals: 'Vital ölçüm',
        hospital: 'Hastane', scheduled: 'Planlı', in_progress: 'Devam eden', cancelled_s: 'İptal', rate: 'Oran',
        star: '{n} yıldız',
    },
};

const TEMPLATES = [
    { id: 'patients', icon: 'users', category: 'clinical', needs: 'patients.view' },
    { id: 'appointments', icon: 'calendar', category: 'clinical', needs: 'appointments.view' },
    { id: 'clinical', icon: 'flask', category: 'clinical', needs: 'tests.view' },
    { id: 'financial', icon: 'dollar', category: 'finance', needs: 'analytics.view' },
    { id: 'staff', icon: 'stethoscope', category: 'operations', needs: 'staff.view' },
    { id: 'departments', icon: 'building', category: 'operations', needs: 'departments.view' },
    { id: 'inventory', icon: 'package', category: 'operations', needs: 'medications.view' },
    { id: 'quality', icon: 'star', category: 'quality', needs: 'complaints.view' },
];

const day = (field) => ({ $dateToString: { format: '%Y-%m-%d', date: field } });
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const round = (n, d = 0) => Math.round(n * 10 ** d) / 10 ** d;

/** A daily series with every day in the period present (zero when nothing happened). */
const fillDays = (rows, from, to) => {
    const map = Object.fromEntries(rows.map((r) => [r._id, r.value]));
    const out = [];
    for (let d = new Date(from); d <= to && out.length < 400; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        out.push({ label: key, value: round(map[key] || 0, 2) });
    }

    return out;
};

const rank = (rows, limit = 10) => rows.filter((r) => r.value > 0).sort((a, b) => b.value - a.value).slice(0, limit);

const GENERATORS = {
    async patients({ from, to, t }) {
        const inRange = { createdAt: { $gte: from, $lte: to } };
        const [total, created, perDay, gender, blood, dobs, insured] = await Promise.all([
            Patient.countDocuments(),
            Patient.countDocuments(inRange),
            Patient.aggregate([{ $match: inRange }, { $group: { _id: day('$createdAt'), value: { $sum: 1 } } }]),
            Patient.aggregate([{ $group: { _id: '$gender', value: { $sum: 1 } } }]),
            Patient.aggregate([{ $group: { _id: '$bloodType', value: { $sum: 1 } } }]),
            Patient.find().select('dateOfBirth').limit(50000).lean(),
            Insurance.distinct('patientId', { status: 'active' }),
        ]);
        const now = Date.now();
        const ages = dobs.map((p) => (p.dateOfBirth ? (now - new Date(p.dateOfBirth)) / 31557600000 : null)).filter((a) => a !== null && a >= 0 && a < 120);
        const bands = [['0-17', 0, 18], ['18-34', 18, 35], ['35-49', 35, 50], ['50-64', 50, 65], ['65+', 65, 200]];
        const label = (id) => ({ Male: t.male, Female: t.female, Other: t.other }[id] || id || t.unknown);

        return {
            kpis: [
                { key: 'new', label: t.patients_new, value: created },
                { key: 'total', label: t.patients_total, value: total },
                { key: 'insured', label: t.insured, value: pct(insured.length, total), format: 'percent' },
                { key: 'age', label: t.avg_age, value: ages.length ? round(ages.reduce((a, b) => a + b, 0) / ages.length, 1) : 0 },
            ],
            sections: [
                { key: 'perday', title: t.by_day_new, type: 'line', data: fillDays(perDay, from, to) },
                { key: 'gender', title: t.gender, type: 'donut', data: gender.map((g) => ({ label: label(g._id), value: g.value })) },
                { key: 'age', title: t.age_groups, type: 'bar', data: bands.map(([name, lo, hi]) => ({ label: name, value: ages.filter((a) => a >= lo && a < hi).length })) },
                { key: 'blood', title: t.blood, type: 'donut', data: rank(blood.map((b) => ({ label: b._id || t.unknown, value: b.value })), 9) },
            ],
        };
    },

    async appointments({ from, to, t }) {
        const m = { appointmentDate: { $gte: from, $lte: to } };
        const [byStatus, perDay, byDoctor, byHour, byDept] = await Promise.all([
            Appointment.aggregate([{ $match: m }, { $group: { _id: '$status', value: { $sum: 1 } } }]),
            Appointment.aggregate([{ $match: m }, { $group: { _id: day('$appointmentDate'), value: { $sum: 1 } } }]),
            Appointment.aggregate([{ $match: m }, { $group: { _id: '$staffId', value: { $sum: 1 } } }, { $sort: { value: -1 } }, { $limit: 10 },
                { $lookup: { from: Staff.collection.name, localField: '_id', foreignField: '_id', as: 's' } }]),
            Appointment.aggregate([{ $match: m }, { $group: { _id: { $substr: ['$appointmentTime', 0, 2] }, value: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
            Appointment.aggregate([{ $match: m }, { $group: { _id: '$departmentId', value: { $sum: 1 } } }, { $sort: { value: -1 } }, { $limit: 10 },
                { $lookup: { from: Department.collection.name, localField: '_id', foreignField: '_id', as: 'd' } }]),
        ]);
        const total = byStatus.reduce((a, s) => a + s.value, 0);
        const get = (s) => byStatus.find((x) => x._id === s)?.value || 0;

        return {
            kpis: [
                { key: 'total', label: t.appts, value: total },
                { key: 'done', label: t.completed, value: get('completed') },
                { key: 'rate', label: t.completion_rate, value: pct(get('completed'), total), format: 'percent' },
                { key: 'noshow', label: t.no_show_rate, value: pct(get('no-show'), total), format: 'percent' },
            ],
            sections: [
                { key: 'perday', title: t.by_day_appts, type: 'line', data: fillDays(perDay, from, to) },
                { key: 'status', title: t.by_status, type: 'donut', data: byStatus.map((s) => ({ label: s._id, value: s.value, raw: s._id })) },
                { key: 'doctor', title: t.by_doctor, type: 'bar', data: byDoctor.map((d) => ({ label: d.s[0]?.name || '—', value: d.value })) },
                { key: 'hour', title: t.by_hour, type: 'bar', data: byHour.map((h) => ({ label: `${h._id}:00`, value: h.value })) },
                { key: 'dept', title: t.by_dept, type: 'bar', data: byDept.map((d) => ({ label: d.d[0]?.name || t.no_dept, value: d.value })) },
            ],
        };
    },

    async financial({ from, to, t }) {
        const m = { startDate: { $gte: from, $lte: to } };
        const [perDay, byType, count, visits, cover] = await Promise.all([
            Treatment.aggregate([{ $match: m }, { $group: { _id: day('$startDate'), value: { $sum: { $ifNull: ['$cost', 0] } } } }]),
            Treatment.aggregate([{ $match: m }, { $group: { _id: '$treatmentType', value: { $sum: { $ifNull: ['$cost', 0] } }, n: { $sum: 1 } } }]),
            Treatment.countDocuments(m),
            Visit.aggregate([{ $match: { visitDate: { $gte: from, $lte: to } } }, { $group: { _id: null, value: { $sum: { $ifNull: ['$cost', 0] } } } }]),
            Insurance.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, value: { $sum: { $ifNull: ['$coverageAmount', 0] } } } }]),
        ]);
        const revenue = perDay.reduce((a, d) => a + d.value, 0);

        return {
            kpis: [
                { key: 'revenue', label: t.revenue, value: revenue, format: 'money' },
                { key: 'count', label: t.treatments, value: count },
                { key: 'avg', label: t.avg_treatment, value: count ? round(revenue / count) : 0, format: 'money' },
                { key: 'visits', label: t.visits_cost, value: visits[0]?.value || 0, format: 'money' },
                { key: 'cover', label: t.coverage, value: cover[0]?.value || 0, format: 'money' },
            ],
            sections: [
                { key: 'perday', title: t.revenue_day, type: 'line', format: 'money', data: fillDays(perDay, from, to) },
                { key: 'type', title: t.revenue_type, type: 'donut', format: 'money', data: rank(byType.map((x) => ({ label: x._id || t.unknown, value: x.value })), 8) },
                { key: 'top', title: t.top_treatments, type: 'table', columns: [{ key: 'label', label: t.name }, { key: 'count', label: t.treatments, format: 'number' }, { key: 'value', label: t.revenue, format: 'money' }],
                    rows: rank(byType.map((x) => ({ label: x._id || t.unknown, count: x.n, value: x.value })), 10) },
            ],
        };
    },

    async staff({ from, to, t }) {
        const [active, inactive, accounts, byRole, byDept, hires, workload] = await Promise.all([
            Staff.countDocuments({ status: { $ne: 'inactive' } }),
            Staff.countDocuments({ status: 'inactive' }),
            Staff.countDocuments({ username: { $exists: true, $ne: null } }),
            Staff.aggregate([{ $group: { _id: '$role', value: { $sum: 1 } } }]),
            Staff.aggregate([{ $group: { _id: '$department_id', value: { $sum: 1 } } }, { $lookup: { from: Department.collection.name, localField: '_id', foreignField: '_id', as: 'd' } }]),
            Staff.aggregate([{ $match: { hire_date: { $gte: new Date(Date.now() - 365 * 86400000) } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$hire_date' } }, value: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
            Appointment.aggregate([{ $match: { appointmentDate: { $gte: from, $lte: to } } }, { $group: { _id: '$staffId', value: { $sum: 1 } } }, { $sort: { value: -1 } }, { $limit: 10 },
                { $lookup: { from: Staff.collection.name, localField: '_id', foreignField: '_id', as: 's' } }]),
        ]);

        return {
            kpis: [
                { key: 'total', label: t.staff_total, value: active + inactive },
                { key: 'active', label: t.staff_active, value: active },
                { key: 'inactive', label: t.staff_inactive, value: inactive },
                { key: 'accounts', label: t.staff_accounts, value: accounts },
            ],
            sections: [
                { key: 'role', title: t.staff_by_role, type: 'donut', data: rank(byRole.map((r) => ({ label: r._id || t.unknown, value: r.value })), 8) },
                { key: 'dept', title: t.staff_by_dept, type: 'bar', data: rank(byDept.map((d) => ({ label: d.d[0]?.name || t.no_dept, value: d.value })), 12) },
                { key: 'work', title: t.staff_workload, type: 'bar', data: workload.map((w) => ({ label: w.s[0]?.name || '—', value: w.value })) },
                { key: 'hires', title: t.hires, type: 'bar', data: hires.map((h) => ({ label: h._id, value: h.value })) },
            ],
        };
    },

    async departments({ t }) {
        const [depts, staff, rooms, appts] = await Promise.all([
            Department.find().select('name capacity status').lean(),
            Staff.aggregate([{ $group: { _id: '$department_id', value: { $sum: 1 } } }]),
            Room.aggregate([{ $group: { _id: '$departmentId', value: { $sum: 1 }, cap: { $sum: '$capacity' } } }]),
            Appointment.aggregate([{ $match: { appointmentDate: { $gte: new Date(Date.now() - 30 * 86400000) } } }, { $group: { _id: '$departmentId', value: { $sum: 1 } } }]),
        ]);
        const by = (rows, id) => rows.find((r) => String(r._id) === String(id));
        const rows = depts.map((d) => ({
            label: d.name, staff: by(staff, d._id)?.value || 0, rooms: by(rooms, d._id)?.value || 0,
            capacity: d.capacity || by(rooms, d._id)?.cap || 0, appts: by(appts, d._id)?.value || 0,
        }));

        return {
            kpis: [
                { key: 'depts', label: t.dept, value: depts.length },
                { key: 'staff', label: t.staff, value: rows.reduce((a, r) => a + r.staff, 0) },
                { key: 'rooms', label: t.rooms, value: rows.reduce((a, r) => a + r.rooms, 0) },
                { key: 'cap', label: t.capacity, value: rows.reduce((a, r) => a + r.capacity, 0) },
            ],
            sections: [
                { key: 'staff', title: t.staff_by_dept, type: 'bar', data: rank(rows.map((r) => ({ label: r.label, value: r.staff })), 12) },
                { key: 'appts', title: t.by_dept, type: 'bar', data: rank(rows.map((r) => ({ label: r.label, value: r.appts })), 12) },
                { key: 'table', title: t.dept_overview, type: 'table', columns: [{ key: 'label', label: t.dept }, { key: 'staff', label: t.staff, format: 'number' }, { key: 'rooms', label: t.rooms, format: 'number' }, { key: 'capacity', label: t.capacity, format: 'number' }, { key: 'appts', label: t.appts, format: 'number' }], rows },
            ],
        };
    },

    async inventory({ t }) {
        const soon = new Date(Date.now() + 90 * 86400000);
        const [meds, low, expiring, byCat, equipment] = await Promise.all([
            Medication.aggregate([{ $group: { _id: null, n: { $sum: 1 }, value: { $sum: { $multiply: [{ $ifNull: ['$stockQuantity', 0] }, { $ifNull: ['$price', 0] }] } } } }]),
            Medication.find({ stockQuantity: { $lte: 50 } }).select('name stockQuantity category').sort({ stockQuantity: 1 }).limit(15).lean(),
            Medication.find({ expiryDate: { $lte: soon } }).select('name expiryDate stockQuantity').sort({ expiryDate: 1 }).limit(15).lean(),
            Medication.aggregate([{ $group: { _id: '$category', value: { $sum: { $multiply: [{ $ifNull: ['$stockQuantity', 0] }, { $ifNull: ['$price', 0] }] } } } }]),
            Equipment.aggregate([{ $group: { _id: '$status', value: { $sum: 1 } } }]),
        ]);
        const eq = equipment.reduce((a, e) => a + e.value, 0);
        const ok = equipment.find((e) => e._id === 'operational')?.value || 0;

        return {
            kpis: [
                { key: 'value', label: t.stock_value, value: round(meds[0]?.value || 0), format: 'money' },
                { key: 'meds', label: t.meds, value: meds[0]?.n || 0 },
                { key: 'low', label: t.low_stock, value: low.length },
                { key: 'exp', label: t.expiring, value: expiring.length },
                { key: 'attn', label: t.equip_attention, value: eq - ok },
            ],
            sections: [
                { key: 'cat', title: t.stock_by_cat, type: 'donut', format: 'money', data: rank(byCat.map((c) => ({ label: c._id || t.unknown, value: round(c.value) })), 8) },
                { key: 'equip', title: t.equip_status, type: 'donut', data: equipment.map((e) => ({ label: e._id, value: e.value, raw: e._id })) },
                { key: 'low', title: t.low_stock_list, type: 'table', columns: [{ key: 'name', label: t.name }, { key: 'category', label: t.category }, { key: 'qty', label: t.quantity, format: 'number' }], rows: low.map((m) => ({ name: m.name, category: m.category, qty: m.stockQuantity })) },
                { key: 'exp', title: t.expiring_list, type: 'table', columns: [{ key: 'name', label: t.name }, { key: 'date', label: t.expires, format: 'date' }, { key: 'qty', label: t.quantity, format: 'number' }], rows: expiring.map((m) => ({ name: m.name, date: m.expiryDate, qty: m.stockQuantity })) },
            ],
        };
    },

    async quality({ from, to, t }) {
        const m = { createdAt: { $gte: from, $lte: to } };
        const [byType, byPriority, byStatus, perDay, resolvedDocs, ratings] = await Promise.all([
            Complaint.aggregate([{ $match: m }, { $group: { _id: '$complaintType', value: { $sum: 1 } } }]),
            Complaint.aggregate([{ $match: m }, { $group: { _id: '$priority', value: { $sum: 1 } } }]),
            Complaint.aggregate([{ $match: m }, { $group: { _id: '$status', value: { $sum: 1 } } }]),
            Complaint.aggregate([{ $match: m }, { $group: { _id: day('$createdAt'), value: { $sum: 1 } } }]),
            Complaint.find({ ...m, status: { $in: ['resolved', 'closed'] } }).select('createdAt resolvedAt').lean(),
            Feedback.aggregate([{ $match: m }, { $group: { _id: '$rating', value: { $sum: 1 } } }]),
        ]);
        const total = byStatus.reduce((a, s) => a + s.value, 0);
        const resolved = byStatus.filter((s) => ['resolved', 'closed'].includes(s._id)).reduce((a, s) => a + s.value, 0);
        const days = resolvedDocs.filter((c) => c.resolvedAt).map((c) => (new Date(c.resolvedAt) - new Date(c.createdAt)) / 86400000);
        const rated = ratings.reduce((a, r) => a + r.value, 0);

        return {
            kpis: [
                { key: 'c', label: t.complaints, value: total },
                { key: 'rate', label: t.resolution_rate, value: pct(resolved, total), format: 'percent' },
                { key: 'days', label: t.avg_days, value: days.length ? round(days.reduce((a, b) => a + b, 0) / days.length, 1) : 0 },
                { key: 'rating', label: t.avg_rating, value: rated ? round(ratings.reduce((a, r) => a + (r._id || 0) * r.value, 0) / rated, 2) : 0 },
                { key: 'fb', label: t.feedback_n, value: rated },
            ],
            sections: [
                { key: 'perday', title: t.c_day, type: 'line', data: fillDays(perDay, from, to) },
                { key: 'type', title: t.c_type, type: 'donut', data: rank(byType.map((x) => ({ label: x._id || t.unknown, value: x.value, raw: x._id })), 8) },
                { key: 'priority', title: t.c_priority, type: 'bar', data: byPriority.map((x) => ({ label: x._id || t.unknown, value: x.value, raw: x._id })) },
                { key: 'status', title: t.c_status, type: 'donut', data: byStatus.map((x) => ({ label: x._id || t.unknown, value: x.value, raw: x._id })) },
                { key: 'ratings', title: t.ratings, type: 'bar', data: [5, 4, 3, 2, 1].map((n) => ({ label: t.star.replace('{n}', n), value: ratings.find((r) => r._id === n)?.value || 0 })) },
            ],
        };
    },

    async clinical({ from, to, t }) {
        const m = { createdAt: { $gte: from, $lte: to } };
        const [byStatus, byKind, results, meds, rxCount, vitals] = await Promise.all([
            Test.aggregate([{ $match: m }, { $group: { _id: '$status', value: { $sum: 1 } } }]),
            Test.aggregate([{ $match: m }, { $group: { _id: '$testType', value: { $sum: 1 } } }]),
            Test.find({ ...m, resultValue: { $exists: true, $nin: [null, ''] }, normalRange: { $exists: true, $nin: [null, ''] } }).select('testName resultValue normalRange').limit(20000).lean(),
            Prescription.aggregate([{ $match: m }, { $group: { _id: '$medicationName', value: { $sum: 1 } } }, { $sort: { value: -1 } }, { $limit: 10 }]),
            Prescription.countDocuments(m),
            Vital.countDocuments({ recordedAt: { $gte: from, $lte: to } }),
        ]);
        const stats = {};
        for (const r of results) {
            const nums = (r.normalRange || '').match(/-?\d+(?:[.,]\d+)?/g)?.map((n) => parseFloat(n.replace(',', '.')));
            const v = parseFloat(r.resultValue);
            if (!nums || nums.length < 2 || Number.isNaN(v)) continue;
            const s = (stats[r.testName] ||= { name: r.testName, n: 0, out: 0 });
            s.n += 1;
            if (v < nums[0] || v > nums[1]) s.out += 1;
        }
        const list = Object.values(stats).filter((s) => s.n >= 3).map((s) => ({ ...s, rate: pct(s.out, s.n) })).sort((a, b) => b.rate - a.rate).slice(0, 10);
        const totalTests = byStatus.reduce((a, s) => a + s.value, 0);
        const outTotal = Object.values(stats).reduce((a, s) => a + s.out, 0);

        return {
            kpis: [
                { key: 'tests', label: t.tests, value: totalTests },
                { key: 'pending', label: t.pending, value: byStatus.find((s) => s._id === 'pending')?.value || 0 },
                { key: 'abnormal', label: t.abnormal, value: outTotal },
                { key: 'rx', label: t.rx, value: rxCount },
                { key: 'vitals', label: t.vitals, value: vitals },
            ],
            sections: [
                { key: 'status', title: t.tests_status, type: 'donut', data: byStatus.map((s) => ({ label: s._id, value: s.value, raw: s._id })) },
                { key: 'kind', title: t.tests_kind, type: 'bar', data: rank(byKind.map((k) => ({ label: k._id || t.unknown, value: k.value, raw: k._id })), 8) },
                { key: 'meds', title: t.top_meds, type: 'bar', data: meds.map((x) => ({ label: x._id || t.unknown, value: x.value })) },
                { key: 'abn', title: t.top_abnormal, type: 'table', columns: [{ key: 'name', label: t.name }, { key: 'n', label: t.samples, format: 'number' }, { key: 'out', label: t.abnormal, format: 'number' }, { key: 'rate', label: t.out_rate, format: 'percent' }], rows: list },
            ],
        };
    },
};

const templates = () => TEMPLATES;

const run = async (id, { from, to, lang = 'en' }) => {
    const gen = GENERATORS[id];
    if (!gen) return null;
    const t = TEXT[lang] || TEXT.en;
    const body = await gen({ from, to, t });

    return { meta: { id, from, to, generatedAt: new Date() }, ...body };
};

module.exports = { templates, run, TEMPLATES };
