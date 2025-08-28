"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
} from "@heroui/react";
import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";
import { Edit, Trash2, Plus, Search, ChevronDown, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import { patientsAPI } from "@/lib/api";
import { Patient } from "@/types";
import { formatDate, getPermissionLevel, toDateString } from "@/lib/utils";
import toast from "react-hot-toast";

export default function PatientsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: "",
    bloodType: "",
    ageRange: { min: "", max: "" },
    hasAllergies: "",
    hasInsurance: "",
    city: "",
    sortBy: "name",
    sortOrder: "asc",
  });

  // Yaş hesaplama fonksiyonu
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth || dateOfBirth === "") return 0;

    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);

      // Geçersiz tarih kontrolü
      if (isNaN(birthDate.getTime())) return 0;

      // Gelecek tarih kontrolü
      if (birthDate > today) return 0;

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return Math.max(0, age);
    } catch (error) {
      console.error("Error calculating age:", error);
      return 0;
    }
  };

  // Cinsiyet çevirme fonksiyonu
  const translateGender = (gender: string): string => {
    if (!gender) return t("patients.not_specified");

    const genderLower = gender.toLowerCase().trim();
    switch (genderLower) {
      case "male":
      case "erkek":
        return t("patients.male");
      case "female":
      case "kadın":
        return t("patients.female");
      case "other":
      case "diğer":
        return t("patients.other");
      default:
        return gender; // Eğer tanımlanmamış bir değerse olduğu gibi döndür
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatientsCount, setTotalPatientsCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // Delete confirmation modal
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // View patient details modal
  const {
    isOpen: isViewOpen,
    onOpen: onViewOpen,
    onClose: onViewClose,
  } = useDisclosure();
  const [patientToView, setPatientToView] = useState<Patient | null>(null);

  // Form state for adding/editing patients
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    tc_number: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    blood_type: "",
    insurance_info: "",
  });

  useEffect(() => {
    loadPatients();
  }, [currentPage, filters]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        loadPatients();
      } else {
        setCurrentPage(1); // This will trigger loadPatients via the other useEffect
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Calculate if we have active filters
  const hasActiveFilters = React.useMemo(() => {
    return (
      filters.gender !== "" ||
      filters.bloodType !== "" ||
      filters.ageRange.min !== "" ||
      filters.ageRange.max !== "" ||
      filters.hasAllergies !== "" ||
      filters.hasInsurance !== "" ||
      filters.city !== ""
    );
  }, [filters]);

  // Reset to page 1 when filters change (but not on initial load)
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  useEffect(() => {
    if (!isInitialLoad && hasActiveFilters) {
      setCurrentPage(1);
    }
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [filters, hasActiveFilters, isInitialLoad]);

  // Reset filters function
  const resetFilters = () => {
    setFilters({
      gender: "",
      bloodType: "",
      ageRange: { min: "", max: "" },
      hasAllergies: "",
      hasInsurance: "",
      city: "",
      sortBy: "name",
      sortOrder: "asc",
    });
    setSearchTerm("");
  };

  // Common Turkish cities for filter dropdown
  const availableCities = [
    "İstanbul",
    "Ankara",
    "İzmir",
    "Bursa",
    "Antalya",
    "Adana",
    "Konya",
    "Şanlıurfa",
    "Gaziantep",
    "Kocaeli",
    "Mersin",
    "Diyarbakır",
    "Hatay",
    "Manisa",
    "Kayseri",
    "Samsun",
    "Balıkesir",
    "Kahramanmaraş",
    "Van",
    "Aydın",
    "Denizli",
    "Sakarya",
    "Muğla",
    "Eskişehir",
    "Tekirdağ",
    "Trabzon",
    "Elazığ",
    "Malatya",
    "Erzurum",
    "Sivas",
  ];

  // Since we're doing server-side filtering, we don't need client-side filtering
  const filteredPatients = patients;

  // Reset to page 1 when filters change and we have active filters
  React.useEffect(() => {
    if (hasActiveFilters && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [hasActiveFilters, totalPages, currentPage]);

  // Handle URL action parameter (e.g., from Quick Actions)
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      handleAddPatient();
      // Clear the URL parameter
      router.replace("/dashboard/patients");
    }
  }, [searchParams]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      // Build query parameters including filters
      const queryParams: any = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      // Add filters to query params
      if (filters.gender) queryParams.gender = filters.gender;
      if (filters.bloodType) queryParams.bloodType = filters.bloodType;
      if (filters.ageRange.min) queryParams.minAge = filters.ageRange.min;
      if (filters.ageRange.max) queryParams.maxAge = filters.ageRange.max;
      if (filters.hasAllergies) queryParams.hasAllergies = filters.hasAllergies;
      if (filters.hasInsurance) queryParams.hasInsurance = filters.hasInsurance;
      if (filters.city) queryParams.city = filters.city;

      const response = await patientsAPI.getAll(queryParams);

      // API now returns { patients: [...], pagination: {...} }
      if (response.data.patients) {
        console.log("Patients data:", response.data.patients);
        setPatients(response.data.patients);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalPatientsCount(
          response.data.pagination?.totalPatientsCount || 0
        );
        setFilteredCount(response.data.pagination?.totalItems || 0);
      } else {
        // Fallback for old API structure
        console.log("Fallback patients data:", response.data);
        setPatients(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
        setTotalPatientsCount(response.data.length);
        setFilteredCount(response.data.length);
      }
    } catch (error) {
      console.error("Failed to load patients:", error);
      toast.error(t("patients.loading_patients"));
      setPatients([]);
      setTotalPages(1);
      setTotalPatientsCount(0);
      setFilteredCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = () => {
    setIsAddMode(true);
    setSelectedPatient(null);
    setFormData({
      first_name: "",
      last_name: "",
      tc_number: "",
      date_of_birth: "",
      gender: "",
      phone: "",
      email: "",
      address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      blood_type: "",
      insurance_info: "",
    });
    onOpen();
  };

  const handleEditPatient = (patient: Patient) => {
    setIsAddMode(false);
    setSelectedPatient(patient);
    setFormData({
      first_name: patient.first_name || "",
      last_name: patient.last_name || "",
      tc_number: patient.tc_number || "",
      date_of_birth: patient.date_of_birth || "",
      gender: patient.gender || "",
      phone: patient.phone || "",
      email: patient.email || "",
      address: patient.address || "",
      emergency_contact_name: patient.emergency_contact_name || "",
      emergency_contact_phone: patient.emergency_contact_phone || "",
      blood_type: patient.blood_type || "",
      insurance_info: patient.insurance_info || "",
    });
    onOpen();
  };

  const handleSubmit = async () => {
    // Form validasyonu
    if (!formData.first_name?.trim()) {
      toast.error(t("patients.first_name_required"));
      return;
    }

    if (!formData.last_name?.trim()) {
      toast.error(t("patients.last_name_required"));
      return;
    }

    if (!formData.tc_number?.trim()) {
      toast.error(t("patients.tc_number_required"));
      return;
    }

    // TC kimlik numarası validasyonu
    const tcNumber = formData.tc_number.trim();
    if (!/^\d{11}$/.test(tcNumber)) {
      toast.error(t("patients.tc_number_invalid"));
      return;
    }

    if (!formData.phone?.trim()) {
      toast.error(t("patients.phone_required"));
      return;
    }

    if (!formData.date_of_birth) {
      toast.error(t("patients.date_of_birth_required"));
      return;
    }

    // Doğum tarihi validasyonu
    const birthDate = new Date(formData.date_of_birth);
    const today = new Date();
    if (birthDate > today) {
      toast.error(t("patients.future_date_error"));
      return;
    }

    // Email validasyonu (eğer girilmişse)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast.error(t("patients.invalid_email"));
        return;
      }
    }

    try {
      // Veriyi temizle
      const cleanedData = {
        ...formData,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        tc_number: formData.tc_number.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || "",
        gender: formData.gender || "",
        address: formData.address?.trim() || "",
        emergency_contact_name: formData.emergency_contact_name?.trim() || "",
        emergency_contact_phone: formData.emergency_contact_phone?.trim() || "",
        blood_type: formData.blood_type || "",
        insurance_info: formData.insurance_info?.trim() || "",
      };

      if (isAddMode) {
        await patientsAPI.create(cleanedData);
        toast.success(t("patients.patient_added"));
      } else {
        await patientsAPI.update(selectedPatient!.patient_id, cleanedData);
        toast.success(t("patients.patient_updated"));
      }
      onClose();
      loadPatients();
    } catch (error) {
      console.error("Failed to save patient:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const handleViewPatient = (patient: Patient) => {
    setPatientToView(patient);
    onViewOpen();
  };

  const handleDeletePatient = (patient: Patient) => {
    setPatientToDelete(patient);
    onDeleteOpen();
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;

    try {
      await patientsAPI.delete(
        patientToDelete.patient_id || patientToDelete.id!.toString()
      );
      toast.success(t("patients.patient_deleted"));
      loadPatients();
      onDeleteClose();
      setPatientToDelete(null);
    } catch (error) {
      console.error("Failed to delete patient:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const renderCell = (patient: Patient, columnKey: string) => {
    switch (columnKey) {
      case "name":
        const firstName = patient.first_name?.trim() || "";
        const lastName = patient.last_name?.trim() || "";
        const fullName = `${firstName} ${lastName}`.trim();
        const tcNumber = patient.tc_number?.trim() || "";
        return (
          <div>
            <p className="font-medium">
              {fullName || t("patients.not_specified")}
            </p>
            <p className="text-sm text-gray-500">
              TC: {tcNumber || t("patients.not_specified")}
            </p>
          </div>
        );
      case "contact":
        const phone = patient.phone?.trim();
        const email = patient.email?.trim();
        return (
          <div>
            <p className="font-medium">
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {phone}
                </a>
              ) : (
                <span className="text-gray-400">{t("patients.no_phone")}</span>
              )}
            </p>
            <p className="text-sm text-gray-500">
              {email ? (
                <a
                  href={`mailto:${email}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {email}
                </a>
              ) : (
                <span className="text-gray-400">{t("patients.no_email")}</span>
              )}
            </p>
          </div>
        );
      case "details":
        const age = patient.date_of_birth
          ? calculateAge(patient.date_of_birth)
          : patient.age && patient.age > 0
            ? patient.age
            : null;

        const gender = translateGender(patient.gender || "");
        const ageText =
          age && age > 0
            ? `${age} ${t("patients.years_old")}`
            : t("patients.age_not_available");
        const bloodType =
          patient.blood_type?.trim() || t("patients.not_specified");

        return (
          <div>
            <p className="font-medium">
              {gender}, {ageText}
            </p>
            <p className="text-sm text-gray-500">
              {t("patients.blood_type")}: {bloodType}
            </p>
          </div>
        );
      case "created":
        // Debug log
        console.log(
          "Patient created_at:",
          patient.created_at,
          "Updated_at:",
          patient.updated_at
        );

        // Try multiple date fields
        const dateToUse = patient.created_at || patient.updated_at;

        if (!dateToUse) {
          return (
            <span className="text-gray-400 text-sm">
              {t("patients.recently_added")}
            </span>
          );
        }

        try {
          const formattedDate = formatDate(dateToUse);
          if (formattedDate === "Invalid Date") {
            return (
              <span className="text-gray-400 text-sm">
                {t("patients.recently_added")}
              </span>
            );
          }
          return (
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {formattedDate}
            </span>
          );
        } catch (error) {
          console.error(
            "Date formatting error:",
            error,
            "Raw date:",
            dateToUse
          );
          return (
            <span className="text-gray-400 text-sm">
              {t("patients.recently_added")}
            </span>
          );
        }
      case "actions":
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              color="secondary"
              variant="flat"
              onPress={() => handleViewPatient(patient)}
            >
              <Eye size={16} />
            </Button>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={() => handleEditPatient(patient)}
            >
              <Edit size={16} />
            </Button>
            {getPermissionLevel(user) >= 2 &&
              (patient.patient_id || patient.id) && (
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  onPress={() => handleDeletePatient(patient)}
                >
                  <Trash2 size={16} />
                </Button>
              )}
          </div>
        );
      default:
        return patient[columnKey as keyof Patient];
    }
  };

  const columns = [
    { key: "name", label: t("patients.patient_name") },
    { key: "contact", label: t("patients.contact_info") },
    { key: "details", label: t("patients.details") },
    { key: "created", label: t("patients.registered") },
    { key: "actions", label: t("patients.actions") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("patients.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("patients.subtitle")}
          </p>
        </div>
        <Button color="primary" onPress={handleAddPatient}>
          <Plus className="mr-2" size={20} />
          {t("patients.add_patient")}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
              placeholder={t("patients.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<Search size={16} />}
              isClearable
              onClear={() => setSearchTerm("")}
            />
            <div className="flex gap-2">
              <Button
                variant="flat"
                onPress={() => setShowFilters(!showFilters)}
                color={showFilters ? "primary" : "default"}
              >
                <ChevronDown
                  className={`mr-2 transition-transform ${showFilters ? "rotate-180" : ""}`}
                  size={16}
                />
                {t("patients.advanced_filters")}
              </Button>
              <Button
                variant="flat"
                color="warning"
                onPress={resetFilters}
                isDisabled={!searchTerm && !hasActiveFilters}
              >
                {t("patients.reset_filters")}
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Gender Filter */}
                <Select
                  label={t("patients.gender")}
                  placeholder={t("patients.all_genders")}
                  selectedKeys={filters.gender ? [filters.gender] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFilters((prev) => ({
                      ...prev,
                      gender: selectedKey || "",
                    }));
                  }}
                  size="sm"
                >
                  <SelectItem key="Male">{t("patients.male")}</SelectItem>
                  <SelectItem key="Female">{t("patients.female")}</SelectItem>
                  <SelectItem key="Other">{t("patients.other")}</SelectItem>
                </Select>

                {/* Blood Type Filter */}
                <Select
                  label={t("patients.blood_type")}
                  placeholder={t("patients.all_blood_types")}
                  selectedKeys={filters.bloodType ? [filters.bloodType] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFilters((prev) => ({
                      ...prev,
                      bloodType: selectedKey || "",
                    }));
                  }}
                  size="sm"
                >
                  <SelectItem key="A+">A+</SelectItem>
                  <SelectItem key="A-">A-</SelectItem>
                  <SelectItem key="B+">B+</SelectItem>
                  <SelectItem key="B-">B-</SelectItem>
                  <SelectItem key="AB+">AB+</SelectItem>
                  <SelectItem key="AB-">AB-</SelectItem>
                  <SelectItem key="O+">O+</SelectItem>
                  <SelectItem key="O-">O-</SelectItem>
                </Select>

                {/* Age Range */}
                <div className="flex gap-2">
                  <Input
                    label={t("patients.min_age")}
                    placeholder="18"
                    type="number"
                    value={filters.ageRange.min}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        ageRange: { ...prev.ageRange, min: e.target.value },
                      }))
                    }
                    size="sm"
                    min="0"
                    max="150"
                  />
                  <Input
                    label={t("patients.max_age")}
                    placeholder="85"
                    type="number"
                    value={filters.ageRange.max}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        ageRange: { ...prev.ageRange, max: e.target.value },
                      }))
                    }
                    size="sm"
                    min="0"
                    max="150"
                  />
                </div>

                {/* Has Allergies */}
                <Select
                  label={t("patients.allergies")}
                  placeholder={t("patients.all_patients")}
                  selectedKeys={
                    filters.hasAllergies ? [filters.hasAllergies] : []
                  }
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFilters((prev) => ({
                      ...prev,
                      hasAllergies: selectedKey || "",
                    }));
                  }}
                  size="sm"
                >
                  <SelectItem key="yes">
                    {t("patients.has_allergies")}
                  </SelectItem>
                  <SelectItem key="no">{t("patients.no_allergies")}</SelectItem>
                </Select>

                {/* Has Insurance */}
                <Select
                  label={t("patients.insurance_info")}
                  placeholder={t("patients.all_patients")}
                  selectedKeys={
                    filters.hasInsurance ? [filters.hasInsurance] : []
                  }
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFilters((prev) => ({
                      ...prev,
                      hasInsurance: selectedKey || "",
                    }));
                  }}
                  size="sm"
                >
                  <SelectItem key="yes">
                    {t("patients.has_insurance")}
                  </SelectItem>
                  <SelectItem key="no">{t("patients.no_insurance")}</SelectItem>
                </Select>

                {/* City Filter */}
                <Select
                  label={t("patients.city")}
                  placeholder={t("patients.all_cities")}
                  selectedKeys={filters.city ? [filters.city] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFilters((prev) => ({
                      ...prev,
                      city: selectedKey || "",
                    }));
                  }}
                  size="sm"
                >
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </Select>

                {/* Sort By */}
                <Select
                  label={t("patients.sort_by")}
                  selectedKeys={[filters.sortBy]}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFilters((prev) => ({ ...prev, sortBy: selectedKey }));
                  }}
                  size="sm"
                >
                  <SelectItem key="name">{t("patients.name")}</SelectItem>
                  <SelectItem key="age">{t("patients.age")}</SelectItem>
                  <SelectItem key="created">
                    {t("patients.registration_date")}
                  </SelectItem>
                  <SelectItem key="gender">{t("patients.gender")}</SelectItem>
                </Select>

                {/* Sort Order */}
                <Select
                  label={t("patients.sort_order")}
                  selectedKeys={[filters.sortOrder]}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setFilters((prev) => ({ ...prev, sortOrder: selectedKey }));
                  }}
                  size="sm"
                >
                  <SelectItem key="asc">{t("patients.ascending")}</SelectItem>
                  <SelectItem key="desc">{t("patients.descending")}</SelectItem>
                </Select>
              </div>

              {/* Filter Summary */}
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (
                    !value ||
                    (typeof value === "object" &&
                      Object.values(value).every((v) => !v))
                  )
                    return null;

                  let displayValue = value;
                  if (key === "ageRange" && (value.min || value.max)) {
                    displayValue = `${value.min || "0"}-${value.max || "∞"} ${t("patients.years_old")}`;
                  } else if (key === "hasAllergies") {
                    displayValue =
                      value === "yes"
                        ? t("patients.has_allergies")
                        : t("patients.no_allergies");
                  } else if (key === "hasInsurance") {
                    displayValue =
                      value === "yes"
                        ? t("patients.has_insurance")
                        : t("patients.no_insurance");
                  } else if (key === "sortBy" || key === "sortOrder") {
                    return null; // Don't show sort options as chips
                  }

                  return (
                    <div
                      key={key}
                      className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      <span className="capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}: {displayValue}
                      </span>
                      <button
                        onClick={() => {
                          if (key === "ageRange") {
                            setFilters((prev) => ({
                              ...prev,
                              ageRange: { min: "", max: "" },
                            }));
                          } else {
                            setFilters((prev) => ({ ...prev, [key]: "" }));
                          }
                        }}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {hasActiveFilters || searchTerm ? (
              <>
                {t("patients.showing_filtered_results", {
                  filtered: filteredCount.toString(),
                  total: totalPatientsCount.toString(),
                })}
                {totalPages > 1 &&
                  ` (${t("common.page")} ${currentPage}/${totalPages})`}
                {searchTerm &&
                  ` - ${t("patients.searching_for", { term: searchTerm })}`}
              </>
            ) : (
              t("patients.showing_results", {
                count: patients.length.toString(),
                page: currentPage.toString(),
                total: totalPages.toString(),
              })
            )}
          </div>
        </CardBody>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Patients table">
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={t("patients.loading_patients")}
              emptyContent={
                searchTerm || hasActiveFilters
                  ? t("patients.no_patients_search")
                  : t("patients.no_patients")
              }
            >
              {filteredPatients.map((patient) => (
                <TableRow key={patient.patient_id || patient.id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(patient, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPatients.length > 0 && totalPages > 1 && (
            <div className="flex justify-center p-4">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Patient Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {isAddMode ? t("patients.add_patient") : t("patients.edit_patient")}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t("patients.first_name")}
                placeholder={t("patients.enter_first_name")}
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                isRequired
                errorMessage={
                  !formData.first_name?.trim() && formData.first_name !== ""
                    ? t("patients.first_name_required")
                    : ""
                }
              />
              <Input
                label={t("patients.last_name")}
                placeholder={t("patients.enter_last_name")}
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                isRequired
                errorMessage={
                  !formData.last_name?.trim() && formData.last_name !== ""
                    ? t("patients.last_name_required")
                    : ""
                }
              />
              <Input
                label={t("patients.tc_number")}
                placeholder={t("patients.enter_tc_number")}
                value={formData.tc_number}
                onChange={(e) => {
                  // Sadece rakam karakterlerine izin ver ve 11 hane ile sınırla
                  const value = e.target.value
                    .replace(/[^0-9]/g, "")
                    .slice(0, 11);
                  setFormData({ ...formData, tc_number: value });
                }}
                isRequired
                maxLength={11}
                errorMessage={
                  formData.tc_number && !/^\d{11}$/.test(formData.tc_number)
                    ? t("patients.tc_number_invalid")
                    : !formData.tc_number?.trim() && formData.tc_number !== ""
                      ? t("patients.tc_number_required")
                      : ""
                }
              />
              <DatePicker
                label={t("patients.date_of_birth")}
                value={
                  formData.date_of_birth
                    ? parseDate(toDateString(formData.date_of_birth) || "")
                    : null
                }
                onChange={(value: any) => {
                  const dateString = value ? value.toString() : "";
                  setFormData({ ...formData, date_of_birth: dateString });
                }}
                isRequired
                description={t("patients.date_of_birth")}
                className="w-full"
                maxValue={parseDate(new Date().toISOString().split("T")[0])}
                showMonthAndYearPickers
              />
              <Select
                label={t("patients.gender")}
                placeholder={t("patients.select_gender")}
                selectedKeys={formData.gender ? [formData.gender] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData({ ...formData, gender: selectedKey });
                }}
              >
                <SelectItem key="Male">{t("patients.male")}</SelectItem>
                <SelectItem key="Female">{t("patients.female")}</SelectItem>
                <SelectItem key="Other">{t("patients.other")}</SelectItem>
              </Select>
              <Input
                label={t("patients.phone")}
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  // Sadece rakam, +, -, (, ), boşluk karakterlerine izin ver
                  const value = e.target.value.replace(/[^0-9+\-() ]/g, "");
                  setFormData({ ...formData, phone: value });
                }}
                isRequired
                placeholder={t("patients.enter_phone")}
              />
              <Input
                label={t("patients.email")}
                type="email"
                placeholder={t("patients.enter_email")}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <Select
                label={t("patients.blood_type")}
                placeholder={t("patients.select_blood_type")}
                selectedKeys={formData.blood_type ? [formData.blood_type] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setFormData({ ...formData, blood_type: selectedKey });
                }}
              >
                <SelectItem key="A+">A+</SelectItem>
                <SelectItem key="A-">A-</SelectItem>
                <SelectItem key="B+">B+</SelectItem>
                <SelectItem key="B-">B-</SelectItem>
                <SelectItem key="AB+">AB+</SelectItem>
                <SelectItem key="AB-">AB-</SelectItem>
                <SelectItem key="O+">O+</SelectItem>
                <SelectItem key="O-">O-</SelectItem>
              </Select>
              <Input
                label={t("patients.insurance_info")}
                placeholder={t("patients.enter_insurance")}
                value={formData.insurance_info}
                onChange={(e) =>
                  setFormData({ ...formData, insurance_info: e.target.value })
                }
              />
              <Input
                label={t("patients.emergency_contact_name")}
                placeholder={t("patients.enter_emergency_contact")}
                value={formData.emergency_contact_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergency_contact_name: e.target.value,
                  })
                }
                className="md:col-span-1"
              />
              <Input
                label={t("patients.emergency_contact_phone")}
                type="tel"
                placeholder={t("patients.enter_emergency_phone")}
                value={formData.emergency_contact_phone}
                onChange={(e) => {
                  // Sadece rakam, +, -, (, ), boşluk karakterlerine izin ver
                  const value = e.target.value.replace(/[^0-9+\-() ]/g, "");
                  setFormData({ ...formData, emergency_contact_phone: value });
                }}
                className="md:col-span-1"
              />
              <Input
                label={t("patients.address")}
                placeholder={t("patients.enter_address")}
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="md:col-span-2"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {isAddMode
                ? t("patients.add_patient")
                : t("patients.edit_patient")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Patient Details Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={onViewClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {t("patients.patient_details")} - {patientToView?.first_name}{" "}
            {patientToView?.last_name}
          </ModalHeader>
          <ModalBody>
            {patientToView && (
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    {t("patients.personal_information")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.first_name")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {patientToView.first_name ||
                          t("patients.not_specified")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.last_name")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {patientToView.last_name || t("patients.not_specified")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.date_of_birth")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {patientToView.date_of_birth
                          ? formatDate(patientToView.date_of_birth)
                          : t("patients.not_specified")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.age")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {patientToView.date_of_birth
                          ? `${calculateAge(patientToView.date_of_birth)} ${t("patients.years_old")}`
                          : t("patients.age_not_available")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.gender")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {translateGender(patientToView.gender || "")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.blood_type")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {patientToView.blood_type ||
                          t("patients.not_specified")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    {t("patients.contact_information")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.phone")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {patientToView.phone ? (
                          <a
                            href={`tel:${patientToView.phone}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {patientToView.phone}
                          </a>
                        ) : (
                          t("patients.not_specified")
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.email")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {patientToView.email ? (
                          <a
                            href={`mailto:${patientToView.email}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {patientToView.email}
                          </a>
                        ) : (
                          t("patients.not_specified")
                        )}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.address")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {patientToView.address || t("patients.not_specified")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    {t("patients.emergency_contact")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.emergency_contact_name")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {patientToView.emergency_contact_name ||
                          t("patients.not_specified")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.emergency_contact_phone")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {patientToView.emergency_contact_phone ? (
                          <a
                            href={`tel:${patientToView.emergency_contact_phone}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {patientToView.emergency_contact_phone}
                          </a>
                        ) : (
                          t("patients.not_specified")
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    {t("patients.medical_information")}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.allergies")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {patientToView.allergies || t("patients.no_allergies")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.insurance_info")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {patientToView.insurance_info ||
                          t("patients.no_insurance")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Registration Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                    {t("patients.registration_information")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.registration_date")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {patientToView.created_at
                          ? formatDate(patientToView.created_at)
                          : t("patients.recently_added")}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t("patients.last_updated")}
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {patientToView.updated_at
                          ? formatDate(patientToView.updated_at)
                          : t("patients.not_specified")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onViewClose}>
              {t("common.close")}
            </Button>
            <Button
              color="secondary"
              onPress={() => {
                onViewClose();
                if (patientToView) {
                  handleEditPatient(patientToView);
                }
              }}
            >
              <Edit size={16} className="mr-2" />
              {t("patients.edit_patient")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader className="text-danger">
            {t("patients.delete_patient")}
          </ModalHeader>
          <ModalBody>
            <p>
              {t("patients.delete_confirmation")}{" "}
              <strong>
                {patientToDelete?.first_name} {patientToDelete?.last_name}
              </strong>
              ?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onDeleteClose}>
              {t("common.cancel")}
            </Button>
            <Button color="danger" onPress={confirmDeletePatient}>
              {t("patients.delete_patient")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
