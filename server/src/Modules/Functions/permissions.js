/**
 * Access control: permission catalog, default roles and the logic that turns
 * "role + per-person grants/denies" into the permissions someone effectively has.
 *
 * A permission is "<resource>.<action>", e.g. "patients.edit". "*" means everything.
 */

const CRUD = ['view', 'create', 'edit', 'delete'];

// group -> resources. Order here is the order shown in the role editor.
const CATALOG = [
    {
        group: 'clinical',
        resources: [
            { key: 'patients', actions: [...CRUD, 'medical', 'export'] },
            { key: 'appointments', actions: CRUD },
            { key: 'visits', actions: CRUD },
            { key: 'treatments', actions: CRUD },
            { key: 'tests', actions: CRUD },
            { key: 'prescriptions', actions: CRUD },
            { key: 'surgeries', actions: CRUD },
            { key: 'surgery_teams', actions: CRUD },
        ],
    },
    {
        group: 'hospital',
        resources: [
            { key: 'staff', actions: [...CRUD, 'salary', 'assign_roles'] },
            { key: 'departments', actions: CRUD },
            { key: 'rooms', actions: CRUD },
            { key: 'shifts', actions: CRUD },
            { key: 'maintenance', actions: CRUD },
            { key: 'ambulances', actions: CRUD },
        ],
    },
    {
        group: 'inventory',
        resources: [
            { key: 'medications', actions: CRUD },
            { key: 'equipment', actions: CRUD },
            { key: 'blood_bank', actions: CRUD },
        ],
    },
    {
        group: 'communication',
        resources: [
            { key: 'notifications', actions: ['view', 'edit'] },
            { key: 'complaints', actions: CRUD },
            { key: 'feedback', actions: CRUD },
            { key: 'incidents', actions: CRUD },
        ],
    },
    {
        group: 'administration',
        resources: [
            { key: 'insurance', actions: CRUD },
            { key: 'billing', actions: CRUD },
            { key: 'hospital', actions: CRUD },
            { key: 'analytics', actions: ['view'] },
            { key: 'reports', actions: ['view', 'create', 'delete'] },
            { key: 'roles', actions: CRUD },
        ],
    },
];

const ALL_PERMISSIONS = CATALOG.flatMap((g) => g.resources.flatMap((r) => r.actions.map((a) => `${r.key}.${a}`)));
const VALID = new Set(ALL_PERMISSIONS);

const view = (...resources) => resources.map((r) => `${r}.view`);
const crud = (resource, actions = CRUD) => actions.map((a) => `${resource}.${a}`);

/** Roles created on first start. `locked` ones can't have their permissions changed. */
const DEFAULT_ROLES = [
    {
        key: 'admin', name: 'Administrator', color: 'danger', locked: true, legacyLevel: 3,
        description: 'Full access to everything, including roles and permissions.',
        permissions: ['*'],
    },
    {
        key: 'doctor', name: 'Doctor', color: 'primary', legacyLevel: 2,
        description: 'Treats patients: records, prescriptions, tests and surgeries.',
        permissions: [
            ...crud('patients', ['view', 'create', 'edit', 'medical']),
            ...crud('appointments', ['view', 'create', 'edit']),
            ...crud('visits', ['view', 'create', 'edit']),
            ...crud('treatments', ['view', 'create', 'edit']),
            ...crud('tests', ['view', 'create', 'edit']),
            ...crud('prescriptions', ['view', 'create', 'edit']),
            ...crud('surgeries', ['view', 'create', 'edit']),
            ...view('surgery_teams', 'staff', 'departments', 'rooms', 'shifts', 'medications', 'equipment', 'complaints', 'feedback', 'insurance', 'analytics', 'reports'),
            ...crud('notifications', ['view', 'edit']),
            ...view('blood_bank', 'maintenance', 'ambulances'),
            ...crud('incidents', ['view', 'create']),
        ],
    },
    {
        key: 'nurse', name: 'Nurse', color: 'success', legacyLevel: 1,
        description: 'Day-to-day patient care: vitals, visits, tests and room status.',
        permissions: [
            ...crud('patients', ['view', 'edit', 'medical']),
            ...crud('appointments', ['view', 'edit']),
            ...crud('visits', ['view', 'create', 'edit']),
            ...crud('treatments', ['view']),
            ...crud('tests', ['view', 'create']),
            ...crud('prescriptions', ['view']),
            ...crud('rooms', ['view', 'edit']),
            ...view('departments', 'staff', 'shifts', 'medications', 'equipment', 'surgeries', 'surgery_teams'),
            ...crud('complaints', ['view', 'create']),
            ...crud('notifications', ['view', 'edit']),
            ...view('blood_bank', 'ambulances'),
            ...crud('maintenance', ['view', 'create']),
            ...crud('incidents', ['view', 'create']),
        ],
    },
    {
        key: 'receptionist', name: 'Receptionist', color: 'warning',
        description: 'Front desk: registers patients, books appointments, handles insurance details.',
        permissions: [
            ...crud('patients', ['view', 'create', 'edit']),
            ...crud('appointments', CRUD),
            ...crud('visits', ['view', 'create']),
            ...crud('insurance', ['view', 'create', 'edit']),
            ...crud('billing', ['view', 'create', 'edit']),
            ...crud('complaints', ['view', 'create']),
            ...crud('feedback', ['view', 'create']),
            ...view('staff', 'departments', 'rooms'),
            ...crud('notifications', ['view']),
        ],
    },
    {
        key: 'lab_technician', name: 'Lab technician', color: 'secondary',
        description: 'Runs tests and enters results.',
        permissions: [
            ...crud('patients', ['view']),
            ...crud('tests', ['view', 'create', 'edit']),
            ...crud('blood_bank', CRUD),
            ...view('staff', 'departments', 'equipment'),
            ...crud('notifications', ['view']),
        ],
    },
    {
        key: 'pharmacist', name: 'Pharmacist', color: 'success',
        description: 'Fills prescriptions and manages medication stock.',
        permissions: [
            ...crud('patients', ['view']),
            ...crud('prescriptions', ['view', 'edit']),
            ...crud('medications', CRUD),
            ...view('staff', 'departments'),
            ...crud('notifications', ['view']),
        ],
    },
    {
        key: 'billing', name: 'Billing & insurance', color: 'warning',
        description: 'Insurance policies, financial reports and analytics.',
        permissions: [
            ...crud('patients', ['view']),
            ...crud('insurance', CRUD),
            ...crud('billing', CRUD),
            ...crud('reports', ['view', 'create']),
            ...view('analytics', 'appointments', 'treatments', 'staff', 'departments'),
            ...crud('notifications', ['view']),
        ],
    },
    {
        key: 'auditor', name: 'Read-only auditor', color: 'default',
        description: 'Can look at everything except salaries and sensitive medical data, and change nothing.',
        permissions: ALL_PERMISSIONS.filter((p) => p.endsWith('.view') && p !== 'roles.view'),
    },
];

/** Resources added after the first release; existing built-in roles get their default permissions for these once. */
const NEW_RESOURCES = ['billing', 'blood_bank', 'maintenance', 'incidents', 'ambulances'];

const LEGACY_ROLE_BY_LEVEL = { 1: 'nurse', 2: 'doctor', 3: 'admin' };

/** Drop anything that is not a real permission. */
const sanitize = (list) => Array.from(new Set((Array.isArray(list) ? list : []).filter((p) => p === '*' || VALID.has(p))));

/** Role permissions + extra grants - explicit denies. */
const effective = (rolePermissions, extra = [], denied = []) => {
    const set = new Set(rolePermissions.includes('*') ? ['*'] : rolePermissions);
    extra.forEach((p) => set.add(p));
    if (!set.has('*')) denied.forEach((p) => set.delete(p));
    return set;
};

const can = (perms, key) => Boolean(perms && (perms.has('*') || perms.has(key)));

/** What the old 1-3 "permLevel" would have been, kept in sync for old clients/data. */
const legacyLevel = (perms) => {
    if (perms.has('*') || perms.has('roles.edit')) return 3;
    for (const p of perms) if (/\.(create|edit|delete)$/.test(p)) return 2;

    return 1;
};

module.exports = {
    CATALOG,
    ALL_PERMISSIONS,
    DEFAULT_ROLES,
    LEGACY_ROLE_BY_LEVEL,
    NEW_RESOURCES,
    sanitize,
    effective,
    can,
    legacyLevel,
};
