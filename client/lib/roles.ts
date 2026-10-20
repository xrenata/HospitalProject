/** Names/descriptions the built-in roles are created with. Compared against what is stored to see if someone renamed them. */
const DEFAULTS: Record<string, { name: string; description: string }> = {
  admin: { name: "Administrator", description: "Full access to everything, including roles and permissions." },
  doctor: { name: "Doctor", description: "Treats patients: records, prescriptions, tests and surgeries." },
  nurse: { name: "Nurse", description: "Day-to-day patient care: vitals, visits, tests and room status." },
  receptionist: { name: "Receptionist", description: "Front desk: registers patients, books appointments, handles insurance details." },
  lab_technician: { name: "Lab technician", description: "Runs tests and enters results." },
  pharmacist: { name: "Pharmacist", description: "Fills prescriptions and manages medication stock." },
  billing: { name: "Billing & insurance", description: "Insurance policies, financial reports and analytics." },
  auditor: { name: "Read-only auditor", description: "Can look at everything except salaries and sensitive medical data, and change nothing." },
};

interface RoleLike {
  key: string;
  name: string;
  description?: string;
  isSystem?: boolean;
}

type T = (key: string) => string;

/** Built-in roles show in the current language unless someone has renamed them. */
export const roleName = (t: T, role?: RoleLike | null): string => {
  if (!role) return "";
  const def = DEFAULTS[role.key];

  return def && role.name === def.name && t(`roles.builtin_roles.${role.key}.name`) !== `roles.builtin_roles.${role.key}.name`
    ? t(`roles.builtin_roles.${role.key}.name`)
    : role.name;
};

export const roleDescription = (t: T, role?: RoleLike | null): string => {
  if (!role) return "";
  const def = DEFAULTS[role.key];

  return def && role.description === def.description && t(`roles.builtin_roles.${role.key}.description`) !== `roles.builtin_roles.${role.key}.description`
    ? t(`roles.builtin_roles.${role.key}.description`)
    : role.description ?? "";
};
