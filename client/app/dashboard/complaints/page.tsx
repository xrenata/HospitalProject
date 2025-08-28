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
import { MessageSquare, Search, Trash2, Edit, Plus, Eye, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import { complaintsAPI, patientsAPI, staffAPI } from "@/lib/api";
import { Complaint, Patient, Staff } from "@/types";
import { formatDate, getPermissionLevel } from "@/lib/utils";
import toast from "react-hot-toast";
import PatientAutocomplete from "@/components/PatientAutocomplete";

export default function ComplaintsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // View and delete modals
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [complaintToView, setComplaintToView] = useState<Complaint | null>(null);
  const [complaintToDelete, setComplaintToDelete] = useState<Complaint | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    patient_id: "",
    complaint_text: "",
    category: "",
    priority: "",
    assigned_to: "",
    resolution: "",
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const complaintCategories = [
    "service",
    "billing", 
    "medical",
    "facility",
    "staff",
    "other"
  ];

  const priorityLevels = [
    "low",
    "medium",
    "high",
    "urgent"
  ];

  useEffect(() => {
    loadComplaints();
    loadPatients();
    loadStaff();
  }, [currentPage, searchTerm, statusFilter, categoryFilter, priorityFilter]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      handleAddComplaint();
      router.replace("/dashboard/complaints");
    }
  }, [searchParams]);

  const loadComplaints = async () => {
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

      if (categoryFilter && categoryFilter !== "all") {
        queryParams.category = categoryFilter;
      }

      if (priorityFilter && priorityFilter !== "all") {
        queryParams.priority = priorityFilter;
      }

      const response = await complaintsAPI.getAll(queryParams);

      if (response.data.complaints) {
        setComplaints(response.data.complaints);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        setComplaints(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      } else {
        setComplaints([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load complaints:", error);
      toast.error(t("complaints.loading_error"));
      setComplaints([]);
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

  const handleAddComplaint = () => {
    setIsAddMode(true);
    setSelectedComplaint(null);
    setFormData({
      patient_id: "",
      complaint_text: "",
      category: "",
      priority: "",
      assigned_to: "",
      resolution: "",
    });
    setSelectedPatient(null);
    onOpen();
  };

  const handleEditComplaint = (complaint: Complaint) => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("complaints.insufficient_permissions"));
      return;
    }

    setIsAddMode(false);
    setSelectedComplaint(complaint);

    const patient = patients.find(p => p.patient_id === complaint.patient_id);
    setSelectedPatient(patient || null);

    setFormData({
      patient_id: complaint.patient_id || "",
      complaint_text: complaint.complaint_text || "",
      category: complaint.category || "",
      priority: complaint.priority || "",
      assigned_to: complaint.assigned_to || "",
      resolution: complaint.resolution || "",
    });

    onOpen();
  };

  const handleViewComplaint = (complaint: Complaint) => {
    setComplaintToView(complaint);
    onViewOpen();
  };

  const handleDeleteComplaint = (complaint: Complaint) => {
    if (getPermissionLevel(user) < 3) {
      toast.error(t("complaints.insufficient_permissions_delete"));
      return;
    }

    setComplaintToDelete(complaint);
    onDeleteOpen();
  };

  const confirmDeleteComplaint = async () => {
    if (!complaintToDelete) return;

    try {
      const complaintId = complaintToDelete.complaint_id || complaintToDelete._id || complaintToDelete.id?.toString();
      await complaintsAPI.delete(complaintId || "");
      toast.success(t("complaints.complaint_deleted"));
      loadComplaints();
      onDeleteClose();
      setComplaintToDelete(null);
    } catch (error) {
      console.error("Failed to delete complaint:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.patient_id) {
        toast.error(t("complaints.patient_required"));
        return;
      }
      if (!formData.complaint_text.trim()) {
        toast.error(t("complaints.complaint_text_required"));
        return;
      }
      if (!formData.category) {
        toast.error(t("complaints.category_required"));
        return;
      }
      if (!formData.priority) {
        toast.error(t("complaints.priority_required"));
        return;
      }

      const apiData = {
        patient_id: formData.patient_id,
        complaint_text: formData.complaint_text.trim(),
        category: formData.category,
        priority: formData.priority,
        assigned_to: formData.assigned_to || null,
        resolution: formData.resolution.trim(),
        status: isAddMode ? "open" : selectedComplaint?.status || "open",
      };

      if (isAddMode) {
        await complaintsAPI.create(apiData);
        toast.success(t("complaints.complaint_created"));
      } else {
        const complaintId = selectedComplaint!.complaint_id || selectedComplaint!._id || selectedComplaint!.id?.toString();
        await complaintsAPI.update(complaintId || "", apiData);
        toast.success(t("complaints.complaint_updated"));
      }
      onClose();
      loadComplaints();
    } catch (error: any) {
      console.error("Failed to save complaint:", error);
      const errorMessage = error?.response?.data?.error || error?.message || t("common.error_saving");
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("complaints.insufficient_permissions"));
      return;
    }

    try {
      await complaintsAPI.update(complaintId, { status: newStatus });
      toast.success(t("complaints.status_updated"));
      loadComplaints();
    } catch (error) {
      console.error("Failed to update complaint status:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "danger";
      case "in-progress": return "warning";
      case "resolved": return "success";
      case "closed": return "default";
      default: return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "danger";
      case "high": return "warning";
      case "medium": return "primary";
      case "low": return "default";
      default: return "default";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "medical": return "danger";
      case "service": return "warning";
      case "billing": return "primary";
      case "facility": return "secondary";
      case "staff": return "success";
      case "other": return "default";
      default: return "default";
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => (p.patient_id === patientId) || (p._id === patientId));
    if (patient) {
      const name = patient.name || `${patient.first_name || patient.firstName || ""} ${patient.last_name || patient.lastName || ""}`.trim();
      return name || t("complaints.unknown_patient");
    }
    return t("complaints.unknown_patient");
  };

  const getStaffName = (staffId: string) => {
    if (!staffId) return "-";
    const staffMember = staff.find(s => (s.staff_id === staffId) || (s._id === staffId));
    return staffMember?.name || t("complaints.unknown_staff");
  };

  const renderCell = (complaint: Complaint, columnKey: string) => {
    switch (columnKey) {
      case "patient":
        return getPatientName(complaint.patient_id || "");
      case "complaint_info":
        return (
          <div>
            <p className="font-medium text-sm">{complaint.complaint_text?.substring(0, 50)}...</p>
            <div className="flex gap-1 mt-1">
              <Chip color={getCategoryColor(complaint.category || "")} size="sm" variant="flat">
                {t(`complaints.${complaint.category}`) || complaint.category}
              </Chip>
              <Chip color={getPriorityColor(complaint.priority || "")} size="sm" variant="flat">
                {t(`complaints.${complaint.priority}`) || complaint.priority}
              </Chip>
            </div>
          </div>
        );
      case "assigned_to":
        return getStaffName(complaint.assigned_to || "");
      case "status":
        return (
          <Chip color={getStatusColor(complaint.status || "")} size="sm">
            {t(`complaints.${complaint.status}`) || complaint.status || "open"}
          </Chip>
        );
      case "date":
        return formatDate(complaint.created_at || "");
      case "actions":
        const complaintId = complaint.complaint_id || complaint._id || complaint.id?.toString() || "";
        return (
          <div className="flex gap-2 items-center">
            <Button size="sm" color="secondary" variant="flat" onPress={() => handleViewComplaint(complaint)}>
              <Eye size={16} />
            </Button>
            {getPermissionLevel(user) >= 2 && (
              <>
                <Button size="sm" color="primary" variant="flat" onPress={() => handleEditComplaint(complaint)}>
                  <Edit size={16} />
                </Button>
                <Select
                  size="sm"
                  placeholder="Status"
                  className="w-32"
                  selectedKeys={complaint.status ? [complaint.status] : []}
                  onSelectionChange={(keys) => {
                    const newStatus = Array.from(keys)[0] as string;
                    if (newStatus !== complaint.status) {
                      handleStatusChange(complaintId, newStatus);
                    }
                  }}
                >
                  <SelectItem key="open">{t("complaints.open")}</SelectItem>
                  <SelectItem key="in-progress">{t("complaints.in_progress")}</SelectItem>
                  <SelectItem key="resolved">{t("complaints.resolved")}</SelectItem>
                  <SelectItem key="closed">{t("complaints.closed")}</SelectItem>
                </Select>
                {getPermissionLevel(user) >= 3 && (
                  <Button size="sm" color="danger" variant="flat" onPress={() => handleDeleteComplaint(complaint)}>
                    <Trash2 size={16} />
                  </Button>
                )}
              </>
            )}
          </div>
        );
      default:
        return complaint[columnKey as keyof Complaint];
    }
  };

  const columns = [
    { key: "patient", label: t("complaints.patient") },
    { key: "complaint_info", label: t("complaints.complaint_info") },
    { key: "assigned_to", label: t("complaints.assigned_to") },
    { key: "status", label: t("common.status") },
    { key: "date", label: t("complaints.date") },
    { key: "actions", label: t("common.actions") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("complaints.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("complaints.subtitle")}
          </p>
        </div>
        <Button color="primary" onPress={handleAddComplaint}>
          <Plus className="mr-2" size={20} />
          {t("complaints.add_complaint")}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <Input
              placeholder={t("complaints.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<Search size={16} />}
              isClearable
            />
            <Select
              placeholder={t("complaints.filter_by_status")}
              className="lg:w-40"
              selectedKeys={statusFilter !== "all" ? [statusFilter] : []}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("complaints.all_status")}</SelectItem>
              <SelectItem key="open">{t("complaints.open")}</SelectItem>
              <SelectItem key="in-progress">{t("complaints.in_progress")}</SelectItem>
              <SelectItem key="resolved">{t("complaints.resolved")}</SelectItem>
              <SelectItem key="closed">{t("complaints.closed")}</SelectItem>
            </Select>
            <Select
              placeholder={t("complaints.filter_by_category")}
              className="lg:w-40"
              selectedKeys={categoryFilter !== "all" ? [categoryFilter] : []}
              onSelectionChange={(keys) => setCategoryFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("complaints.all_categories")}</SelectItem>
              {complaintCategories.map((category) => (
                <SelectItem key={category}>
                  {t(`complaints.${category}`)}
                </SelectItem>
              ))}
            </Select>
            <Select
              placeholder={t("complaints.filter_by_priority")}
              className="lg:w-40"
              selectedKeys={priorityFilter !== "all" ? [priorityFilter] : []}
              onSelectionChange={(keys) => setPriorityFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("complaints.all_priorities")}</SelectItem>
              {priorityLevels.map((priority) => (
                <SelectItem key={priority}>
                  {t(`complaints.${priority}`)}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Complaints Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Complaints table">
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={t("complaints.loading_complaints")}
              emptyContent={t("complaints.no_complaints")}
            >
              {complaints.map((complaint) => (
                <TableRow key={complaint.id || complaint.complaint_id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(complaint, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {complaints.length > 0 && totalPages > 1 && (
            <div className="flex justify-center p-4">
              <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Complaint Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {isAddMode ? t("complaints.add_complaint") : t("complaints.edit_complaint")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <PatientAutocomplete
                label={t("complaints.patient")}
                placeholder={t("complaints.search_patient_placeholder")}
                value={selectedPatient ? `${selectedPatient.firstName || selectedPatient.first_name} ${selectedPatient.lastName || selectedPatient.last_name} (TC: ${selectedPatient.tcNumber || selectedPatient.tc_number})` : ""}
                onSelect={(patient) => {
                  setSelectedPatient(patient);
                  setFormData({ ...formData, patient_id: patient.patient_id || patient._id || "" });
                }}
                isRequired
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={t("complaints.category")}
                  placeholder={t("complaints.select_category")}
                  selectedKeys={formData.category ? [formData.category] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, category: Array.from(keys)[0] as string || "" })}
                  isRequired
                >
                  {complaintCategories.map((category) => (
                    <SelectItem key={category}>
                      {t(`complaints.${category}`)}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label={t("complaints.priority")}
                  placeholder={t("complaints.select_priority")}
                  selectedKeys={formData.priority ? [formData.priority] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, priority: Array.from(keys)[0] as string || "" })}
                  isRequired
                >
                  {priorityLevels.map((priority) => (
                    <SelectItem key={priority}>
                      {t(`complaints.${priority}`)}
                    </SelectItem>
                  ))}
                </Select>

                {getPermissionLevel(user) >= 2 && (
                  <Select
                    label={t("complaints.assign_to")}
                    placeholder={t("complaints.select_staff")}
                    selectedKeys={formData.assigned_to ? [formData.assigned_to] : []}
                    onSelectionChange={(keys) => setFormData({ ...formData, assigned_to: Array.from(keys)[0] as string || "" })}
                    className="md:col-span-2"
                  >
                    {staff.filter(s => s.status === 'active').map((staffMember) => (
                      <SelectItem key={staffMember._id || staffMember.staff_id || ""}>
                        {staffMember.name} ({staffMember.role})
                      </SelectItem>
                    ))}
                  </Select>
                )}
              </div>

              <Textarea
                label={t("complaints.complaint_text")}
                placeholder={t("complaints.complaint_text_placeholder")}
                value={formData.complaint_text}
                onChange={(e) => setFormData({ ...formData, complaint_text: e.target.value })}
                isRequired
                minRows={4}
              />

              {!isAddMode && (
                <Textarea
                  label={t("complaints.resolution")}
                  placeholder={t("complaints.resolution_placeholder")}
                  value={formData.resolution}
                  onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                  minRows={3}
                />
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {isAddMode ? t("complaints.create_complaint") : t("complaints.update_complaint")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Complaint Details Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t("complaints.complaint_details")}</ModalHeader>
          <ModalBody>
            {complaintToView && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t("complaints.patient")}</p>
                    <p className="font-medium">{getPatientName(complaintToView.patient_id || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("complaints.date")}</p>
                    <p className="font-medium">{formatDate(complaintToView.created_at || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("complaints.category")}</p>
                    <Chip color={getCategoryColor(complaintToView.category || "")} size="sm">
                      {t(`complaints.${complaintToView.category}`) || complaintToView.category}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("complaints.priority")}</p>
                    <Chip color={getPriorityColor(complaintToView.priority || "")} size="sm">
                      {t(`complaints.${complaintToView.priority}`) || complaintToView.priority}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("common.status")}</p>
                    <Chip color={getStatusColor(complaintToView.status || "")} size="sm">
                      {t(`complaints.${complaintToView.status}`) || complaintToView.status}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("complaints.assigned_to")}</p>
                    <p className="font-medium">{getStaffName(complaintToView.assigned_to || "")}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">{t("complaints.complaint_text")}</p>
                  <p className="font-medium">{complaintToView.complaint_text}</p>
                </div>

                {complaintToView.resolution && (
                  <div>
                    <p className="text-sm text-gray-500">{t("complaints.resolution")}</p>
                    <p className="font-medium">{complaintToView.resolution}</p>
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
          <ModalHeader>{t("complaints.delete_complaint")}</ModalHeader>
          <ModalBody>
            <p>{t("complaints.delete_confirmation")}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onDeleteClose}>
              {t("common.cancel")}
            </Button>
            <Button color="danger" onPress={confirmDeleteComplaint}>
              {t("common.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}