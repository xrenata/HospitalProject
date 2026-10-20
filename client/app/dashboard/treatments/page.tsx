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
  Textarea
} from '@heroui/react';
import { Chip } from '@/components/Chip';
import { Heart, Search, Trash2, Edit, Plus, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import { treatmentsAPI, patientsAPI, staffAPI } from "@/lib/api";
import { Treatment, Patient, Staff } from "@/types";
import { formatDate, getPermissionLevel } from "@/lib/utils";
import toast from "react-hot-toast";
import PatientAutocomplete from "@/components/PatientAutocomplete";

import DataSummary from "@/components/DataSummary";
import DateField from '@/components/DateField';
export default function TreatmentsPage() {
  const { user, can, canWrite } = useAuth();
  const { t, te } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // View and delete modals
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [treatmentToView, setTreatmentToView] = useState<Treatment | null>(null);
  const [treatmentToDelete, setTreatmentToDelete] = useState<Treatment | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    patient_id: "",
    staff_id: "",
    treatment_type: "",
    description: "",
    diagnosis: "",
    medication: "",
    start_date: "",
    end_date: "",
    cost: "",
    notes: "",
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    loadTreatments();
    loadPatients();
    loadStaff();
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      handleAddTreatment();
      router.replace("/dashboard/treatments");
    }
  }, [searchParams]);

  const loadTreatments = async () => {
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

      const response = await treatmentsAPI.getAll(queryParams);

      if (response.data.treatments) {
        setTreatments(response.data.treatments);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        setTreatments(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      } else {
        setTreatments([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load treatments:", error);
      toast.error(t("treatments.loading_error"));
      setTreatments([]);
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
        const staffData = response.data.data.map((staff: any) => ({
          staff_id: staff._id?.toString() || staff.staff_id || "",
          _id: staff._id?.toString() || "",
          name: staff.name || "",
          role: staff.role || "",
          specialization: staff.specialization || "",
          status: staff.status || "active",
        }));
        setStaff(staffData);
      } else if (Array.isArray(response.data)) {
        setStaff(response.data);
      }
    } catch (error) {
      console.error("Failed to load staff:", error);
      setStaff([]);
    }
  };

  const handleAddTreatment = () => {
    setIsAddMode(true);
    setSelectedTreatment(null);
    setFormData({
      patient_id: "",
      staff_id: "",
      treatment_type: "",
      description: "",
      diagnosis: "",
      medication: "",
      start_date: "",
      end_date: "",
      cost: "",
      notes: "",
    });
    setSelectedPatient(null);
    onOpen();
  };

  const handleEditTreatment = (treatment: Treatment) => {
    setIsAddMode(false);
    setSelectedTreatment(treatment);

    const patient = patients.find(p => p.patient_id === treatment.patient_id);
    setSelectedPatient(patient || null);

    setFormData({
      patient_id: treatment.patient_id || "",
      staff_id: treatment.staff_id || "",
      treatment_type: treatment.treatment_type || "",
      description: treatment.description || treatment.treatment_description || "",
      diagnosis: treatment.diagnosis || "",
      medication: treatment.medication || "",
      start_date: treatment.start_date ? treatment.start_date.split("T")[0] : "",
      end_date: treatment.end_date ? treatment.end_date.split("T")[0] : "",
      cost: treatment.cost ? treatment.cost.toString() : "",
      notes: treatment.notes || "",
    });

    onOpen();
  };

  const handleViewTreatment = (treatment: Treatment) => {
    setTreatmentToView(treatment);
    onViewOpen();
  };

  const handleDeleteTreatment = (treatment: Treatment) => {
    setTreatmentToDelete(treatment);
    onDeleteOpen();
  };

  const confirmDeleteTreatment = async () => {
    if (!treatmentToDelete) return;

    try {
      const treatmentId = treatmentToDelete.treatment_id || treatmentToDelete._id || treatmentToDelete.id?.toString();
      await treatmentsAPI.delete(treatmentId || "");
      toast.success(t("treatments.treatment_deleted"));
      loadTreatments();
      onDeleteClose();
      setTreatmentToDelete(null);
    } catch (error) {
      console.error("Failed to delete treatment:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.patient_id) {
        toast.error(t("treatments.patient_required"));
        return;
      }
      if (!formData.staff_id) {
        toast.error(t("treatments.staff_required"));
        return;
      }
      if (!formData.description.trim()) {
        toast.error(t("treatments.description_required"));
        return;
      }
      if (!formData.start_date) {
        toast.error(t("treatments.start_date_required"));
        return;
      }

      const apiData = {
        patient_id: formData.patient_id,
        staff_id: formData.staff_id,
        treatment_type: formData.treatment_type.trim(),
        description: formData.description.trim(),
        diagnosis: formData.diagnosis.trim(),
        medication: formData.medication.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        notes: formData.notes.trim(),
      };

      if (isAddMode) {
        await treatmentsAPI.create(apiData);
        toast.success(t("treatments.treatment_created"));
      } else {
        const treatmentId = selectedTreatment!.treatment_id || selectedTreatment!._id || selectedTreatment!.id?.toString();
        await treatmentsAPI.update(treatmentId || "", apiData);
        toast.success(t("treatments.treatment_updated"));
      }
      onClose();
      loadTreatments();
    } catch (error: any) {
      console.error("Failed to save treatment:", error);
      const errorMessage = error?.response?.data?.error || error?.message || t("common.error_saving");
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (treatmentId: string, newStatus: string) => {
    try {
      await treatmentsAPI.update(treatmentId, { status: newStatus });
      toast.success(t("treatments.status_updated"));
      loadTreatments();
    } catch (error) {
      console.error("Failed to update treatment status:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing": return "warning";
      case "completed": return "success";
      case "cancelled": return "danger";
      default: return "default";
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => (p.patient_id === patientId) || (p._id === patientId));
    if (patient) {
      const name = patient.name || `${patient.first_name || patient.firstName || ""} ${patient.last_name || patient.lastName || ""}`.trim();
      return name || t("treatments.unknown_patient");
    }
    return t("treatments.unknown_patient");
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => (s.staff_id === staffId) || (s._id === staffId));
    return staffMember?.name || t("treatments.unknown_staff");
  };

  const renderCell = (treatment: Treatment, columnKey: string) => {
    switch (columnKey) {
      case "patient":
        return getPatientName(treatment.patient_id || "");
      case "staff":
        return getStaffName(treatment.staff_id || "");
      case "treatment":
        return (
          <div>
            <p className="font-medium">{treatment.treatment_type || treatment.description}</p>
            {treatment.diagnosis && (
              <p className="text-sm text-gray-500">{t("treatments.diagnosis")}: {treatment.diagnosis}</p>
            )}
          </div>
        );
      case "dates":
        return (
          <div>
            <p className="text-sm">{t("treatments.start")}: {formatDate(treatment.start_date || "")}</p>
            {treatment.end_date && (
              <p className="text-sm">{t("treatments.end")}: {formatDate(treatment.end_date)}</p>
            )}
          </div>
        );
      case "status":
        return (
          <Chip variant="flat" color={getStatusColor(treatment.status || "")} size="sm">
            {te(`treatments.${treatment.status}`, treatment.status || "ongoing")}
          </Chip>
        );
      case "cost":
        return treatment.cost ? `$${treatment.cost}` : "-";
      case "actions":
        const treatmentId = treatment.treatment_id || treatment._id || treatment.id?.toString() || "";
        return (
          <div className="flex gap-2 items-center">
            <Button isIconOnly size="sm" variant="light" className="text-foreground-500 hover:text-primary" onPress={() => handleViewTreatment(treatment)}>
              <Eye size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="light" className="text-foreground-500 hover:text-primary" onPress={() => handleEditTreatment(treatment)}>
              <Edit size={16} />
            </Button>
            {canWrite('treatments') && (
              <>
                <Select
                  size="sm"
                  placeholder="Status"
                  className="w-32"
                  selectedKeys={treatment.status ? [treatment.status] : []}
                  onSelectionChange={(keys) => {
                    const newStatus = Array.from(keys)[0] as string;
                    if (newStatus !== treatment.status) {
                      handleStatusChange(treatmentId, newStatus);
                    }
                  }}
               >
                  <SelectItem key="ongoing">{t("treatments.ongoing")}</SelectItem>
                  <SelectItem key="completed">{t("treatments.completed")}</SelectItem>
                  <SelectItem key="cancelled">{t("treatments.cancelled")}</SelectItem>
                </Select>
                <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => handleDeleteTreatment(treatment)}>
                  <Trash2 size={16} />
                </Button>
              </>
            )}
          </div>
        );
      default:
        return treatment[columnKey as keyof Treatment];
    }
  };

  const columns = [
    { key: "patient", label: t("treatments.patient") },
    { key: "staff", label: t("treatments.staff_member") },
    { key: "treatment", label: t("treatments.treatment_info") },
    { key: "dates", label: t("treatments.treatment_period") },
    { key: "status", label: t("common.status") },
    { key: "cost", label: t("treatments.cost") },
    { key: "actions", label: t("common.actions") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("treatments.title")}
          </h1>
          <p className="text-sm text-foreground-500 mt-1">
            {t("treatments.subtitle")}
          </p>
        </div>
        <Button color="primary" onPress={handleAddTreatment}>
          <Plus className="mr-2" size={20} />
          {t("treatments.add_treatment")}
        </Button>
      </div>

      <DataSummary entity="treatments" loading={loading} />

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder={t("treatments.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<Search size={16} />}
              isClearable
            />
            <Select
              placeholder={t("treatments.filter_by_status")}
              className="sm:w-48"
              selectedKeys={statusFilter !== "all" ? [statusFilter] : []}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string || "all")}
           >
              <SelectItem key="all">{t("treatments.all_status")}</SelectItem>
              <SelectItem key="ongoing">{t("treatments.ongoing")}</SelectItem>
              <SelectItem key="completed">{t("treatments.completed")}</SelectItem>
              <SelectItem key="cancelled">{t("treatments.cancelled")}</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Treatments Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Treatments table" removeWrapper isHeaderSticky classNames={{ base: "overflow-x-auto", table: "min-w-[44rem]", th: "h-10 bg-default-50 text-xs font-medium text-foreground-500 first:rounded-none last:rounded-none", td: "py-3 border-b border-divider group-data-[last=true]:border-b-0", tr: "transition-colors hover:bg-default-50" }}>
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={t("treatments.loading_treatments")}
              emptyContent={t("treatments.no_treatments")}
           >
              {treatments.map((treatment) => (
                <TableRow key={treatment.id || treatment.treatment_id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(treatment, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {treatments.length > 0 && totalPages > 1 && (
            <div className="flex justify-center border-t border-divider p-3">
              <Pagination isCompact showControls total={totalPages} page={currentPage} onChange={setCurrentPage} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Treatment Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {isAddMode ? t("treatments.add_treatment") : t("treatments.edit_treatment")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <PatientAutocomplete
                label={t("treatments.patient")}
                placeholder={t("treatments.search_patient_placeholder")}
                value={selectedPatient ? `${selectedPatient.firstName || selectedPatient.first_name} ${selectedPatient.lastName || selectedPatient.last_name} (TC: ${selectedPatient.tcNumber || selectedPatient.tc_number})` : ""}
                onSelect={(patient) => {
                  setSelectedPatient(patient);
                  setFormData({ ...formData, patient_id: patient.patient_id || patient._id || "" });
                }}
                isRequired
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select labelPlacement="outside" variant="bordered"
                  label={t("treatments.staff_member")}
                  placeholder={t("treatments.select_staff")}
                  selectedKeys={formData.staff_id ? [formData.staff_id] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, staff_id: Array.from(keys)[0] as string || "" })}
                  isRequired
               >
                  {staff.filter(s => s.status === 'active').map((staffMember) => (
                    <SelectItem key={staffMember._id || staffMember.staff_id || ""}>
                      {staffMember.name} ({staffMember.role})
                      {staffMember.specialization && ` - ${staffMember.specialization}`}
                    </SelectItem>
                  ))}
                </Select>

                <Input labelPlacement="outside" variant="bordered"
                  label={t("treatments.treatment_type")}
                  placeholder={t("treatments.treatment_type_placeholder")}
                  value={formData.treatment_type}
                  onChange={(e) => setFormData({ ...formData, treatment_type: e.target.value })}
                />

                <DateField
                  
                  label={t("treatments.start_date")}
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  isRequired
 />

                <DateField
                  
                  label={t("treatments.end_date")}
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
 />

                <Input labelPlacement="outside" variant="bordered"
                  type="number"
                  label={t("treatments.cost")}
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  startContent={<span className="text-default-400">$</span>}
                  className="md:col-span-2"
                />
              </div>

              <Textarea minRows={3} labelPlacement="outside" variant="bordered"
                label={t("treatments.description")}
                placeholder={t("treatments.description_placeholder")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                isRequired
              />

              <Textarea minRows={3} labelPlacement="outside" variant="bordered"
                label={t("treatments.diagnosis")}
                placeholder={t("treatments.diagnosis_placeholder")}
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              />

              <Textarea minRows={3} labelPlacement="outside" variant="bordered"
                label={t("treatments.medication")}
                placeholder={t("treatments.medication_placeholder")}
                value={formData.medication}
                onChange={(e) => setFormData({ ...formData, medication: e.target.value })}
              />

              <Textarea minRows={3} labelPlacement="outside" variant="bordered"
                label={t("treatments.notes")}
                placeholder={t("treatments.notes_placeholder")}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {isAddMode ? t("treatments.create_treatment") : t("treatments.update_treatment")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Treatment Details Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{t("treatments.treatment_details")}</ModalHeader>
          <ModalBody>
            {treatmentToView && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t("treatments.patient")}</p>
                    <p className="font-medium">{getPatientName(treatmentToView.patient_id || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("treatments.staff_member")}</p>
                    <p className="font-medium">{getStaffName(treatmentToView.staff_id || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("treatments.treatment_type")}</p>
                    <p className="font-medium">{treatmentToView.treatment_type || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("common.status")}</p>
                    <Chip variant="flat" color={getStatusColor(treatmentToView.status || "")} size="sm">
                      {te(`treatments.${treatmentToView.status}`, treatmentToView.status)}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("treatments.start_date")}</p>
                    <p className="font-medium">{formatDate(treatmentToView.start_date || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("treatments.end_date")}</p>
                    <p className="font-medium">{treatmentToView.end_date ? formatDate(treatmentToView.end_date) : "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("treatments.cost")}</p>
                    <p className="font-medium">{treatmentToView.cost ? `$${treatmentToView.cost}` : "-"}</p>
                  </div>
                </div>

                {treatmentToView.description && (
                  <div>
                    <p className="text-sm text-gray-500">{t("treatments.description")}</p>
                    <p className="font-medium">{treatmentToView.description}</p>
                  </div>
                )}

                {treatmentToView.diagnosis && (
                  <div>
                    <p className="text-sm text-gray-500">{t("treatments.diagnosis")}</p>
                    <p className="font-medium">{treatmentToView.diagnosis}</p>
                  </div>
                )}

                {treatmentToView.medication && (
                  <div>
                    <p className="text-sm text-gray-500">{t("treatments.medication")}</p>
                    <p className="font-medium">{treatmentToView.medication}</p>
                  </div>
                )}

                {treatmentToView.notes && (
                  <div>
                    <p className="text-sm text-gray-500">{t("treatments.notes")}</p>
                    <p className="font-medium">{treatmentToView.notes}</p>
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
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{t("treatments.delete_treatment")}</ModalHeader>
          <ModalBody>
            <p>{t("treatments.delete_confirmation")}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteClose}>
              {t("common.cancel")}
            </Button>
            <Button color="danger" onPress={confirmDeleteTreatment}>
              {t("common.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}