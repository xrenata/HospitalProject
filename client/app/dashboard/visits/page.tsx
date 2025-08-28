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
import { ClipboardList, Search, Trash2, Edit, Plus, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import { visitsAPI, patientsAPI, staffAPI } from "@/lib/api";
import { Visit, Patient, Staff } from "@/types";
import { formatDate, getPermissionLevel } from "@/lib/utils";
import toast from "react-hot-toast";
import PatientAutocomplete from "@/components/PatientAutocomplete";

export default function VisitsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // View and delete modals
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [visitToView, setVisitToView] = useState<Visit | null>(null);
  const [visitToDelete, setVisitToDelete] = useState<Visit | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    patient_id: "",
    staff_id: "",
    visit_date: "",
    visit_time: "",
    reason: "",
    diagnosis: "",
    treatment_plan: "",
    follow_up_date: "",
    cost: "",
    notes: "",
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    loadVisits();
    loadPatients();
    loadStaff();
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      handleAddVisit();
      router.replace("/dashboard/visits");
    }
  }, [searchParams]);

  const loadVisits = async () => {
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

      const response = await visitsAPI.getAll(queryParams);

      if (response.data.visits) {
        setVisits(response.data.visits);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        setVisits(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      } else {
        setVisits([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load visits:", error);
      toast.error(t("visits.loading_error"));
      setVisits([]);
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

  const handleAddVisit = () => {
    setIsAddMode(true);
    setSelectedVisit(null);
    setFormData({
      patient_id: "",
      staff_id: "",
      visit_date: "",
      visit_time: "",
      reason: "",
      diagnosis: "",
      treatment_plan: "",
      follow_up_date: "",
      cost: "",
      notes: "",
    });
    setSelectedPatient(null);
    onOpen();
  };

  const handleEditVisit = (visit: Visit) => {
    setIsAddMode(false);
    setSelectedVisit(visit);

    const patient = patients.find(p => p.patient_id === visit.patient_id);
    setSelectedPatient(patient || null);

    setFormData({
      patient_id: visit.patient_id || "",
      staff_id: visit.staff_id || "",
      visit_date: visit.visit_date ? visit.visit_date.split("T")[0] : "",
      visit_time: visit.visit_time || "",
      reason: visit.reason || "",
      diagnosis: visit.diagnosis || "",
      treatment_plan: visit.treatment_plan || "",
      follow_up_date: visit.follow_up_date ? visit.follow_up_date.split("T")[0] : "",
      cost: visit.cost ? visit.cost.toString() : "",
      notes: visit.notes || "",
    });

    onOpen();
  };

  const handleViewVisit = (visit: Visit) => {
    setVisitToView(visit);
    onViewOpen();
  };

  const handleDeleteVisit = (visit: Visit) => {
    setVisitToDelete(visit);
    onDeleteOpen();
  };

  const confirmDeleteVisit = async () => {
    if (!visitToDelete) return;

    try {
      const visitId = visitToDelete.visit_id || visitToDelete._id || visitToDelete.id?.toString();
      await visitsAPI.delete(visitId || "");
      toast.success(t("visits.visit_deleted"));
      loadVisits();
      onDeleteClose();
      setVisitToDelete(null);
    } catch (error) {
      console.error("Failed to delete visit:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.patient_id) {
        toast.error(t("visits.patient_required"));
        return;
      }
      if (!formData.staff_id) {
        toast.error(t("visits.staff_required"));
        return;
      }
      if (!formData.visit_date) {
        toast.error(t("visits.visit_date_required"));
        return;
      }
      if (!formData.visit_time) {
        toast.error(t("visits.visit_time_required"));
        return;
      }
      if (!formData.reason.trim()) {
        toast.error(t("visits.reason_required"));
        return;
      }

      const apiData = {
        patient_id: formData.patient_id,
        staff_id: formData.staff_id,
        visit_date: formData.visit_date,
        visit_time: formData.visit_time,
        reason: formData.reason.trim(),
        diagnosis: formData.diagnosis.trim(),
        treatment_plan: formData.treatment_plan.trim(),
        follow_up_date: formData.follow_up_date || null,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        notes: formData.notes.trim(),
      };

      if (isAddMode) {
        await visitsAPI.create(apiData);
        toast.success(t("visits.visit_created"));
      } else {
        const visitId = selectedVisit!.visit_id || selectedVisit!._id || selectedVisit!.id?.toString();
        await visitsAPI.update(visitId || "", apiData);
        toast.success(t("visits.visit_updated"));
      }
      onClose();
      loadVisits();
    } catch (error: any) {
      console.error("Failed to save visit:", error);
      const errorMessage = error?.response?.data?.error || error?.message || t("common.error_saving");
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (visitId: string, newStatus: string) => {
    try {
      await visitsAPI.update(visitId, { status: newStatus });
      toast.success(t("visits.status_updated"));
      loadVisits();
    } catch (error) {
      console.error("Failed to update visit status:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "primary";
      case "in-progress": return "warning";
      case "completed": return "success";
      case "cancelled": return "danger";
      default: return "default";
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => (p.patient_id === patientId) || (p._id === patientId));
    if (patient) {
      const name = patient.name || `${patient.first_name || patient.firstName || ""} ${patient.last_name || patient.lastName || ""}`.trim();
      return name || t("visits.unknown_patient");
    }
    return t("visits.unknown_patient");
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => (s.staff_id === staffId) || (s._id === staffId));
    return staffMember?.name || t("visits.unknown_staff");
  };

  const renderCell = (visit: Visit, columnKey: string) => {
    switch (columnKey) {
      case "patient":
        return getPatientName(visit.patient_id || "");
      case "staff":
        return getStaffName(visit.staff_id || "");
      case "datetime":
        return (
          <div>
            <p>{formatDate(visit.visit_date || "")}</p>
            <p className="text-sm text-gray-500">{visit.visit_time || ""}</p>
          </div>
        );
      case "reason":
        return (
          <div>
            <p className="font-medium">{visit.reason || "N/A"}</p>
            {visit.diagnosis && (
              <p className="text-sm text-gray-500">{t("visits.diagnosis")}: {visit.diagnosis}</p>
            )}
          </div>
        );
      case "status":
        return (
          <Chip color={getStatusColor(visit.status || "")} size="sm">
            {t(`visits.${visit.status}`) || visit.status || "scheduled"}
          </Chip>
        );
      case "cost":
        return visit.cost ? `$${visit.cost}` : "-";
      case "actions":
        const visitId = visit.visit_id || visit._id || visit.id?.toString() || "";
        return (
          <div className="flex gap-2 items-center">
            <Button size="sm" color="secondary" variant="flat" onPress={() => handleViewVisit(visit)}>
              <Eye size={16} />
            </Button>
            <Button size="sm" color="primary" variant="flat" onPress={() => handleEditVisit(visit)}>
              <Edit size={16} />
            </Button>
            {getPermissionLevel(user) >= 2 && (
              <>
                <Select
                  size="sm"
                  placeholder="Status"
                  className="w-32"
                  selectedKeys={visit.status ? [visit.status] : []}
                  onSelectionChange={(keys) => {
                    const newStatus = Array.from(keys)[0] as string;
                    if (newStatus !== visit.status) {
                      handleStatusChange(visitId, newStatus);
                    }
                  }}
                >
                  <SelectItem key="scheduled">{t("visits.scheduled")}</SelectItem>
                  <SelectItem key="in-progress">{t("visits.in_progress")}</SelectItem>
                  <SelectItem key="completed">{t("visits.completed")}</SelectItem>
                  <SelectItem key="cancelled">{t("visits.cancelled")}</SelectItem>
                </Select>
                <Button size="sm" color="danger" variant="flat" onPress={() => handleDeleteVisit(visit)}>
                  <Trash2 size={16} />
                </Button>
              </>
            )}
          </div>
        );
      default:
        return visit[columnKey as keyof Visit];
    }
  };

  const columns = [
    { key: "patient", label: t("visits.patient") },
    { key: "staff", label: t("visits.staff_member") },
    { key: "datetime", label: t("visits.visit_datetime") },
    { key: "reason", label: t("visits.reason_diagnosis") },
    { key: "status", label: t("common.status") },
    { key: "cost", label: t("visits.cost") },
    { key: "actions", label: t("common.actions") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("visits.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("visits.subtitle")}
          </p>
        </div>
        <Button color="primary" onPress={handleAddVisit}>
          <Plus className="mr-2" size={20} />
          {t("visits.add_visit")}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder={t("visits.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<Search size={16} />}
              isClearable
            />
            <Select
              placeholder={t("visits.filter_by_status")}
              className="sm:w-48"
              selectedKeys={statusFilter !== "all" ? [statusFilter] : []}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("visits.all_status")}</SelectItem>
              <SelectItem key="scheduled">{t("visits.scheduled")}</SelectItem>
              <SelectItem key="in-progress">{t("visits.in_progress")}</SelectItem>
              <SelectItem key="completed">{t("visits.completed")}</SelectItem>
              <SelectItem key="cancelled">{t("visits.cancelled")}</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Visits Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Visits table">
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={t("visits.loading_visits")}
              emptyContent={t("visits.no_visits")}
            >
              {visits.map((visit) => (
                <TableRow key={visit.id || visit.visit_id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(visit, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {visits.length > 0 && totalPages > 1 && (
            <div className="flex justify-center p-4">
              <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Visit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {isAddMode ? t("visits.add_visit") : t("visits.edit_visit")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <PatientAutocomplete
                label={t("visits.patient")}
                placeholder={t("visits.search_patient_placeholder")}
                value={selectedPatient ? `${selectedPatient.firstName || selectedPatient.first_name} ${selectedPatient.lastName || selectedPatient.last_name} (TC: ${selectedPatient.tcNumber || selectedPatient.tc_number})` : ""}
                onSelect={(patient) => {
                  setSelectedPatient(patient);
                  setFormData({ ...formData, patient_id: patient.patient_id || patient._id || "" });
                }}
                isRequired
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={t("visits.staff_member")}
                  placeholder={t("visits.select_staff")}
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

                <Input
                  type="date"
                  label={t("visits.visit_date")}
                  value={formData.visit_date}
                  onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                  isRequired
                />

                <Input
                  type="time"
                  label={t("visits.visit_time")}
                  value={formData.visit_time}
                  onChange={(e) => setFormData({ ...formData, visit_time: e.target.value })}
                  isRequired
                />

                <Input
                  type="number"
                  label={t("visits.cost")}
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  startContent={<span className="text-default-400">$</span>}
                />

                <Input
                  type="date"
                  label={t("visits.follow_up_date")}
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  className="md:col-span-2"
                />
              </div>

              <Textarea
                label={t("visits.reason")}
                placeholder={t("visits.reason_placeholder")}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                isRequired
              />

              <Textarea
                label={t("visits.diagnosis")}
                placeholder={t("visits.diagnosis_placeholder")}
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              />

              <Textarea
                label={t("visits.treatment_plan")}
                placeholder={t("visits.treatment_plan_placeholder")}
                value={formData.treatment_plan}
                onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
              />

              <Textarea
                label={t("visits.notes")}
                placeholder={t("visits.notes_placeholder")}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {isAddMode ? t("visits.create_visit") : t("visits.update_visit")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Visit Details Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t("visits.visit_details")}</ModalHeader>
          <ModalBody>
            {visitToView && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t("visits.patient")}</p>
                    <p className="font-medium">{getPatientName(visitToView.patient_id || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("visits.staff_member")}</p>
                    <p className="font-medium">{getStaffName(visitToView.staff_id || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("visits.visit_date")}</p>
                    <p className="font-medium">{formatDate(visitToView.visit_date || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("visits.visit_time")}</p>
                    <p className="font-medium">{visitToView.visit_time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("common.status")}</p>
                    <Chip color={getStatusColor(visitToView.status || "")} size="sm">
                      {t(`visits.${visitToView.status}`) || visitToView.status}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("visits.cost")}</p>
                    <p className="font-medium">{visitToView.cost ? `$${visitToView.cost}` : "-"}</p>
                  </div>
                </div>

                {visitToView.reason && (
                  <div>
                    <p className="text-sm text-gray-500">{t("visits.reason")}</p>
                    <p className="font-medium">{visitToView.reason}</p>
                  </div>
                )}

                {visitToView.diagnosis && (
                  <div>
                    <p className="text-sm text-gray-500">{t("visits.diagnosis")}</p>
                    <p className="font-medium">{visitToView.diagnosis}</p>
                  </div>
                )}

                {visitToView.treatment_plan && (
                  <div>
                    <p className="text-sm text-gray-500">{t("visits.treatment_plan")}</p>
                    <p className="font-medium">{visitToView.treatment_plan}</p>
                  </div>
                )}

                {visitToView.follow_up_date && (
                  <div>
                    <p className="text-sm text-gray-500">{t("visits.follow_up_date")}</p>
                    <p className="font-medium">{formatDate(visitToView.follow_up_date)}</p>
                  </div>
                )}

                {visitToView.notes && (
                  <div>
                    <p className="text-sm text-gray-500">{t("visits.notes")}</p>
                    <p className="font-medium">{visitToView.notes}</p>
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
          <ModalHeader>{t("visits.delete_visit")}</ModalHeader>
          <ModalBody>
            <p>{t("visits.delete_confirmation")}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onDeleteClose}>
              {t("common.cancel")}
            </Button>
            <Button color="danger" onPress={confirmDeleteVisit}>
              {t("common.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}