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
import { Shield, Search, Trash2, Edit, Plus, Eye, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import { insuranceAPI, patientsAPI } from "@/lib/api";
import { Insurance, Patient } from "@/types";
import { formatDate, getPermissionLevel } from "@/lib/utils";
import toast from "react-hot-toast";
import PatientAutocomplete from "@/components/PatientAutocomplete";

export default function InsurancePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [insurance, setInsurance] = useState<Insurance[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [coverageFilter, setCoverageFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedInsurance, setSelectedInsurance] = useState<Insurance | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // View and delete modals
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [insuranceToView, setInsuranceToView] = useState<Insurance | null>(null);
  const [insuranceToDelete, setInsuranceToDelete] = useState<Insurance | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    patient_id: "",
    company_name: "",
    policy_number: "",
    coverage_type: "",
    coverage_amount: "",
    deductible: "",
    expiry_date: "",
    notes: "",
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const coverageTypes = [
    "Basic",
    "Standard",
    "Premium",
    "Comprehensive",
    "Emergency Only",
    "Dental",
    "Vision",
    "Mental Health",
    "Maternity",
    "Other"
  ];

  useEffect(() => {
    loadInsurance();
    loadPatients();
  }, [currentPage, searchTerm, statusFilter, coverageFilter]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      handleAddInsurance();
      router.replace("/dashboard/insurance");
    }
  }, [searchParams]);

  const loadInsurance = async () => {
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

      if (coverageFilter && coverageFilter !== "all") {
        queryParams.coverage_type = coverageFilter;
      }

      const response = await insuranceAPI.getAll(queryParams);

      if (response.data.insurance) {
        setInsurance(response.data.insurance);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        setInsurance(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      } else {
        setInsurance([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load insurance:", error);
      toast.error(t("insurance.loading_error"));
      setInsurance([]);
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

  const handleAddInsurance = () => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("insurance.insufficient_permissions"));
      return;
    }

    setIsAddMode(true);
    setSelectedInsurance(null);
    setFormData({
      patient_id: "",
      company_name: "",
      policy_number: "",
      coverage_type: "",
      coverage_amount: "",
      deductible: "",
      expiry_date: "",
      notes: "",
    });
    setSelectedPatient(null);
    onOpen();
  };

  const handleEditInsurance = (insurance: Insurance) => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("insurance.insufficient_permissions"));
      return;
    }

    setIsAddMode(false);
    setSelectedInsurance(insurance);

    const patient = patients.find(p => p.patient_id === (insurance.patient_id || insurance.patientId));
    setSelectedPatient(patient || null);

    setFormData({
      patient_id: insurance.patient_id || insurance.patientId || "",
      company_name: insurance.company_name || insurance.companyName || "",
      policy_number: insurance.policy_number || insurance.policyNumber || "",
      coverage_type: insurance.coverage_type || insurance.coverageType || "",
      coverage_amount: insurance.coverage_amount || insurance.coverageAmount ? (insurance.coverage_amount || insurance.coverageAmount)!.toString() : "",
      deductible: insurance.deductible ? insurance.deductible.toString() : "",
      expiry_date: insurance.expiry_date || insurance.expiryDate ? (insurance.expiry_date || insurance.expiryDate)!.split("T")[0] : "",
      notes: insurance.notes || "",
    });

    onOpen();
  };

  const handleViewInsurance = (insurance: Insurance) => {
    setInsuranceToView(insurance);
    onViewOpen();
  };

  const handleDeleteInsurance = (insurance: Insurance) => {
    if (getPermissionLevel(user) < 3) {
      toast.error(t("insurance.insufficient_permissions_delete"));
      return;
    }

    setInsuranceToDelete(insurance);
    onDeleteOpen();
  };

  const confirmDeleteInsurance = async () => {
    if (!insuranceToDelete) return;

    try {
      const insuranceId = insuranceToDelete.insurance_id || insuranceToDelete._id || insuranceToDelete.id?.toString();
      await insuranceAPI.delete(insuranceId || "");
      toast.success(t("insurance.insurance_deleted"));
      loadInsurance();
      onDeleteClose();
      setInsuranceToDelete(null);
    } catch (error) {
      console.error("Failed to delete insurance:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.patient_id) {
        toast.error(t("insurance.patient_required"));
        return;
      }
      if (!formData.company_name.trim()) {
        toast.error(t("insurance.company_name_required"));
        return;
      }
      if (!formData.policy_number.trim()) {
        toast.error(t("insurance.policy_number_required"));
        return;
      }
      if (!formData.coverage_type) {
        toast.error(t("insurance.coverage_type_required"));
        return;
      }

      const apiData = {
        patient_id: formData.patient_id,
        company_name: formData.company_name.trim(),
        policy_number: formData.policy_number.trim(),
        coverage_type: formData.coverage_type,
        coverage_amount: formData.coverage_amount ? parseFloat(formData.coverage_amount) : 0,
        deductible: formData.deductible ? parseFloat(formData.deductible) : 0,
        expiry_date: formData.expiry_date || null,
        notes: formData.notes.trim(),
        status: isAddMode ? "active" : selectedInsurance?.status || "active",
      };

      if (isAddMode) {
        await insuranceAPI.create(apiData);
        toast.success(t("insurance.insurance_created"));
      } else {
        const insuranceId = selectedInsurance!.insurance_id || selectedInsurance!._id || selectedInsurance!.id?.toString();
        await insuranceAPI.update(insuranceId || "", apiData);
        toast.success(t("insurance.insurance_updated"));
      }
      onClose();
      loadInsurance();
    } catch (error: any) {
      console.error("Failed to save insurance:", error);
      const errorMessage = error?.response?.data?.error || error?.message || t("common.error_saving");
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (insuranceId: string, newStatus: string) => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("insurance.insufficient_permissions"));
      return;
    }

    try {
      await insuranceAPI.update(insuranceId, { status: newStatus });
      toast.success(t("insurance.status_updated"));
      loadInsurance();
    } catch (error) {
      console.error("Failed to update insurance status:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "inactive": return "default";
      case "expired": return "danger";
      default: return "default";
    }
  };

  const isExpiryExpiring = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const monthFromNow = new Date();
    monthFromNow.setMonth(today.getMonth() + 1);
    return expiry <= monthFromNow && expiry > today;
  };

  const isExpiryExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => (p.patient_id === patientId) || (p._id === patientId));
    if (patient) {
      const name = patient.name || `${patient.first_name || patient.firstName || ""} ${patient.last_name || patient.lastName || ""}`.trim();
      return name || t("insurance.unknown_patient");
    }
    return t("insurance.unknown_patient");
  };

  const renderCell = (insurance: Insurance, columnKey: string) => {
    switch (columnKey) {
      case "patient":
        return getPatientName(insurance.patient_id || insurance.patientId || "");
      case "insurance_info":
        return (
          <div>
            <p className="font-medium">{insurance.company_name || insurance.companyName}</p>
            <p className="text-sm text-gray-500">{insurance.policy_number || insurance.policyNumber}</p>
          </div>
        );
      case "coverage":
        return (
          <div>
            <p className="font-medium">{insurance.coverage_type || insurance.coverageType}</p>
            <p className="text-sm text-gray-500">
              {insurance.coverage_amount || insurance.coverageAmount ? `$${(insurance.coverage_amount || insurance.coverageAmount)!.toLocaleString()}` : "-"}
            </p>
          </div>
        );
      case "expiry":
        const expiryDate = insurance.expiry_date || insurance.expiryDate || "";
        const expired = isExpiryExpired(expiryDate);
        const expiring = isExpiryExpiring(expiryDate);
        return (
          <div className="flex items-center gap-2">
            {(expired || expiring) && (
              <AlertTriangle 
                size={16} 
                className={expired ? "text-red-500" : "text-yellow-500"} 
              />
            )}
            <div>
              <p className={`font-medium ${expired ? "text-red-500" : expiring ? "text-yellow-500" : ""}`}>
                {expiryDate ? formatDate(expiryDate) : "-"}
              </p>
              {expired && <p className="text-xs text-red-500">Expired</p>}
              {!expired && expiring && <p className="text-xs text-yellow-500">Expires Soon</p>}
            </div>
          </div>
        );
      case "status":
        return (
          <Chip color={getStatusColor(insurance.status || "")} size="sm">
            {t(`insurance.${insurance.status}`) || insurance.status || "active"}
          </Chip>
        );
      case "actions":
        const insuranceId = insurance.insurance_id || insurance._id || insurance.id?.toString() || "";
        return (
          <div className="flex gap-2 items-center">
            <Button size="sm" color="secondary" variant="flat" onPress={() => handleViewInsurance(insurance)}>
              <Eye size={16} />
            </Button>
            {getPermissionLevel(user) >= 2 && (
              <>
                <Button size="sm" color="primary" variant="flat" onPress={() => handleEditInsurance(insurance)}>
                  <Edit size={16} />
                </Button>
                <Select
                  size="sm"
                  placeholder="Status"
                  className="w-32"
                  selectedKeys={insurance.status ? [insurance.status] : []}
                  onSelectionChange={(keys) => {
                    const newStatus = Array.from(keys)[0] as string;
                    if (newStatus !== insurance.status) {
                      handleStatusChange(insuranceId, newStatus);
                    }
                  }}
                >
                  <SelectItem key="active">{t("insurance.active")}</SelectItem>
                  <SelectItem key="inactive">{t("insurance.inactive")}</SelectItem>
                  <SelectItem key="expired">{t("insurance.expired")}</SelectItem>
                </Select>
                {getPermissionLevel(user) >= 3 && (
                  <Button size="sm" color="danger" variant="flat" onPress={() => handleDeleteInsurance(insurance)}>
                    <Trash2 size={16} />
                  </Button>
                )}
              </>
            )}
          </div>
        );
      default:
        return insurance[columnKey as keyof Insurance];
    }
  };

  const columns = [
    { key: "patient", label: t("insurance.patient") },
    { key: "insurance_info", label: t("insurance.insurance_info") },
    { key: "coverage", label: t("insurance.coverage") },
    { key: "expiry", label: t("insurance.expiry_date") },
    { key: "status", label: t("common.status") },
    { key: "actions", label: t("common.actions") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("insurance.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("insurance.subtitle")}
          </p>
        </div>
        {getPermissionLevel(user) >= 2 && (
          <Button color="primary" onPress={handleAddInsurance}>
            <Plus className="mr-2" size={20} />
            {t("insurance.add_insurance")}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <Input
              placeholder={t("insurance.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<Search size={16} />}
              isClearable
            />
            <Select
              placeholder={t("insurance.filter_by_status")}
              className="lg:w-40"
              selectedKeys={statusFilter !== "all" ? [statusFilter] : []}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("insurance.all_status")}</SelectItem>
              <SelectItem key="active">{t("insurance.active")}</SelectItem>
              <SelectItem key="inactive">{t("insurance.inactive")}</SelectItem>
              <SelectItem key="expired">{t("insurance.expired")}</SelectItem>
            </Select>
            <Select
              placeholder={t("insurance.filter_by_coverage")}
              className="lg:w-40"
              selectedKeys={coverageFilter !== "all" ? [coverageFilter] : []}
              onSelectionChange={(keys) => setCoverageFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("insurance.all_coverage_types")}</SelectItem>
              {coverageTypes.map((type) => (
                <SelectItem key={type}>
                  {type}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Insurance Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Insurance table">
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={t("insurance.loading_insurance")}
              emptyContent={t("insurance.no_insurance")}
            >
              {insurance.map((item) => (
                <TableRow key={item.id || item.insurance_id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(item, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {insurance.length > 0 && totalPages > 1 && (
            <div className="flex justify-center p-4">
              <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Insurance Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {isAddMode ? t("insurance.add_insurance") : t("insurance.edit_insurance")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <PatientAutocomplete
                label={t("insurance.patient")}
                placeholder={t("insurance.search_patient_placeholder")}
                value={selectedPatient ? `${selectedPatient.firstName || selectedPatient.first_name} ${selectedPatient.lastName || selectedPatient.last_name} (TC: ${selectedPatient.tcNumber || selectedPatient.tc_number})` : ""}
                onSelect={(patient) => {
                  setSelectedPatient(patient);
                  setFormData({ ...formData, patient_id: patient.patient_id || patient._id || "" });
                }}
                isRequired
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t("insurance.company_name")}
                  placeholder={t("insurance.company_name_placeholder")}
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  isRequired
                />

                <Input
                  label={t("insurance.policy_number")}
                  placeholder={t("insurance.policy_number_placeholder")}
                  value={formData.policy_number}
                  onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                  isRequired
                />

                <Select
                  label={t("insurance.coverage_type")}
                  placeholder={t("insurance.select_coverage_type")}
                  selectedKeys={formData.coverage_type ? [formData.coverage_type] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, coverage_type: Array.from(keys)[0] as string || "" })}
                  isRequired
                >
                  {coverageTypes.map((type) => (
                    <SelectItem key={type}>
                      {type}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  type="date"
                  label={t("insurance.expiry_date")}
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />

                <Input
                  type="number"
                  label={t("insurance.coverage_amount")}
                  placeholder="0.00"
                  value={formData.coverage_amount}
                  onChange={(e) => setFormData({ ...formData, coverage_amount: e.target.value })}
                  startContent={<span className="text-default-400">$</span>}
                  step="0.01"
                  min="0"
                />

                <Input
                  type="number"
                  label={t("insurance.deductible")}
                  placeholder="0.00"
                  value={formData.deductible}
                  onChange={(e) => setFormData({ ...formData, deductible: e.target.value })}
                  startContent={<span className="text-default-400">$</span>}
                  step="0.01"
                  min="0"
                />
              </div>

              <Textarea
                label={t("insurance.notes")}
                placeholder={t("insurance.notes_placeholder")}
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
              {isAddMode ? t("insurance.create_insurance") : t("insurance.update_insurance")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Insurance Details Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t("insurance.insurance_details")}</ModalHeader>
          <ModalBody>
            {insuranceToView && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t("insurance.patient")}</p>
                    <p className="font-medium">{getPatientName(insuranceToView.patient_id || insuranceToView.patientId || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("insurance.company_name")}</p>
                    <p className="font-medium">{insuranceToView.company_name || insuranceToView.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("insurance.policy_number")}</p>
                    <p className="font-medium">{insuranceToView.policy_number || insuranceToView.policyNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("insurance.coverage_type")}</p>
                    <p className="font-medium">{insuranceToView.coverage_type || insuranceToView.coverageType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("insurance.coverage_amount")}</p>
                    <p className="font-medium">
                      {insuranceToView.coverage_amount || insuranceToView.coverageAmount 
                        ? `$${(insuranceToView.coverage_amount || insuranceToView.coverageAmount)!.toLocaleString()}` 
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("insurance.deductible")}</p>
                    <p className="font-medium">
                      {insuranceToView.deductible ? `$${insuranceToView.deductible.toLocaleString()}` : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("insurance.expiry_date")}</p>
                    <p className={`font-medium ${isExpiryExpired(insuranceToView.expiry_date || insuranceToView.expiryDate || "") ? "text-red-500" : isExpiryExpiring(insuranceToView.expiry_date || insuranceToView.expiryDate || "") ? "text-yellow-500" : ""}`}>
                      {insuranceToView.expiry_date || insuranceToView.expiryDate ? formatDate(insuranceToView.expiry_date || insuranceToView.expiryDate || "") : "-"}
                      {isExpiryExpired(insuranceToView.expiry_date || insuranceToView.expiryDate || "") && " (Expired)"}
                      {!isExpiryExpired(insuranceToView.expiry_date || insuranceToView.expiryDate || "") && isExpiryExpiring(insuranceToView.expiry_date || insuranceToView.expiryDate || "") && " (Expires Soon)"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("common.status")}</p>
                    <Chip color={getStatusColor(insuranceToView.status || "")} size="sm">
                      {t(`insurance.${insuranceToView.status}`) || insuranceToView.status}
                    </Chip>
                  </div>
                </div>

                {insuranceToView.notes && (
                  <div>
                    <p className="text-sm text-gray-500">{t("insurance.notes")}</p>
                    <p className="font-medium">{insuranceToView.notes}</p>
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
          <ModalHeader>{t("insurance.delete_insurance")}</ModalHeader>
          <ModalBody>
            <p>{t("insurance.delete_confirmation")}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onDeleteClose}>
              {t("common.cancel")}
            </Button>
            <Button color="danger" onPress={confirmDeleteInsurance}>
              {t("common.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}