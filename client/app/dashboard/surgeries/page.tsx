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
import { Scissors, Search, Trash2, Edit, Plus, Eye, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import { surgeriesAPI, patientsAPI, staffAPI, roomsAPI } from "@/lib/api";
import { Surgery, Patient, Staff, Room } from "@/types";
import { formatDate, getPermissionLevel } from "@/lib/utils";
import toast from "react-hot-toast";
import PatientAutocomplete from "@/components/PatientAutocomplete";

export default function SurgeriesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSurgery, setSelectedSurgery] = useState<Surgery | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // View and delete modals
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [surgeryToView, setSurgeryToView] = useState<Surgery | null>(null);
  const [surgeryToDelete, setSurgeryToDelete] = useState<Surgery | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    patient_id: "",
    primary_surgeon_id: "",
    surgery_type: "",
    scheduled_date: "",
    scheduled_time: "",
    duration_minutes: "",
    room_id: "",
    pre_op_notes: "",
    post_op_notes: "",
    complications: "",
    cost: "",
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const surgeryTypes = [
    "Appendectomy", "Cholecystectomy", "Hernia Repair", "Coronary Bypass", "Knee Replacement",
    "Hip Replacement", "Cataract Surgery", "Tonsillectomy", "Gastric Bypass", "Cesarean Section",
    "Emergency Surgery", "Other"
  ];

  useEffect(() => {
    loadSurgeries();
    loadPatients();
    loadStaff();
    loadRooms();
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      handleAddSurgery();
      router.replace("/dashboard/surgeries");
    }
  }, [searchParams]);

  const loadSurgeries = async () => {
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

      const response = await surgeriesAPI.getAll(queryParams);

      if (response.data.surgeries) {
        setSurgeries(response.data.surgeries);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        setSurgeries(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      } else {
        setSurgeries([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load surgeries:", error);
      toast.error(t("surgeries.loading_error"));
      setSurgeries([]);
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

  const loadRooms = async () => {
    try {
      const response = await roomsAPI.getAll({ type: "operation" });
      if (response.data.rooms) {
        setRooms(response.data.rooms);
      } else if (Array.isArray(response.data)) {
        setRooms(response.data);
      }
    } catch (error) {
      console.error("Failed to load operation rooms:", error);
      setRooms([]);
    }
  };

  const handleAddSurgery = () => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("surgeries.insufficient_permissions"));
      return;
    }

    setIsAddMode(true);
    setSelectedSurgery(null);
    setFormData({
      patient_id: "",
      primary_surgeon_id: "",
      surgery_type: "",
      scheduled_date: "",
      scheduled_time: "",
      duration_minutes: "",
      room_id: "",
      pre_op_notes: "",
      post_op_notes: "",
      complications: "",
      cost: "",
    });
    setSelectedPatient(null);
    onOpen();
  };

  const handleEditSurgery = (surgery: Surgery) => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("surgeries.insufficient_permissions"));
      return;
    }

    setIsAddMode(false);
    setSelectedSurgery(surgery);

    const patient = patients.find(p => p.patient_id === surgery.patient_id);
    setSelectedPatient(patient || null);

    const scheduledDateTime = surgery.scheduled_date ? new Date(surgery.scheduled_date) : null;

    setFormData({
      patient_id: surgery.patient_id || "",
      primary_surgeon_id: surgery.primary_surgeon_id || "",
      surgery_type: surgery.surgery_type || "",
      scheduled_date: scheduledDateTime ? scheduledDateTime.toISOString().split("T")[0] : "",
      scheduled_time: surgery.scheduled_time || "",
      duration_minutes: surgery.duration_minutes ? surgery.duration_minutes.toString() : "",
      room_id: surgery.room_id || "",
      pre_op_notes: surgery.pre_op_notes || "",
      post_op_notes: surgery.post_op_notes || "",
      complications: surgery.complications || "",
      cost: surgery.cost ? surgery.cost.toString() : "",
    });

    onOpen();
  };

  const handleViewSurgery = (surgery: Surgery) => {
    setSurgeryToView(surgery);
    onViewOpen();
  };

  const handleDeleteSurgery = (surgery: Surgery) => {
    if (getPermissionLevel(user) < 3) {
      toast.error(t("surgeries.insufficient_permissions_delete"));
      return;
    }

    setSurgeryToDelete(surgery);
    onDeleteOpen();
  };

  const confirmDeleteSurgery = async () => {
    if (!surgeryToDelete) return;

    try {
      const surgeryId = surgeryToDelete.surgery_id || surgeryToDelete._id || surgeryToDelete.id?.toString();
      await surgeriesAPI.delete(surgeryId || "");
      toast.success(t("surgeries.surgery_deleted"));
      loadSurgeries();
      onDeleteClose();
      setSurgeryToDelete(null);
    } catch (error) {
      console.error("Failed to delete surgery:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.patient_id) {
        toast.error(t("surgeries.patient_required"));
        return;
      }
      if (!formData.primary_surgeon_id) {
        toast.error(t("surgeries.surgeon_required"));
        return;
      }
      if (!formData.surgery_type.trim()) {
        toast.error(t("surgeries.surgery_type_required"));
        return;
      }
      if (!formData.scheduled_date) {
        toast.error(t("surgeries.scheduled_date_required"));
        return;
      }
      if (!formData.scheduled_time) {
        toast.error(t("surgeries.scheduled_time_required"));
        return;
      }
      if (!formData.room_id) {
        toast.error(t("surgeries.room_required"));
        return;
      }

      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);

      const apiData = {
        patient_id: formData.patient_id,
        primary_surgeon_id: formData.primary_surgeon_id,
        surgery_type: formData.surgery_type.trim(),
        scheduled_date: scheduledDateTime.toISOString(),
        scheduled_time: formData.scheduled_time,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        room_id: formData.room_id,
        pre_op_notes: formData.pre_op_notes.trim(),
        post_op_notes: formData.post_op_notes.trim(),
        complications: formData.complications.trim(),
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        status: isAddMode ? "scheduled" : selectedSurgery?.status || "scheduled",
      };

      if (isAddMode) {
        await surgeriesAPI.create(apiData);
        toast.success(t("surgeries.surgery_created"));
      } else {
        const surgeryId = selectedSurgery!.surgery_id || selectedSurgery!._id || selectedSurgery!.id?.toString();
        await surgeriesAPI.update(surgeryId || "", apiData);
        toast.success(t("surgeries.surgery_updated"));
      }
      onClose();
      loadSurgeries();
    } catch (error: any) {
      console.error("Failed to save surgery:", error);
      const errorMessage = error?.response?.data?.error || error?.message || t("common.error_saving");
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (surgeryId: string, newStatus: string) => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("surgeries.insufficient_permissions"));
      return;
    }

    try {
      await surgeriesAPI.update(surgeryId, { status: newStatus });
      toast.success(t("surgeries.status_updated"));
      loadSurgeries();
    } catch (error) {
      console.error("Failed to update surgery status:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "warning";
      case "in-progress": return "primary";
      case "completed": return "success";
      case "cancelled": return "danger";
      default: return "default";
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => (p.patient_id === patientId) || (p._id === patientId));
    if (patient) {
      const name = patient.name || `${patient.first_name || patient.firstName || ""} ${patient.last_name || patient.lastName || ""}`.trim();
      return name || t("surgeries.unknown_patient");
    }
    return t("surgeries.unknown_patient");
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => (s.staff_id === staffId) || (s._id === staffId));
    return staffMember?.name || t("surgeries.unknown_surgeon");
  };

  const getRoomName = (roomId: string) => {
    const room = rooms.find(r => (r.room_id === roomId) || (r._id === roomId));
    return room ? `${room.room_number} (${room.room_type})` : t("surgeries.unknown_room");
  };

  const renderCell = (surgery: Surgery, columnKey: string) => {
    switch (columnKey) {
      case "patient":
        return getPatientName(surgery.patient_id || "");
      case "surgeon":
        return getStaffName(surgery.primary_surgeon_id || "");
      case "surgery_info":
        return (
          <div>
            <p className="font-medium">{surgery.surgery_type}</p>
            <p className="text-sm text-gray-500">{getRoomName(surgery.room_id || "")}</p>
          </div>
        );
      case "schedule":
        return (
          <div>
            <p className="text-sm font-medium">{formatDate(surgery.scheduled_date || "")}</p>
            <p className="text-sm text-gray-500">
              <Clock size={12} className="inline mr-1" />
              {surgery.scheduled_time}
              {surgery.duration_minutes && ` (${surgery.duration_minutes}min)`}
            </p>
          </div>
        );
      case "status":
        return (
          <Chip color={getStatusColor(surgery.status || "")} size="sm">
            {t(`surgeries.${surgery.status}`) || surgery.status || "scheduled"}
          </Chip>
        );
      case "cost":
        return surgery.cost ? `$${surgery.cost}` : "-";
      case "actions":
        const surgeryId = surgery.surgery_id || surgery._id || surgery.id?.toString() || "";
        return (
          <div className="flex gap-2 items-center">
            <Button size="sm" color="secondary" variant="flat" onPress={() => handleViewSurgery(surgery)}>
              <Eye size={16} />
            </Button>
            {getPermissionLevel(user) >= 2 && (
              <>
                <Button size="sm" color="primary" variant="flat" onPress={() => handleEditSurgery(surgery)}>
                  <Edit size={16} />
                </Button>
                <Select
                  size="sm"
                  placeholder="Status"
                  className="w-32"
                  selectedKeys={surgery.status ? [surgery.status] : []}
                  onSelectionChange={(keys) => {
                    const newStatus = Array.from(keys)[0] as string;
                    if (newStatus !== surgery.status) {
                      handleStatusChange(surgeryId, newStatus);
                    }
                  }}
                >
                  <SelectItem key="scheduled">{t("surgeries.scheduled")}</SelectItem>
                  <SelectItem key="in-progress">{t("surgeries.in_progress")}</SelectItem>
                  <SelectItem key="completed">{t("surgeries.completed")}</SelectItem>
                  <SelectItem key="cancelled">{t("surgeries.cancelled")}</SelectItem>
                </Select>
                {getPermissionLevel(user) >= 3 && (
                  <Button size="sm" color="danger" variant="flat" onPress={() => handleDeleteSurgery(surgery)}>
                    <Trash2 size={16} />
                  </Button>
                )}
              </>
            )}
          </div>
        );
      default:
        return surgery[columnKey as keyof Surgery];
    }
  };

  const columns = [
    { key: "patient", label: t("surgeries.patient") },
    { key: "surgeon", label: t("surgeries.surgeon") },
    { key: "surgery_info", label: t("surgeries.surgery_info") },
    { key: "schedule", label: t("surgeries.schedule") },
    { key: "status", label: t("common.status") },
    { key: "cost", label: t("surgeries.cost") },
    { key: "actions", label: t("common.actions") },
  ];

  const getSurgeons = () => {
    return staff.filter(s => 
      s.status === 'active' && 
      (s.role?.toLowerCase().includes('doctor') || s.role?.toLowerCase().includes('surgeon'))
    );
  };

  const getOperationRooms = () => {
    return rooms.filter(r => 
      r.room_type === 'operation' && 
      (r.status === 'available' || r.status === 'reserved')
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("surgeries.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("surgeries.subtitle")}
          </p>
        </div>
        {getPermissionLevel(user) >= 2 && (
          <Button color="primary" onPress={handleAddSurgery}>
            <Plus className="mr-2" size={20} />
            {t("surgeries.add_surgery")}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder={t("surgeries.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<Search size={16} />}
              isClearable
            />
            <Select
              placeholder={t("surgeries.filter_by_status")}
              className="sm:w-48"
              selectedKeys={statusFilter !== "all" ? [statusFilter] : []}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("surgeries.all_status")}</SelectItem>
              <SelectItem key="scheduled">{t("surgeries.scheduled")}</SelectItem>
              <SelectItem key="in-progress">{t("surgeries.in_progress")}</SelectItem>
              <SelectItem key="completed">{t("surgeries.completed")}</SelectItem>
              <SelectItem key="cancelled">{t("surgeries.cancelled")}</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Surgeries Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Surgeries table">
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={t("surgeries.loading_surgeries")}
              emptyContent={t("surgeries.no_surgeries")}
            >
              {surgeries.map((surgery) => (
                <TableRow key={surgery.id || surgery.surgery_id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(surgery, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {surgeries.length > 0 && totalPages > 1 && (
            <div className="flex justify-center p-4">
              <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Surgery Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {isAddMode ? t("surgeries.add_surgery") : t("surgeries.edit_surgery")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <PatientAutocomplete
                label={t("surgeries.patient")}
                placeholder={t("surgeries.search_patient_placeholder")}
                value={selectedPatient ? `${selectedPatient.firstName || selectedPatient.first_name} ${selectedPatient.lastName || selectedPatient.last_name} (TC: ${selectedPatient.tcNumber || selectedPatient.tc_number})` : ""}
                onSelect={(patient) => {
                  setSelectedPatient(patient);
                  setFormData({ ...formData, patient_id: patient.patient_id || patient._id || "" });
                }}
                isRequired
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={t("surgeries.surgeon")}
                  placeholder={t("surgeries.select_surgeon")}
                  selectedKeys={formData.primary_surgeon_id ? [formData.primary_surgeon_id] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, primary_surgeon_id: Array.from(keys)[0] as string || "" })}
                  isRequired
                >
                  {getSurgeons().map((surgeon) => (
                    <SelectItem key={surgeon._id || surgeon.staff_id || ""}>
                      {surgeon.name}
                      {surgeon.specialization && ` - ${surgeon.specialization}`}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label={t("surgeries.surgery_type")}
                  placeholder={t("surgeries.select_surgery_type")}
                  selectedKeys={formData.surgery_type ? [formData.surgery_type] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, surgery_type: Array.from(keys)[0] as string || "" })}
                  isRequired
                >
                  {surgeryTypes.map((type) => (
                    <SelectItem key={type}>{type}</SelectItem>
                  ))}
                </Select>

                <Input
                  type="date"
                  label={t("surgeries.scheduled_date")}
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  isRequired
                />

                <Input
                  type="time"
                  label={t("surgeries.scheduled_time")}
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  isRequired
                />

                <Input
                  type="number"
                  label={t("surgeries.duration_minutes")}
                  placeholder="120"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  min="0"
                />

                <Select
                  label={t("surgeries.operation_room")}
                  placeholder={t("surgeries.select_room")}
                  selectedKeys={formData.room_id ? [formData.room_id] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, room_id: Array.from(keys)[0] as string || "" })}
                  isRequired
                >
                  {getOperationRooms().map((room) => (
                    <SelectItem key={room.room_id || room._id || ""}>
                      {room.room_number} - {room.room_type}
                      {room.equipment && ` (${room.equipment})`}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  type="number"
                  label={t("surgeries.cost")}
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  startContent={<span className="text-default-400">$</span>}
                  step="0.01"
                  min="0"
                  className="md:col-span-2"
                />
              </div>

              <Textarea
                label={t("surgeries.pre_op_notes")}
                placeholder={t("surgeries.pre_op_notes_placeholder")}
                value={formData.pre_op_notes}
                onChange={(e) => setFormData({ ...formData, pre_op_notes: e.target.value })}
              />

              {!isAddMode && (
                <>
                  <Textarea
                    label={t("surgeries.post_op_notes")}
                    placeholder={t("surgeries.post_op_notes_placeholder")}
                    value={formData.post_op_notes}
                    onChange={(e) => setFormData({ ...formData, post_op_notes: e.target.value })}
                  />

                  <Textarea
                    label={t("surgeries.complications")}
                    placeholder={t("surgeries.complications_placeholder")}
                    value={formData.complications}
                    onChange={(e) => setFormData({ ...formData, complications: e.target.value })}
                  />
                </>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {isAddMode ? t("surgeries.create_surgery") : t("surgeries.update_surgery")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Surgery Details Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t("surgeries.surgery_details")}</ModalHeader>
          <ModalBody>
            {surgeryToView && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t("surgeries.patient")}</p>
                    <p className="font-medium">{getPatientName(surgeryToView.patient_id || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("surgeries.surgeon")}</p>
                    <p className="font-medium">{getStaffName(surgeryToView.primary_surgeon_id || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("surgeries.surgery_type")}</p>
                    <p className="font-medium">{surgeryToView.surgery_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("common.status")}</p>
                    <Chip color={getStatusColor(surgeryToView.status || "")} size="sm">
                      {t(`surgeries.${surgeryToView.status}`) || surgeryToView.status}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("surgeries.scheduled_date")}</p>
                    <p className="font-medium">{formatDate(surgeryToView.scheduled_date || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("surgeries.scheduled_time")}</p>
                    <p className="font-medium">{surgeryToView.scheduled_time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("surgeries.duration_minutes")}</p>
                    <p className="font-medium">{surgeryToView.duration_minutes ? `${surgeryToView.duration_minutes} min` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("surgeries.operation_room")}</p>
                    <p className="font-medium">{getRoomName(surgeryToView.room_id || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("surgeries.cost")}</p>
                    <p className="font-medium">{surgeryToView.cost ? `$${surgeryToView.cost}` : "-"}</p>
                  </div>
                </div>

                {surgeryToView.pre_op_notes && (
                  <div>
                    <p className="text-sm text-gray-500">{t("surgeries.pre_op_notes")}</p>
                    <p className="font-medium">{surgeryToView.pre_op_notes}</p>
                  </div>
                )}

                {surgeryToView.post_op_notes && (
                  <div>
                    <p className="text-sm text-gray-500">{t("surgeries.post_op_notes")}</p>
                    <p className="font-medium">{surgeryToView.post_op_notes}</p>
                  </div>
                )}

                {surgeryToView.complications && (
                  <div>
                    <p className="text-sm text-gray-500">{t("surgeries.complications")}</p>
                    <p className="font-medium">{surgeryToView.complications}</p>
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
          <ModalHeader>{t("surgeries.delete_surgery")}</ModalHeader>
          <ModalBody>
            <p>{t("surgeries.delete_confirmation")}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onDeleteClose}>
              {t("common.cancel")}
            </Button>
            <Button color="danger" onPress={confirmDeleteSurgery}>
              {t("common.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}