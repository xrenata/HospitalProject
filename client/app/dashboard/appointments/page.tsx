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
  Chip,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { DatePicker } from "@heroui/date-picker";
import { parseDate } from "@internationalized/date";
import { Calendar, Search, Trash2, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import { appointmentsAPI, patientsAPI, staffAPI, departmentsAPI } from "@/lib/api";
import { Appointment, Patient, Staff } from "@/types";
import {
  formatDate,
  formatTime,
  getPermissionLevel,
  toDateString,
} from "@/lib/utils";
import toast from "react-hot-toast";
import PatientAutocomplete from "@/components/PatientAutocomplete";
import TimeWheelPicker from "@/components/TimeWheelPicker";

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // Form state for adding/editing appointments
  const [formData, setFormData] = useState({
    patient_id: "",
    staff_id: "",
    department_id: "",
    appointment_date: "",
    appointment_time: "",
    reason: "",
    notes: "",
  });

  // Debug form data changes
  useEffect(() => {
    console.log("Form data changed:", formData);
  }, [formData]);

  // Selected patient for display
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Mock data for demonstration
  const mockAppointments: Appointment[] = [
    {
      appointment_id: "1",
      id: 1,
      patient_id: "1",
      staff_id: "2",
      appointment_date: "2024-02-15T10:00:00Z",
      appointment_time: "10:00",
      reason: "Annual checkup",
      status: "scheduled",
      notes: "Regular health examination",
      created_at: "2024-01-20T08:00:00Z",
      updated_at: "2024-01-20T08:00:00Z",
    },
    {
      appointment_id: "2",
      id: 2,
      patient_id: "2",
      staff_id: "3",
      appointment_date: "2024-02-15T14:30:00Z",
      appointment_time: "14:30",
      reason: "Follow-up consultation",
      status: "completed",
      notes: "Blood pressure check completed",
      created_at: "2024-01-15T09:00:00Z",
      updated_at: "2024-01-28T15:00:00Z",
    },
    {
      appointment_id: "3",
      id: 3,
      patient_id: "3",
      staff_id: "2",
      appointment_date: "2024-02-16T09:15:00Z",
      appointment_time: "09:15",
      reason: "Emergency consultation",
      status: "cancelled",
      notes: "Patient cancelled due to illness",
      created_at: "2024-02-10T11:00:00Z",
      updated_at: "2024-02-10T11:00:00Z",
    },
    {
      appointment_id: "4",
      id: 4,
      patient_id: "1",
      staff_id: "4",
      appointment_date: "2024-02-17T11:00:00Z",
      appointment_time: "11:00",
      reason: "Vaccination",
      status: "scheduled",
      notes: "Annual flu vaccination",
      created_at: "2024-02-05T10:00:00Z",
      updated_at: "2024-02-05T10:00:00Z",
    },
  ];

  const mockPatients: Patient[] = [
    {
      patient_id: "1",
      name: "John Doe",
      email: "john.doe@email.com",
      age: 39,
    },
    {
      patient_id: "2",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      age: 32,
    },
    {
      patient_id: "3",
      name: "Michael Brown",
      email: "michael.brown@email.com",
      age: 46,
    },
  ];

  const mockStaff: Staff[] = [
    {
      staff_id: "2",
      name: "Dr. Smith",
      role: "Doctor",
      department_id: "1",
      email: "dr.smith@hospital.com",
      phone: "+1-555-0200",
      hire_date: "2020-01-15",
      status: "active",
    },
    {
      staff_id: "3",
      name: "Dr. Johnson",
      role: "Doctor",
      department_id: "2",
      email: "dr.johnson@hospital.com",
      phone: "+1-555-0201",
      hire_date: "2019-03-20",
      status: "active",
    },
    {
      staff_id: "4",
      name: "Nurse Williams",
      role: "Nurse",
      department_id: "1",
      email: "nurse.williams@hospital.com",
      phone: "+1-555-0202",
      hire_date: "2021-06-10",
      status: "active",
    },
  ];

  useEffect(() => {
    loadAppointments();
    loadPatients();
    loadStaff();
    loadDepartments();
  }, [currentPage, searchTerm, statusFilter]);

  // Handle URL action parameter (e.g., from Quick Actions)
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      handleAddAppointment();
      // Clear the URL parameter
      router.replace("/dashboard/appointments");
    }
  }, [searchParams]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const queryParams: any = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
      };

      // Add status filter
      if (statusFilter && statusFilter !== "all") {
        queryParams.status = statusFilter;
      }

      const response = await appointmentsAPI.getAll(queryParams);
      console.log("Appointments API Response:", response.data);

      // Handle new API response structure
      if (response.data.appointments) {
        console.log("Using appointments from API:", response.data.appointments);
        setAppointments(response.data.appointments);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        // Fallback for old API structure
        console.log("Using direct array from API:", response.data);
        setAppointments(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      } else {
        // If no data from API, use mock data
        console.log("Using mock appointments data");
        setAppointments(mockAppointments);
        setTotalPages(Math.ceil(mockAppointments.length / 10));
      }
    } catch (error) {
      console.error("Failed to load appointments:", error);
      // Fallback to mock data
      setAppointments(mockAppointments);
      setTotalPages(Math.ceil(mockAppointments.length / 10));
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await patientsAPI.getAll({ limit: 1000 }); // Get all patients for dropdown
      console.log("Patients API Response:", response.data);

      // Handle new API response structure
      if (response.data.patients) {
        const patientsData = response.data.patients.map((patient: any) => ({
          patient_id: patient.patient_id || patient._id,
          _id: patient._id,
          name: `${patient.first_name || patient.firstName || ""} ${patient.last_name || patient.lastName || ""}`.trim(),
          first_name: patient.first_name || patient.firstName,
          last_name: patient.last_name || patient.lastName,
          firstName: patient.firstName || patient.first_name,
          lastName: patient.lastName || patient.last_name,
          tc_number: patient.tc_number || patient.tcNumber,
          tcNumber: patient.tcNumber || patient.tc_number,
          email: patient.email,
          phone: patient.phone,
          age: patient.age,
        }));
        console.log("Transformed patients data:", patientsData);
        setPatients(patientsData.length > 0 ? patientsData : mockPatients);
      } else if (Array.isArray(response.data)) {
        // Fallback for old API structure
        console.log("Using direct patients array:", response.data);
        setPatients(response.data.length > 0 ? response.data : mockPatients);
      } else {
        console.log("Using mock patients");
        setPatients(mockPatients);
      }
    } catch (error) {
      console.error("Failed to load patients:", error);
      setPatients(mockPatients);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await staffAPI.getAll();
      console.log("Staff API Full Response:", response);
      console.log("Staff API Response Data:", response.data);

      // Handle API response structure - API returns { data: [...] }
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log("Processing wrapped staff data:", response.data.data);
        const staffData = response.data.data.map((staff: any) => {
          console.log("Processing staff member:", staff);
          return {
            staff_id: (staff._id ? staff._id.toString() : "") || staff.staff_id || "",
            _id: staff._id ? staff._id.toString() : "",
            name: staff.name || "",
            role: staff.role || "",
            department_id: (staff.department_id?._id ? staff.department_id._id.toString() : "") || 
                          (staff.department_id ? staff.department_id.toString() : "") || 
                          staff.department_id || "",
            email: staff.email || "",
            phone: staff.phone || "",
            specialization: staff.specialization || "",
            hire_date: staff.hire_date || "",
            status: staff.status || "active",
          };
        });
        console.log("Transformed Staff Data:", staffData);
        setStaff(staffData);
      } else if (Array.isArray(response.data)) {
        // Fallback for direct array response
        console.log("Processing direct staff array:", response.data);
        const staffData = response.data.map((staff: any) => {
          console.log("Processing staff member (direct):", staff);
          return {
            staff_id: (staff._id ? staff._id.toString() : "") || staff.staff_id || "",
            _id: staff._id ? staff._id.toString() : "",
            name: staff.name || "",
            role: staff.role || "",
            department_id: (staff.department_id?._id ? staff.department_id._id.toString() : "") || 
                          (staff.department_id ? staff.department_id.toString() : "") || 
                          staff.department_id || "",
            email: staff.email || "",
            phone: staff.phone || "",
            specialization: staff.specialization || "",
            hire_date: staff.hire_date || "",
            status: staff.status || "active",
          };
        });
        console.log("Transformed Staff Data (direct):", staffData);
        setStaff(staffData);
      } else {
        console.log("No valid staff data found, using mock data");
        console.log("Response structure:", response.data);
        setStaff(mockStaff);
      }
    } catch (error) {
      console.error("Failed to load staff:", error);
      console.error("Error details:", error);
      setStaff(mockStaff);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentsAPI.getAll();
      console.log("Departments API Response:", response.data);
      
      if (Array.isArray(response.data)) {
        const departmentsData = response.data.map((dept: any) => ({
          department_id: (dept._id ? dept._id.toString() : "") || dept.department_id || "",
          _id: dept._id ? dept._id.toString() : "",
          name: dept.name || "",
          description: dept.description || "",
          status: dept.status || "active",
        }));
        console.log("Transformed Departments Data:", departmentsData);
        setDepartments(departmentsData);
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Handle wrapped response format
        const departmentsData = response.data.data.map((dept: any) => ({
          department_id: (dept._id ? dept._id.toString() : "") || dept.department_id || "",
          _id: dept._id ? dept._id.toString() : "",
          name: dept.name || "",
          description: dept.description || "",
          status: dept.status || "active",
        }));
        console.log("Transformed Departments Data (wrapped):", departmentsData);
        setDepartments(departmentsData);
      } else {
        console.log("No departments data from API, setting empty array");
        setDepartments([]);
      }
    } catch (error) {
      console.error("Failed to load departments:", error);
      console.error("Error details:", error);
      setDepartments([]);
    }
  };

  const handleAddAppointment = () => {
    setIsAddMode(true);
    setSelectedAppointment(null);
    setFormData({
      patient_id: "",
      staff_id: "",
      department_id: "",
      appointment_date: "",
      appointment_time: "",
      reason: "",
      notes: "",
    });
    setSelectedPatient(null);
    onOpen();
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setIsAddMode(false);
    setSelectedAppointment(appointment);

    const appointmentDate =
      appointment.appointment_date || appointment.appointmentDate;
    const appointmentTime =
      appointment.appointment_time || appointment.appointmentTime;

    // Find the patient for the appointment
    const patient = patients.find(p => p.patient_id === (appointment.patient_id || appointment.patientId));
    setSelectedPatient(patient || null);

    setFormData({
      patient_id: appointment.patient_id || appointment.patientId || "",
      staff_id: appointment.staff_id || appointment.staffId || "",
      department_id: appointment.department_id || appointment.departmentId || "",
      appointment_date: appointmentDate ? appointmentDate.split("T")[0] : "",
      appointment_time: appointmentTime || "",
      reason: appointment.reason || "",
      notes: appointment.notes || "",
    });

    onOpen();
  };

  const handleSubmit = async () => {
    console.log("Form data on submit:", formData);
    console.log("Selected patient:", selectedPatient);
    
    try {
      // Validate required fields
      if (!formData.patient_id) {
        toast.error("Lütfen bir hasta seçin");
        return;
      }
      if (!formData.department_id) {
        toast.error("Lütfen bir departman seçin");
        return;
      }
      if (!formData.staff_id) {
        toast.error("Lütfen bir doktor/personel seçin");
        return;
      }
      if (!formData.appointment_date) {
        toast.error("Lütfen randevu tarihini seçin");
        return;
      }
      if (!formData.appointment_time) {
        toast.error("Lütfen randevu saatini seçin");
        return;
      }
      if (!formData.reason.trim()) {
        toast.error("Lütfen randevu sebebini girin");
        return;
      }

      // Convert form data to API format
      const apiData = {
        patient_id: formData.patient_id,
        staff_id: formData.staff_id,
        department_id: formData.department_id,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        reason: formData.reason.trim(),
        notes: formData.notes.trim(),
      };

      if (isAddMode) {
        await appointmentsAPI.create(apiData);
        toast.success("Randevu başarıyla oluşturuldu!");
      } else {
        const appointmentId = selectedAppointment!.appointment_id ||
          selectedAppointment!._id ||
          (selectedAppointment!.id ? selectedAppointment!.id.toString() : "");
        
        console.log("Updating appointment with ID:", appointmentId);
        console.log("Selected appointment:", selectedAppointment);
        
        if (!appointmentId) {
          toast.error("Randevu ID bulunamadı!");
          return;
        }
        
        await appointmentsAPI.update(appointmentId, apiData);
        toast.success("Randevu başarıyla güncellendi!");
      }
      onClose();
      loadAppointments();
    } catch (error: any) {
      console.error("Failed to save appointment:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Randevu kaydedilirken bir hata oluştu";
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (
    appointmentId: string,
    newStatus: "scheduled" | "completed" | "cancelled" | "no-show"
  ) => {
    try {
      await appointmentsAPI.update(appointmentId, { status: newStatus });
      toast.success(t("appointments.status_updated", { status: newStatus }));
      loadAppointments();
    } catch (error) {
      console.error("Failed to update appointment status:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (confirm(t("appointments.delete_confirmation"))) {
      try {
        await appointmentsAPI.delete(appointmentId);
        toast.success(t("appointments.appointment_deleted"));
        loadAppointments();
      } catch (error) {
        console.error("Failed to delete appointment:", error);
        toast.error(t("common.error_saving"));
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "primary";
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      case "no-show":
        return "warning";
      default:
        return "default";
    }
  };

  const getPatientName = (patientId: string) => {
    console.log("Getting patient name for ID:", patientId);
    console.log("Available patients:", patients);
    
    if (!Array.isArray(patients) || patients.length === 0) {
      return "Loading...";
    }
    
    const patient = patients.find(
      (p) => (p.patient_id === patientId) || (p._id === patientId)
    );
    
    console.log("Found patient:", patient);
    
    if (patient) {
      const name = patient.name || `${patient.first_name || patient.firstName || ""} ${patient.last_name || patient.lastName || ""}`.trim();
      console.log("Patient name:", name);
      return name || "İsimsiz Hasta";
    }
    
    return "Bilinmeyen Hasta";
  };

  const getStaffName = (staffId: string) => {
    console.log("Getting staff name for ID:", staffId);
    console.log("Available staff:", staff);
    
    if (!Array.isArray(staff) || staff.length === 0) {
      return "Loading...";
    }
    
    const staffMember = staff.find(
      (s) => (s.staff_id === staffId) || (s._id === staffId)
    );
    
    console.log("Found staff:", staffMember);
    
    if (staffMember) {
      const name = staffMember.name || "İsimsiz Personel";
      console.log("Staff name:", name);
      return name;
    }
    
    return "Bilinmeyen Personel";
  };

  const renderCell = (appointment: Appointment, columnKey: string) => {
    switch (columnKey) {
      case "patient":
        const patientData = appointment.patient_id || appointment.patientId;
        console.log("Patient data in table:", patientData);
        
        // If it's a populated object, use it directly
        if (typeof patientData === 'object' && patientData !== null) {
          const patientObj = patientData as any;
          const firstName = patientObj.firstName || patientObj.first_name || "";
          const lastName = patientObj.lastName || patientObj.last_name || "";
          return `${firstName} ${lastName}`.trim() || "İsimsiz Hasta";
        }
        // If it's a string ID, use the lookup function
        else if (typeof patientData === 'string') {
          return getPatientName(patientData);
        }
        return "Bilinmeyen Hasta";
        
      case "staff":
        const staffData = appointment.staff_id || appointment.staffId;
        console.log("Staff data in table:", staffData);
        
        // If it's a populated object, use it directly
        if (typeof staffData === 'object' && staffData !== null) {
          const staffObj = staffData as any;
          return staffObj.name || "İsimsiz Personel";
        }
        // If it's a string ID, use the lookup function
        else if (typeof staffData === 'string') {
          return getStaffName(staffData);
        }
        return "Bilinmeyen Personel";
      case "datetime":
        const appointmentDate =
          appointment.appointment_date || appointment.appointmentDate;
        const appointmentTime =
          appointment.appointment_time || appointment.appointmentTime;
        return (
          <div>
            <p>{formatDate(appointmentDate || "")}</p>
            <p className="text-sm text-gray-500">{appointmentTime || ""}</p>
          </div>
        );
      case "reason":
        return appointment.reason || "N/A";
      case "status":
        return (
          <Chip 
            color={getStatusColor(appointment.status || "scheduled")} 
            size="sm"
            classNames={{
              content: "text-xs font-medium"
            }}
          >
            {appointment.status || "scheduled"}
          </Chip>
        );
      case "actions":
        const appointmentId =
          appointment.appointment_id ||
          appointment._id ||
          (appointment.id ? appointment.id.toString() : "") ||
          "";
        return (
          <div className="flex gap-2 items-center">
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={() => handleEditAppointment(appointment)}
            >
              <Edit size={16} />
            </Button>
            {getPermissionLevel(user) >= 2 && (
              <>
                <Select
                  size="sm"
                  placeholder="Status"
                  className="w-28 min-w-28"
                  selectedKeys={appointment.status ? [appointment.status] : []}
                  onSelectionChange={(keys) => {
                    const newStatus = Array.from(keys)[0] as string;
                    if (newStatus !== appointment.status) {
                      handleStatusChange(appointmentId || "", newStatus as any);
                    }
                  }}
                  classNames={{
                    value: "text-xs",
                    trigger: "min-h-unit-8"
                  }}
                >
                  <SelectItem key="scheduled">
                    {t("appointments.scheduled")}
                  </SelectItem>
                  <SelectItem key="completed">
                    {t("appointments.completed")}
                  </SelectItem>
                  <SelectItem key="cancelled">
                    {t("appointments.cancelled")}
                  </SelectItem>
                  <SelectItem key="no-show">
                    {t("appointments.no_show")}
                  </SelectItem>
                </Select>
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  onPress={() => handleDeleteAppointment(appointmentId || "")}
                >
                  <Trash2 size={16} />
                </Button>
              </>
            )}
          </div>
        );
      default:
        return appointment[columnKey as keyof Appointment];
    }
  };

  const columns = [
    { key: "patient", label: t("appointments.patient") },
    { key: "staff", label: t("appointments.staff_member") },
    {
      key: "datetime",
      label:
        t("appointments.appointment_date") +
        " & " +
        t("appointments.appointment_time"),
    },
    { key: "reason", label: t("appointments.reason") },
    { key: "status", label: t("common.status") },
    { key: "actions", label: t("common.actions") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("appointments.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("appointments.subtitle")}
          </p>
        </div>
        <Button color="primary" onPress={handleAddAppointment}>
          <Calendar className="mr-2" size={20} />
          {t("appointments.schedule_appointment")}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder={t("appointments.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<Search size={16} />}
            />
            <Select
              placeholder={t("appointments.filter_by_status")}
              className="sm:w-48"
              selectedKeys={statusFilter !== "all" ? [statusFilter] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                setStatusFilter(selectedKey || "all");
              }}
            >
              <SelectItem key="all">{t("appointments.all_status")}</SelectItem>
              <SelectItem key="scheduled">
                {t("appointments.scheduled")}
              </SelectItem>
              <SelectItem key="completed">
                {t("appointments.completed")}
              </SelectItem>
              <SelectItem key="cancelled">
                {t("appointments.cancelled")}
              </SelectItem>
              <SelectItem key="no-show">{t("appointments.no_show")}</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardBody className="p-0">
          <Table 
            aria-label="Appointments table"
            classNames={{
              td: "py-3",
              th: "py-3",
              tr: "border-b border-divider"
            }}
          >
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {Array.isArray(appointments) && appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <TableRow key={appointment.id || appointment.appointment_id}>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {renderCell(appointment, column.key)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-8"
                  >
                    {loading
                      ? t("appointments.loading_appointments")
                      : t("appointments.no_appointments")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {Array.isArray(appointments) && appointments.length > 0 && (
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

      {/* Add/Edit Appointment Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {isAddMode
              ? t("appointments.schedule_new_appointment")
              : t("appointments.edit_appointment")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Hasta seçimi - tek satırda büyük */}
              <div className="w-full">
                <PatientAutocomplete
                  label={t("appointments.patient")}
                  placeholder={t("appointments.search_patient_placeholder")}
                  value={selectedPatient ? `${selectedPatient.firstName || selectedPatient.first_name} ${selectedPatient.lastName || selectedPatient.last_name} (TC: ${selectedPatient.tcNumber || selectedPatient.tc_number})` : ""}
                  onSelect={(patient) => {
                    console.log("Patient selected in form:", patient);
                    setSelectedPatient(patient);
                    const patientId = patient.patient_id || patient._id || "";
                    console.log("Setting patient_id:", patientId);
                    setFormData({ ...formData, patient_id: patientId });
                  }}
                  isRequired
                  errorMessage={!formData.patient_id ? t("appointments.patient_required") : ""}
                />
              </div>

              {/* Diğer alanlar - grid yapısında */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <Select
                  label="Departman"
                  placeholder="Departman seçin"
                  selectionMode="single"
                  selectedKeys={formData.department_id ? [formData.department_id] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    console.log("Department selected:", selectedKey);
                    setFormData({ 
                      ...formData, 
                      department_id: selectedKey || "",
                      staff_id: "" // Reset staff selection when department changes
                    });
                  }}
                  isRequired
                  errorMessage={!formData.department_id ? "Lütfen bir departman seçin" : ""}
                  className="w-full"
                >
                  {Array.isArray(departments) && departments.length > 0 ? (
                    departments
                      .filter(dept => dept.status === 'active')
                      .map((department) => (
                        <SelectItem 
                          key={department.department_id || department._id}
                        >
                          {department.name}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem key="loading" isDisabled>
                      Departmanlar yükleniyor...
                    </SelectItem>
                  )}
                </Select>

                <Select
                  label={t("appointments.staff_member")}
                  placeholder={formData.department_id ? "Doktor/Personel seçin" : "Önce departman seçin"}
                  selectionMode="single"
                  selectedKeys={(() => {
                    const keys = formData.staff_id ? [formData.staff_id] : [];
                    console.log("Staff dropdown selectedKeys:", {
                      staff_id: formData.staff_id,
                      keys: keys,
                      keysSet: new Set(keys)
                    });
                    return keys;
                  })()}
                  onSelectionChange={(keys) => {
                    console.log("Staff selection changed:");
                    console.log("- Raw keys:", keys);
                    console.log("- Keys type:", typeof keys);
                    console.log("- Keys constructor:", keys.constructor.name);
                    console.log("- Keys size:", keys instanceof Set ? keys.size : 'not a set');
                    
                    if (keys === "all") return;
                    
                    const selectedKey = Array.from(keys as Set<string>)[0];
                    console.log("- Converted selected key:", selectedKey);
                    console.log("- Current staff_id:", formData.staff_id);
                    
                    if (selectedKey && selectedKey !== formData.staff_id && selectedKey !== "no-staff") {
                      const newFormData = { ...formData, staff_id: selectedKey };
                      console.log("- Updating form data:", newFormData);
                      setFormData(newFormData);
                    }
                  }}
                  isRequired
                  isDisabled={!formData.department_id}
                  errorMessage={!formData.staff_id ? "Lütfen bir doktor/personel seçin" : ""}
                  className="w-full"
                >
                  {(() => {
                    console.log("Rendering staff dropdown...");
                    console.log("Staff array:", staff);
                    console.log("Staff length:", staff?.length);
                    console.log("Selected department_id:", formData.department_id);
                    
                    if (!Array.isArray(staff) || staff.length === 0) {
                      console.log("No staff data available");
                      return (
                        <SelectItem key="loading" isDisabled>
                          Personel yükleniyor...
                        </SelectItem>
                      );
                    }
                    
                    if (!formData.department_id) {
                      console.log("No department selected");
                      return (
                        <SelectItem key="no-dept" isDisabled>
                          Önce departman seçin
                        </SelectItem>
                      );
                    }
                    
                    const filteredStaff = staff.filter(staffMember => {
                      console.log(`Checking staff: ${staffMember.name}, dept: ${staffMember.department_id}, status: ${staffMember.status}`);
                      return staffMember.status === 'active' && 
                             staffMember.department_id === formData.department_id;
                    });
                    
                    console.log("Filtered staff:", filteredStaff);
                    
                    if (filteredStaff.length === 0) {
                      return (
                        <SelectItem key="no-staff" isDisabled>
                          Bu departmanda personel bulunamadı
                        </SelectItem>
                      );
                    }
                    
                    return filteredStaff.map((staffMember) => {
                      // Tutarlı key kullanımı: önce _id, sonra staff_id
                      const itemKey = (staffMember._id || staffMember.staff_id || "").toString();
                      const displayText = `${staffMember.name} (${staffMember.role})${
                        staffMember.specialization ? ` - ${staffMember.specialization}` : ''
                      }`;
                      
                      console.log(`Creating SelectItem:`, {
                        name: staffMember.name,
                        key: itemKey,
                        _id: staffMember._id,
                        staff_id: staffMember.staff_id,
                        displayText
                      });
                      
                      return (
                        <SelectItem 
                          key={itemKey}
                        >
                          {displayText}
                        </SelectItem>
                      );
                    });
                  })()}
                </Select>

                <DatePicker
                  label={t("appointments.appointment_date")}
                  value={
                    formData.appointment_date
                      ? parseDate(formData.appointment_date.split('T')[0])
                      : null
                  }
                  onChange={(value: any) => {
                    if (value) {
                      const dateString = `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
                      setFormData({ ...formData, appointment_date: dateString });
                    } else {
                      setFormData({ ...formData, appointment_date: "" });
                    }
                  }}
                  isRequired
                  errorMessage={!formData.appointment_date ? "Lütfen bir tarih seçin" : ""}
                  description="Randevu tarihini seçin"
                  className="w-full"
                  minValue={parseDate(new Date().toISOString().split('T')[0])}
                />

                <TimeWheelPicker
                  label={t("appointments.appointment_time")}
                  value={formData.appointment_time}
                  onChange={(timeValue) => {
                    console.log("Time selected:", timeValue);
                    setFormData({ ...formData, appointment_time: timeValue });
                  }}
                  isRequired
                  errorMessage={!formData.appointment_time ? "Lütfen bir saat seçin" : ""}
                  description="Randevu saatini seçin (09:00-17:00 arası)"
                  min="09:00"
                  max="17:00"
                  className="w-full"
                />
              </div>

              {/* Tam genişlik alanlar */}
              <Input
                label={t("appointments.reason")}
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Örn: Rutin kontrol, şikayet muayenesi..."
                isRequired
                errorMessage={!formData.reason ? "Lütfen randevu sebebini girin" : ""}
                description="Randevu sebebini kısaca açıklayın"
              />

              <Textarea
                label={t("common.notes")}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder={t("appointments.notes_placeholder")}
                rows={3}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {isAddMode
                ? t("appointments.schedule_appointment")
                : t("appointments.update_appointment")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
