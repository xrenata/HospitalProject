import type { ModuleConfig, Opt } from "@/components/ResourceModule";

const tone = { available: "success", paid: "success", resolved: "success", closed: "default", open: "primary", issued: "primary", reported: "warning", partial: "warning", in_progress: "warning", investigating: "warning", reserved: "warning", on_call: "primary", urgent: "danger", critical: "danger", high: "danger", major: "danger", overdue: "danger", expired: "danger", out_of_service: "danger", maintenance: "warning", cancelled: "default", draft: "default", used: "default", discarded: "default", low: "default", minor: "default", moderate: "warning", medium: "warning" } as const;
const T = (en: string, tr: string) => ({ en, tr });
const pname = (r: any) => { const p = r.patientId; return p ? `${p.firstName ?? p.first_name ?? ""} ${p.lastName ?? p.last_name ?? ""}`.trim() : ""; };
const today = () => new Date().toISOString().slice(0, 10);

const priority: Opt[] = [["low", "Low", "Düşük"], ["medium", "Medium", "Orta"], ["high", "High", "Yüksek"], ["urgent", "Urgent", "Acil"]];
const bloodTypes: Opt[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => [b, b, b] as Opt);

const invoiceStatus: Opt[] = [["draft", "Draft", "Taslak"], ["issued", "Issued", "Kesildi"], ["partial", "Partly paid", "Kısmen ödendi"], ["paid", "Paid", "Ödendi"], ["overdue", "Overdue", "Gecikmiş"], ["cancelled", "Cancelled", "İptal"]];
const payMethod: Opt[] = [["cash", "Cash", "Nakit"], ["card", "Card", "Kart"], ["transfer", "Bank transfer", "Havale"], ["insurance", "Insurance", "Sigorta"]];
const component: Opt[] = [["whole_blood", "Whole blood", "Tam kan"], ["red_cells", "Red cells", "Eritrosit"], ["plasma", "Plasma", "Plazma"], ["platelets", "Platelets", "Trombosit"]];
const bloodStatus: Opt[] = [["available", "Available", "Kullanılabilir"], ["reserved", "Reserved", "Ayrıldı"], ["used", "Used", "Kullanıldı"], ["expired", "Expired", "Süresi doldu"], ["discarded", "Discarded", "İmha edildi"]];
const maintStatus: Opt[] = [["open", "Open", "Açık"], ["in_progress", "In progress", "Devam ediyor"], ["resolved", "Resolved", "Çözüldü"], ["closed", "Closed", "Kapandı"]];
const incType: Opt[] = [["patient_safety", "Patient safety", "Hasta güvenliği"], ["fall", "Fall", "Düşme"], ["medication_error", "Medication error", "İlaç hatası"], ["equipment", "Equipment", "Ekipman"], ["security", "Security", "Güvenlik"], ["infection", "Infection", "Enfeksiyon"], ["other", "Other", "Diğer"]];
const severity: Opt[] = [["minor", "Minor", "Hafif"], ["moderate", "Moderate", "Orta"], ["major", "Major", "Ciddi"], ["critical", "Critical", "Kritik"]];
const incStatus: Opt[] = [["reported", "Reported", "Bildirildi"], ["investigating", "Investigating", "İnceleniyor"], ["resolved", "Resolved", "Çözüldü"], ["closed", "Closed", "Kapandı"]];
const vehicle: Opt[] = [["basic", "Basic", "Temel"], ["advanced", "Advanced life support", "İleri yaşam desteği"], ["neonatal", "Neonatal", "Yenidoğan"], ["patient_transport", "Patient transport", "Hasta nakil"]];
const ambStatus: Opt[] = [["available", "Available", "Hazır"], ["on_call", "On call", "Görevde"], ["maintenance", "Maintenance", "Bakımda"], ["out_of_service", "Out of service", "Servis dışı"]];

export const MODULES: Record<string, ModuleConfig> = {
  billing: {
    resource: "billing", path: "/billing", statusTone: tone,
    title: T("Billing", "Faturalama"), subtitle: T("Invoices for treatments and services, and what is still unpaid.", "Tedavi ve hizmet faturaları ve henüz ödenmemiş tutarlar."),
    addLabel: T("New invoice", "Yeni fatura"), searchHint: T("Search invoices", "Fatura ara"),
    filters: [{ key: "status", label: T("All statuses", "Tüm durumlar"), options: invoiceStatus }],
    columns: [
      { key: "invoiceNumber", label: T("Invoice", "Fatura"), kind: "name" },
      { key: "patient", label: T("Patient", "Hasta"), get: pname },
      { key: "issueDate", label: T("Issued", "Tarih"), kind: "date" },
      { key: "total", label: T("Total", "Tutar"), kind: "money" },
      { key: "paid", label: T("Paid", "Ödenen"), kind: "money" },
      { key: "status", label: T("Status", "Durum"), kind: "chip", options: invoiceStatus },
    ],
    fields: [
      { key: "patientId", label: T("Patient", "Hasta"), type: "patient", required: true },
      { key: "items", label: T("Items", "Kalemler"), type: "items" },
      { key: "insuranceCovered", label: T("Covered by insurance", "Sigorta karşılığı"), type: "number", half: true },
      { key: "paid", label: T("Paid so far", "Şimdiye kadar ödenen"), type: "number", half: true },
      { key: "issueDate", label: T("Issue date", "Düzenleme tarihi"), type: "date", half: true, default: today() },
      { key: "dueDate", label: T("Due date", "Son ödeme"), type: "date", half: true },
      { key: "paymentMethod", label: T("Payment method", "Ödeme yöntemi"), type: "select", options: payMethod, half: true },
      { key: "status", label: T("Status", "Durum"), type: "select", options: invoiceStatus, half: true, default: "issued" },
      { key: "notes", label: T("Notes", "Notlar"), type: "textarea" },
    ],
  },
  blood_bank: {
    resource: "blood_bank", path: "/blood-bank", statusTone: tone,
    title: T("Blood bank", "Kan bankası"), subtitle: T("Blood and components in stock, with expiry dates.", "Stoktaki kan ve kan ürünleri, son kullanma tarihleriyle."),
    addLabel: T("Add units", "Ünite ekle"), searchHint: T("Search donor, type or location", "Donör, grup veya konum ara"),
    filters: [{ key: "bloodType", label: T("All blood types", "Tüm kan grupları"), options: bloodTypes }, { key: "status", label: T("All statuses", "Tüm durumlar"), options: bloodStatus }],
    columns: [
      { key: "bloodType", label: T("Type", "Grup"), kind: "name" },
      { key: "component", label: T("Component", "Ürün"), kind: "chip", options: component },
      { key: "units", label: T("Units", "Ünite"), kind: "number" },
      { key: "donorName", label: T("Donor", "Donör") },
      { key: "expiryDate", label: T("Expires", "Son kullanma"), kind: "date" },
      { key: "location", label: T("Location", "Konum") },
      { key: "status", label: T("Status", "Durum"), kind: "chip", options: bloodStatus },
    ],
    fields: [
      { key: "bloodType", label: T("Blood type", "Kan grubu"), type: "select", options: bloodTypes, required: true, half: true },
      { key: "component", label: T("Component", "Ürün"), type: "select", options: component, half: true },
      { key: "units", label: T("Units", "Ünite"), type: "number", half: true, default: 1 },
      { key: "status", label: T("Status", "Durum"), type: "select", options: bloodStatus, half: true },
      { key: "donorName", label: T("Donor", "Donör"), type: "text", half: true },
      { key: "location", label: T("Storage location", "Saklama yeri"), type: "text", half: true },
      { key: "collectedDate", label: T("Collected", "Alınma tarihi"), type: "date", half: true, default: today() },
      { key: "expiryDate", label: T("Expires (auto if empty)", "Son kullanma (boşsa otomatik)"), type: "date", half: true },
      { key: "notes", label: T("Notes", "Notlar"), type: "textarea" },
    ],
  },
  maintenance: {
    resource: "maintenance", path: "/maintenance", statusTone: tone,
    title: T("Maintenance requests", "Bakım talepleri"), subtitle: T("Broken equipment, rooms and facilities that need fixing.", "Onarım bekleyen ekipman, oda ve tesis sorunları."),
    addLabel: T("New request", "Yeni talep"), searchHint: T("Search requests", "Talep ara"),
    filters: [{ key: "status", label: T("All statuses", "Tüm durumlar"), options: maintStatus }, { key: "priority", label: T("All priorities", "Tüm öncelikler"), options: priority }],
    columns: [
      { key: "title", label: T("Request", "Talep"), kind: "name" },
      { key: "location", label: T("Where", "Yer"), get: (r) => r.location || r.roomId?.roomNumber || r.equipmentId?.name },
      { key: "priority", label: T("Priority", "Öncelik"), kind: "chip", options: priority },
      { key: "assignedTo", label: T("Assigned to", "Atanan"), get: (r) => r.assignedTo?.name },
      { key: "dueDate", label: T("Due", "Son tarih"), kind: "date" },
      { key: "status", label: T("Status", "Durum"), kind: "chip", options: maintStatus },
    ],
    fields: [
      { key: "title", label: T("What needs fixing", "Ne onarılacak"), type: "text", required: true },
      { key: "description", label: T("Details", "Ayrıntı"), type: "textarea" },
      { key: "location", label: T("Location", "Konum"), type: "text", half: true },
      { key: "priority", label: T("Priority", "Öncelik"), type: "select", options: priority, half: true, default: "medium" },
      { key: "assignedTo", label: T("Assigned to", "Atanan"), type: "staff", half: true },
      { key: "dueDate", label: T("Due date", "Son tarih"), type: "date", half: true },
      { key: "status", label: T("Status", "Durum"), type: "select", options: maintStatus, half: true },
      { key: "cost", label: T("Cost", "Maliyet"), type: "number", half: true },
    ],
  },
  incidents: {
    resource: "incidents", path: "/incidents", statusTone: tone,
    title: T("Incident reports", "Olay bildirimleri"), subtitle: T("Falls, medication errors and other safety events, and how they were handled.", "Düşme, ilaç hatası ve diğer güvenlik olayları ve nasıl ele alındıkları."),
    addLabel: T("Report incident", "Olay bildir"), searchHint: T("Search incidents", "Olay ara"),
    filters: [{ key: "status", label: T("All statuses", "Tüm durumlar"), options: incStatus }, { key: "severity", label: T("All severities", "Tüm şiddetler"), options: severity }],
    columns: [
      { key: "title", label: T("Incident", "Olay"), kind: "name" },
      { key: "incidentType", label: T("Type", "Tür"), kind: "chip", options: incType },
      { key: "severity", label: T("Severity", "Şiddet"), kind: "chip", options: severity },
      { key: "occurredAt", label: T("When", "Zaman"), kind: "date" },
      { key: "reportedBy", label: T("Reported by", "Bildiren"), get: (r) => r.reportedBy?.name },
      { key: "status", label: T("Status", "Durum"), kind: "chip", options: incStatus },
    ],
    fields: [
      { key: "title", label: T("What happened", "Ne oldu"), type: "text", required: true },
      { key: "incidentType", label: T("Type", "Tür"), type: "select", options: incType, half: true, default: "other" },
      { key: "severity", label: T("Severity", "Şiddet"), type: "select", options: severity, half: true },
      { key: "occurredAt", label: T("Date", "Tarih"), type: "date", half: true, default: today() },
      { key: "location", label: T("Location", "Konum"), type: "text", half: true },
      { key: "patientId", label: T("Patient involved", "İlgili hasta"), type: "patient" },
      { key: "description", label: T("Description", "Açıklama"), type: "textarea" },
      { key: "actionsTaken", label: T("Actions taken", "Alınan önlemler"), type: "textarea" },
      { key: "status", label: T("Status", "Durum"), type: "select", options: incStatus },
    ],
  },
  ambulances: {
    resource: "ambulances", path: "/ambulances", statusTone: tone,
    title: T("Ambulances", "Ambulanslar"), subtitle: T("The fleet, who is on duty and when each vehicle is due for service.", "Filo, kimin görevde olduğu ve her aracın bakım zamanı."),
    addLabel: T("Add vehicle", "Araç ekle"), searchHint: T("Search call sign, plate or station", "Çağrı kodu, plaka veya istasyon ara"),
    filters: [{ key: "status", label: T("All statuses", "Tüm durumlar"), options: ambStatus }, { key: "vehicleType", label: T("All types", "Tüm türler"), options: vehicle }],
    columns: [
      { key: "callSign", label: T("Call sign", "Çağrı kodu"), kind: "name" },
      { key: "plate", label: T("Plate", "Plaka") },
      { key: "vehicleType", label: T("Type", "Tür"), kind: "chip", options: vehicle },
      { key: "station", label: T("Station", "İstasyon") },
      { key: "driver", label: T("Driver", "Sürücü"), get: (r) => r.driverId?.name },
      { key: "nextService", label: T("Next service", "Sonraki bakım"), kind: "date" },
      { key: "status", label: T("Status", "Durum"), kind: "chip", options: ambStatus },
    ],
    fields: [
      { key: "callSign", label: T("Call sign", "Çağrı kodu"), type: "text", required: true, half: true },
      { key: "plate", label: T("Plate", "Plaka"), type: "text", half: true },
      { key: "vehicleType", label: T("Type", "Tür"), type: "select", options: vehicle, half: true },
      { key: "status", label: T("Status", "Durum"), type: "select", options: ambStatus, half: true },
      { key: "station", label: T("Station", "İstasyon"), type: "text", half: true },
      { key: "driverId", label: T("Driver", "Sürücü"), type: "staff", half: true },
      { key: "crew", label: T("Crew", "Ekip"), type: "text" },
      { key: "lastService", label: T("Last service", "Son bakım"), type: "date", half: true },
      { key: "nextService", label: T("Next service", "Sonraki bakım"), type: "date", half: true },
      { key: "mileage", label: T("Mileage (km)", "Kilometre"), type: "number", half: true },
      { key: "notes", label: T("Notes", "Notlar"), type: "textarea" },
    ],
  },
};
