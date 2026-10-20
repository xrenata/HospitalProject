"use client";

import { useI18n } from "@/contexts/I18nContext";

type Dict = Record<string, string>;

const EN: Dict = {
  add_to_file: "Add to this file", new_record: "New record", save: "Save", save_another: "Save and add another", cancel: "Cancel",
  saved: "Saved", removed: "Removed", required: "Fill in the required fields", staff: "Staff member", staff_hint: "Defaults to you",
  pick_staff: "Pick a staff member", date: "Date", time: "Time", notes: "Notes", status: "Status", cost: "Cost", reason: "Reason",
  type_appointments: "Appointment", type_visits: "Visit", type_treatments: "Treatment", type_prescriptions: "Prescription",
  type_tests: "Test", type_lab: "Blood test panel", type_insurance: "Insurance policy", type_vitals: "Vital signs",
  hint_appointments: "Book a date and time with a doctor", hint_visits: "Record an examination", hint_treatments: "Start a treatment plan",
  hint_prescriptions: "Prescribe medication", hint_tests: "Order a single test", hint_lab: "Enter many results from one draw",
  hint_insurance: "Add a policy", hint_vitals: "Blood pressure, pulse, temperature…",
  new_title: "New {type}", for_patient: "for {name}",
  // appointment
  pick_time: "Pick a time", slot_taken: "Taken", slot_hint: "Times already booked for this doctor are greyed out",
  reasons: "Check-up|Follow-up|Consultation|Test results|Vaccination|Pre-op assessment",
  // visit
  visit_type: "Visit type", vt_consultation: "Consultation", vt_follow_up: "Follow-up", vt_emergency: "Emergency", vt_routine_check: "Routine check",
  diagnosis: "Diagnosis", treatment_plan: "Treatment plan", next_visit: "Next visit",
  st_completed: "Completed", st_scheduled: "Scheduled",
  // treatment
  treatment_type: "Treatment type", treatment_types: "Medication|Surgery|Physical therapy|Therapy|Procedure|Other",
  description: "Description", medication: "Medication", start_date: "Start date", end_date: "End date",
  st_ongoing: "Ongoing",
  // prescription
  search_medication: "Search or type a medication", dosage: "Dosage", frequency: "Frequency", duration: "Duration", quantity: "Quantity (boxes)",
  instructions: "Instructions", frequencies: "Once daily|Twice daily|Three times daily|Every 8 hours|As needed|At bedtime",
  durations: "3 days|5 days|7 days|10 days|14 days|1 month|Ongoing", in_stock: "{n} in stock", out_of_stock: "Out of stock",
  allergy_warning: "Possible allergy: this patient is allergic to {a}", allergies: "Allergies",
  // test
  test_name: "Test", test_kind: "Kind", kinds: "blood|urine|imaging|ecg|other", kind_blood: "Blood", kind_urine: "Urine", kind_imaging: "Imaging",
  kind_ecg: "ECG / cardiac", kind_other: "Other", priority: "Priority", pr_low: "Low", pr_normal: "Normal", pr_high: "High", pr_urgent: "Urgent",
  sample: "Sample", result_optional: "Result (optional)", result: "Result", unit: "Unit", reference: "Reference range",
  // lab panel
  choose_panels: "Choose panels", analyte: "Test", value: "Value", flag: "Flag", entered: "{n} values entered", out_of_range: "{n} out of range",
  ranges_for: "Reference ranges ({sex})", sex_male: "male", sex_female: "female", draw_time: "Sample time", fill_hint: "Leave blank what was not measured",
  low: "Low", high: "High", normal: "Normal", elevated: "Elevated", result_added: "{n} results added",
  // insurance
  company: "Insurance company", policy: "Policy number", coverage_type: "Coverage", ct_basic: "Basic", ct_premium: "Premium", ct_comprehensive: "Comprehensive",
  coverage_amount: "Coverage amount", deductible: "Deductible", valid_from: "Valid from", valid_until: "Valid until", st_active: "Active",
  // vitals
  bp: "Blood pressure", systolic: "Systolic", diastolic: "Diastolic", heart_rate: "Pulse", temperature: "Temperature", spo2: "Oxygen (SpO₂)",
  resp_rate: "Breathing rate", weight: "Weight", height: "Height", bmi: "BMI", measured_at: "Measured at", latest_reading: "Latest reading",
  history: "History", add_vitals: "Record vitals", no_vitals: "No vital signs recorded yet", per_min: "/min", mmhg: "mmHg",
  trend: "Trend", recorded_by: "Recorded by",
  // rows / lists
  add: "Add", change_status: "Change status", delete: "Delete", delete_confirm: "Remove this {type}? This cannot be undone.",
  none_yet: "Nothing here yet", add_first: "Add the first one", actions: "Actions", quick_add: "Quick add",
  tab_vitals: "Vitals", new_lab: "New lab results", no_access: "You can view but not add here",
  panel: "Panel", all_panels: "All", clear: "Clear", date_taken: "Sample date",
};

const TR: Dict = {
  add_to_file: "Bu dosyaya ekle", new_record: "Yeni kayıt", save: "Kaydet", save_another: "Kaydet ve yenisini ekle", cancel: "Vazgeç",
  saved: "Kaydedildi", removed: "Silindi", required: "Zorunlu alanları doldurun", staff: "Personel", staff_hint: "Varsayılan: siz",
  pick_staff: "Bir personel seçin", date: "Tarih", time: "Saat", notes: "Notlar", status: "Durum", cost: "Tutar", reason: "Sebep",
  type_appointments: "Randevu", type_visits: "Ziyaret", type_treatments: "Tedavi", type_prescriptions: "Reçete",
  type_tests: "Test", type_lab: "Kan tahlili paneli", type_insurance: "Sigorta poliçesi", type_vitals: "Vital bulgular",
  hint_appointments: "Bir hekimle tarih ve saat ayırın", hint_visits: "Bir muayene kaydedin", hint_treatments: "Tedavi planı başlatın",
  hint_prescriptions: "İlaç yazın", hint_tests: "Tek bir test isteyin", hint_lab: "Bir numuneden birçok sonuç girin",
  hint_insurance: "Poliçe ekleyin", hint_vitals: "Tansiyon, nabız, ateş…",
  new_title: "Yeni {type}", for_patient: "{name} için",
  pick_time: "Bir saat seçin", slot_taken: "Dolu", slot_hint: "Bu hekimin dolu saatleri soluk gösterilir",
  reasons: "Kontrol|Takip|Muayene|Tahlil sonucu|Aşı|Ameliyat öncesi değerlendirme",
  visit_type: "Ziyaret türü", vt_consultation: "Muayene", vt_follow_up: "Takip", vt_emergency: "Acil", vt_routine_check: "Rutin kontrol",
  diagnosis: "Tanı", treatment_plan: "Tedavi planı", next_visit: "Sonraki ziyaret",
  st_completed: "Tamamlandı", st_scheduled: "Planlandı",
  treatment_type: "Tedavi türü", treatment_types: "İlaç|Ameliyat|Fizik tedavi|Terapi|Girişim|Diğer",
  description: "Açıklama", medication: "İlaç", start_date: "Başlangıç", end_date: "Bitiş",
  st_ongoing: "Devam ediyor",
  search_medication: "İlaç arayın veya yazın", dosage: "Doz", frequency: "Sıklık", duration: "Süre", quantity: "Miktar (kutu)",
  instructions: "Kullanım talimatı", frequencies: "Günde 1 kez|Günde 2 kez|Günde 3 kez|8 saatte bir|Gerektiğinde|Yatmadan önce",
  durations: "3 gün|5 gün|7 gün|10 gün|14 gün|1 ay|Sürekli", in_stock: "Stokta {n} adet", out_of_stock: "Stokta yok",
  allergy_warning: "Olası alerji: hasta {a} alerjisine sahip", allergies: "Alerjiler",
  test_name: "Test", test_kind: "Tür", kinds: "blood|urine|imaging|ecg|other", kind_blood: "Kan", kind_urine: "İdrar", kind_imaging: "Görüntüleme",
  kind_ecg: "EKG / kalp", kind_other: "Diğer", priority: "Öncelik", pr_low: "Düşük", pr_normal: "Normal", pr_high: "Yüksek", pr_urgent: "Acil",
  sample: "Numune", result_optional: "Sonuç (isteğe bağlı)", result: "Sonuç", unit: "Birim", reference: "Referans aralığı",
  choose_panels: "Panelleri seçin", analyte: "Tetkik", value: "Değer", flag: "Durum", entered: "{n} değer girildi", out_of_range: "{n} referans dışı",
  ranges_for: "Referans aralıkları ({sex})", sex_male: "erkek", sex_female: "kadın", draw_time: "Numune saati", fill_hint: "Ölçülmeyenleri boş bırakın",
  low: "Düşük", high: "Yüksek", normal: "Normal", elevated: "Yüksekçe", result_added: "{n} sonuç eklendi",
  company: "Sigorta şirketi", policy: "Poliçe numarası", coverage_type: "Kapsam", ct_basic: "Temel", ct_premium: "Premium", ct_comprehensive: "Kapsamlı",
  coverage_amount: "Teminat tutarı", deductible: "Muafiyet", valid_from: "Başlangıç", valid_until: "Bitiş", st_active: "Aktif",
  bp: "Tansiyon", systolic: "Büyük (sistolik)", diastolic: "Küçük (diyastolik)", heart_rate: "Nabız", temperature: "Ateş", spo2: "Oksijen (SpO₂)",
  resp_rate: "Solunum sayısı", weight: "Kilo", height: "Boy", bmi: "VKİ", measured_at: "Ölçüm zamanı", latest_reading: "Son ölçüm",
  history: "Geçmiş", add_vitals: "Vital bulgu gir", no_vitals: "Henüz vital bulgu kaydedilmemiş", per_min: "/dk", mmhg: "mmHg",
  trend: "Eğilim", recorded_by: "Kaydeden",
  add: "Ekle", change_status: "Durumu değiştir", delete: "Sil", delete_confirm: "Bu {type} silinsin mi? Bu işlem geri alınamaz.",
  none_yet: "Henüz bir şey yok", add_first: "İlkini ekleyin", actions: "İşlemler", quick_add: "Hızlı ekle",
  tab_vitals: "Vital bulgular", new_lab: "Yeni tahlil sonucu", no_access: "Burada görüntüleyebilirsiniz ama ekleyemezsiniz",
  panel: "Panel", all_panels: "Tümü", clear: "Temizle", date_taken: "Numune tarihi",
};

/** Text for the patient workspace: `r("save")`, `r("new_title", { type: "Randevu" })`. */
export function useRecText() {
  const { language } = useI18n();
  const dict = language === "tr" ? TR : EN;

  const r = (key: string, vars?: Record<string, string | number>): string => {
    let text = dict[key] ?? EN[key] ?? key;

    if (vars) Object.entries(vars).forEach(([k, v]) => { text = text.replace(`{${k}}`, String(v)); });

    return text;
  };

  /** pipe-separated lists such as the reason chips */
  r.list = (key: string): string[] => (dict[key] ?? EN[key] ?? "").split("|").filter(Boolean);

  return r;
}
