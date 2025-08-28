export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Hospital Management System",
  description: "Modern hospital management system for efficient healthcare operations.",
  navItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Patients",
      href: "/dashboard/patients",
    },
    {
      label: "Appointments",
      href: "/dashboard/appointments",
    },
    {
      label: "Staff",
      href: "/dashboard/staff",
    },
    {
      label: "Medical Records",
      href: "/dashboard/medical-records",
    },
  ],
  navMenuItems: [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Patients",
      href: "/dashboard/patients",
    },
    {
      label: "Appointments",
      href: "/dashboard/appointments",
    },
    {
      label: "Staff",
      href: "/dashboard/staff",
    },
    {
      label: "Departments",
      href: "/dashboard/departments",
    },
    {
      label: "Rooms",
      href: "/dashboard/rooms",
    },
    {
      label: "Medical Records",
      href: "/dashboard/medical-records",
    },
    {
      label: "Inventory",
      href: "/dashboard/inventory",
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/hospital-management",
    docs: "/docs",
    support: "/support",
    contact: "/contact",
  },
};
