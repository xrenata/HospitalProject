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
import { Pill, Search, Trash2, Edit, Plus, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import { prescriptionsAPI, patientsAPI, staffAPI, medicationsAPI } from "@/lib/api";
import { Prescription, Patient, Staff, Medication } from "@/types";
import { formatDate, getPermissionLevel } from "@/lib/utils";
import toast from "react-hot-toast";
import PatientAutocomplete from "@/components/PatientAutocomplete";

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // View and delete modals
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [prescriptionToView, setPrescriptionToView] = useState<Prescription | null>(null);
  const [prescriptionToDelete, setPrescriptionToDelete] = useState<Prescription | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    patient_id: "",
    staff_id: "",
    medication_id: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
    date_prescribed: "",
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    loadPrescriptions();
    loadPatients();
    loadStaff();
    loadMedications();
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      handleAddPrescription();
      router.replace("/dashboard/prescriptions");
    }
  }, [searchParams]);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const queryParams: any = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
      };

      if (statusFilter && statusFilter !== "all") {
        queryParams.status = statusFilter;
      }

      const response = await prescriptionsAPI.getAll(queryParams);

      if (response.data.prescriptions) {
        setPrescriptions(response.data.prescriptions);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        setPrescriptions(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      } else {
        setPrescriptions([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load prescriptions:", error);
      toast.error(t("prescriptions.loading_error"));
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await patientsAPI.getAll({ limit: 1000 });
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
        }));
        setPatients(patientsData);
      } else if (Array.isArray(response.data)) {
        setPatients(response.data);
      }
    } catch (error) {
      console.error("Failed to load patients:", error);
      setPatients([]);
    }
  };

  const loadStaff = async () => {
    try {
      const response = await staffAPI.getAll();
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const staffData = response.data.data
          .filter((staff: any) => staff.role === 'Doctor' || staff.role === 'doctor')
          .map((staff: any) => ({
            staff_id: staff._id?.toString() || staff.staff_id || "",
            _id: staff._id?.toString() || "",
            name: staff.name || "",
            role: staff.role || "",
            specialization: staff.specialization || "",
            status: staff.status || "active",
          }));
        setStaff(staffData);
      } else if (Array.isArray(response.data)) {
        setStaff(response.data.filter((s: any) => s.role === 'Doctor' || s.role === 'doctor'));
      }
    } catch (error) {
      console.error("Failed to load staff:", error);
      setStaff([]);
    }
  };

  const loadMedications = async () => {
    try {
      const response = await medicationsAPI.getAll({ limit: 1000 });
      if (response.data.medications) {
        setMedications(response.data.medications);
      } else if (Array.isArray(response.data)) {
        setMedications(response.data);
      }
    } catch (error) {
      console.error("Failed to load medications:", error);
      setMedications([]);
    }
  };

  const handleAddPrescription = () => {
    setIsAddMode(true);
    setSelectedPrescription(null);
    setFormData({
      patient_id: "",
      staff_id: "",
      medication_id: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
      date_prescribed: new Date().toISOString().split('T')[0],
    });
    setSelectedPatient(null);
    onOpen();
  };

  const handleEditPrescription = (prescription: Prescription) => {
    setIsAddMode(false);
    setSelectedPrescription(prescription);

    const patient = patients.find(p => p.patient_id === prescription.patient_id);
    setSelectedPatient(patient || null);

    setFormData({
      patient_id: prescription.patient_id || "",
      staff_id: prescription.staff_id || "",
      medication_id: prescription.medication_id || "",
      dosage: prescription.dosage || "",
      frequency: prescription.frequency || "",
      duration: prescription.duration || "",
      instructions: prescription.instructions || "",
      date_prescribed: prescription.date_prescribed ? prescription.date_prescribed.split("T")[0] : "",
    });

    onOpen();
  };

  const handleViewPrescription = (prescription: Prescription) => {
    setPrescriptionToView(prescription);
    onViewOpen();
  };

  const handleDeletePrescription = (prescription: Prescription) => {
    setPrescriptionToDelete(prescription);
    onDeleteOpen();
  };

  const confirmDeletePrescription = async () => {
    if (!prescriptionToDelete) return;

    try {
      const prescriptionId = prescriptionToDelete.prescription_id || prescriptionToDelete._id || prescriptionToDelete.id?.toString();
      await prescriptionsAPI.delete(prescriptionId || "");
      toast.success(t("prescriptions.prescription_deleted"));
      loadPrescriptions();
      onDeleteClose();
      setPrescriptionToDelete(null);
    } catch (error) {
      console.error("Failed to delete prescription:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.patient_id) {
        toast.error(t("prescriptions.patient_required"));
        return;
      }
      if (!formData.staff_id) {
        toast.error(t("prescriptions.staff_required"));
        return;
      }
      if (!formData.medication_id) {
        toast.error(t("prescriptions.medication_required"));
        return;
      }
      if (!formData.dosage.trim()) {
        toast.error(t("prescriptions.dosage_required"));
        return;
      }
      if (!formData.frequency.trim()) {
        toast.error(t("prescriptions.frequency_required"));
        return;
      }
      if (!formData.duration.trim()) {
        toast.error(t("prescriptions.duration_required"));
        return;
      }

      const apiData = {
        patient_id: formData.patient_id,
        staff_id: formData.staff_id,
        medication_id: formData.medication_id,
        dosage: formData.dosage.trim(),
        frequency: formData.frequency.trim(),
        duration: formData.duration.trim(),
        instructions: formData.instructions.trim(),
        date_prescribed: formData.date_prescribed,
      };

      if (isAddMode) {
        await prescriptionsAPI.create(apiData);
        toast.success(t("prescriptions.prescription_created"));
      } else {
        const prescriptionId = selectedPrescription!.prescription_id || selectedPrescription!._id || selectedPrescription!.id?.toString();
        await prescriptionsAPI.update(prescriptionId || "", apiData);
        toast.success(t("prescriptions.prescription_updated"));
      }
      onClose();
      loadPrescriptions();
    } catch (error: any) {
      console.error("Failed to save prescription:", error);
      const errorMessage = error?.response?.data?.error || error?.message || t("common.error_saving");
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (prescriptionId: string, newStatus: string) => {
    try {
      await prescriptionsAPI.update(prescriptionId, { status: newStatus });
      toast.success(t("prescriptions.status_updated"));
      loadPrescriptions();
    } catch (error) {
      console.error("Failed to update prescription status:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "completed": return "primary";
      case "cancelled": return "danger";
      default: return "default";
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => (p.patient_id === patientId) || (p._id === patientId));
    if (patient) {
      const name = patient.name || `${patient.first_name || patient.firstName || ""} ${patient.last_name || patient.lastName || ""}`.trim();
      return name || t("prescriptions.unknown_patient");
    }
    return t("prescriptions.unknown_patient");
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => (s.staff_id === staffId) || (s._id === staffId));
    return staffMember?.name || t("prescriptions.unknown_staff");
  };

  const getMedicationName = (medicationId: string) => {
    const medication = medications.find(m => (m.medication_id === medicationId) || (m._id === medicationId));
    return medication?.name || t("prescriptions.unknown_medication");
  };

  const renderCell = (prescription: Prescription, columnKey: string) => {
    switch (columnKey) {
      case "patient":
        return getPatientName(prescription.patient_id || "");
      case "staff":
        return getStaffName(prescription.staff_id || "");
      case "medication":
        return getMedicationName(prescription.medication_id || "");
      case "prescription_info":
        return (
          <div>
            <p className="font-medium">{prescription.dosage}</p>
            <p className="text-sm text-gray-500">{prescription.frequency}</p>
            <p className="text-sm text-gray-500">{t("prescriptions.duration")}: {prescription.duration}</p>
          </div>
        );
      case "date_prescribed":
        return formatDate(prescription.date_prescribed || "");
      case "status":
        return (
          <Chip color={getStatusColor(prescription.status || "")} size="sm">
            {t(`prescriptions.${prescription.status}`) || prescription.status || "active"}
          </Chip>
        );
      case "actions":
        const prescriptionId = prescription.prescription_id || prescription._id || prescription.id?.toString() || "";
        return (
          <div className="flex gap-2 items-center">
            <Button size="sm" color="secondary" variant="flat" onPress={() => handleViewPrescription(prescription)}>
              <Eye size={16} />
            </Button>
            {getPermissionLevel(user) >= 2 && (
              <>
                <Button size="sm" color="primary" variant="flat" onPress={() => handleEditPrescription(prescription)}>
                  <Edit size={16} />
                </Button>
                <Select
                  size="sm"
                  placeholder="Status"
                  className="w-32"
                  selectedKeys={prescription.status ? [prescription.status] : []}
                  onSelectionChange={(keys) => {
                    const newStatus = Array.from(keys)[0] as string;
                    if (newStatus !== prescription.status) {
                      handleStatusChange(prescriptionId, newStatus);
                    }
                  }}
                >
                  <SelectItem key="active">{t("prescriptions.active")}</SelectItem>
                  <SelectItem key="completed">{t("prescriptions.completed")}</SelectItem>
                  <SelectItem key="cancelled">{t("prescriptions.cancelled")}</SelectItem>
                </Select>
                <Button size="sm" color="danger" variant="flat" onPress={() => handleDeletePrescription(prescription)}>
                  <Trash2 size={16} />
                </Button>
              </>
            )}
          </div>
        );
      default:
        return prescription[columnKey as keyof Prescription];
    }
  };

  const columns = [
    { key: "patient", label: t("prescriptions.patient") },
    { key: "staff", label: t("prescriptions.staff_member") },
    { key: "medication", label: t("prescriptions.medication") },
    { key: "prescription_info", label: t("prescriptions.prescription_info") },
    { key: "date_prescribed", label: t("prescriptions.date_prescribed") },
    { key: "status", label: t("common.status") },
    { key: "actions", label: t("common.actions") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("prescriptions.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("prescriptions.subtitle")}
          </p>
        </div>
        {getPermissionLevel(user) >= 2 && (
          <Button color="primary" onPress={handleAddPrescription}>
            <Plus className="mr-2" size={20} />
            {t("prescriptions.add_prescription")}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder={t("prescriptions.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<Search size={16} />}
              isClearable
            />
            <Select
              placeholder={t("prescriptions.filter_by_status")}
              className="sm:w-48"
              selectedKeys={statusFilter !== "all" ? [statusFilter] : []}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("prescriptions.all_status")}</SelectItem>
              <SelectItem key="active">{t("prescriptions.active")}</SelectItem>
              <SelectItem key="completed">{t("prescriptions.completed")}</SelectItem>
              <SelectItem key="cancelled">{t("prescriptions.cancelled")}</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Prescriptions Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Prescriptions table">
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={t("prescriptions.loading_prescriptions")}
              emptyContent={t("prescriptions.no_prescriptions")}
            >
              {prescriptions.map((prescription) => (
                <TableRow key={prescription.id || prescription.prescription_id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(prescription, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {prescriptions.length > 0 && totalPages > 1 && (
            <div className="flex justify-center p-4">
              <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Prescription Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {isAddMode ? t("prescriptions.add_prescription") : t("prescriptions.edit_prescription")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <PatientAutocomplete
                label={t("prescriptions.patient")}
                placeholder={t("prescriptions.search_patient_placeholder")}
                value={selectedPatient ? `${selectedPatient.firstName || selectedPatient.first_name} ${selectedPatient.lastName || selectedPatient.last_name} (TC: ${selectedPatient.tcNumber || selectedPatient.tc_number})` : ""}
                onSelect={(patient) => {
                  setSelectedPatient(patient);
                  setFormData({ ...formData, patient_id: patient.patient_id || patient._id || "" });
                }}
                isRequired
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={t("prescriptions.staff_member")}
                  placeholder={t("prescriptions.select_staff")}
                  selectedKeys={formData.staff_id ? [formData.staff_id] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, staff_id: Array.from(keys)[0] as string || "" })}
                  isRequired
                >
                  {staff.filter(s => s.status === 'active').map((staffMember) => (
                    <SelectItem key={staffMember._id || staffMember.staff_id || ""}>
                      Dr. {staffMember.name}
                      {staffMember.specialization && ` - ${staffMember.specialization}`}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label={t("prescriptions.medication")}
                  placeholder={t("prescriptions.select_medication")}
                  selectedKeys={formData.medication_id ? [formData.medication_id] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, medication_id: Array.from(keys)[0] as string || "" })}
                  isRequired
                >
                  {medications.map((medication) => (
                    <SelectItem key={medication.medication_id || medication._id || ""}>
                      {medication.name} ({medication.dosage})
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  label={t("prescriptions.dosage")}
                  placeholder={t("prescriptions.dosage_placeholder")}
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  isRequired
                />

                <Input
                  label={t("prescriptions.frequency")}
                  placeholder={t("prescriptions.frequency_placeholder")}
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  isRequired
                />

                <Input
                  label={t("prescriptions.duration")}
                  placeholder={t("prescriptions.duration_placeholder")}
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  isRequired
                />

                <Input
                  type="date"
                  label={t("prescriptions.date_prescribed")}
                  value={formData.date_prescribed}
                  onChange={(e) => setFormData({ ...formData, date_prescribed: e.target.value })}
                  isRequired
                />
              </div>

              <Textarea
                label={t("prescriptions.instructions")}
                placeholder={t("prescriptions.instructions_placeholder")}
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {isAddMode ? t("prescriptions.create_prescription") : t("prescriptions.update_prescription")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Prescription Details Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t("prescriptions.prescription_details")}</ModalHeader>
          <ModalBody>
            {prescriptionToView && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t("prescriptions.patient")}</p>
                    <p className="font-medium">{getPatientName(prescriptionToView.patient_id || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("prescriptions.staff_member")}</p>
                    <p className="font-medium">Dr. {getStaffName(prescriptionToView.staff_id || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("prescriptions.medication")}</p>
                    <p className="font-medium">{getMedicationName(prescriptionToView.medication_id || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("prescriptions.dosage")}</p>
                    <p className="font-medium">{prescriptionToView.dosage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("prescriptions.frequency")}</p>
                    <p className="font-medium">{prescriptionToView.frequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("prescriptions.duration")}</p>
                    <p className="font-medium">{prescriptionToView.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("prescriptions.date_prescribed")}</p>
                    <p className="font-medium">{formatDate(prescriptionToView.date_prescribed || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("common.status")}</p>
                    <Chip color={getStatusColor(prescriptionToView.status || "")} size="sm">
                      {t(`prescriptions.${prescriptionToView.status}`) || prescriptionToView.status}
                    </Chip>
                  </div>
                </div>

                {prescriptionToView.instructions && (
                  <div>
                    <p className="text-sm text-gray-500">{t("prescriptions.instructions")}</p>
                    <p className="font-medium">{prescriptionToView.instructions}</p>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={onViewClose}>
              {t("common.close")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalContent>
          <ModalHeader>{t("prescriptions.delete_prescription")}</ModalHeader>
          <ModalBody>
            <p>{t("prescriptions.delete_confirmation")}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onDeleteClose}>
              {t("common.cancel")}
            </Button>
            <Button color="danger" onPress={confirmDeletePrescription}>
              {t("common.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}