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
import { Pill, Search, Trash2, Edit, Plus, Eye, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import { medicationsAPI } from "@/lib/api";
import { Medication } from "@/types";
import { formatDate, getPermissionLevel } from "@/lib/utils";
import toast from "react-hot-toast";

export default function MedicationsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // View and delete modals
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [medicationToView, setMedicationToView] = useState<Medication | null>(null);
  const [medicationToDelete, setMedicationToDelete] = useState<Medication | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dosage: "",
    manufacturer: "",
    expiry_date: "",
    stock_quantity: "",
    price: "",
    category: "",
    side_effects: "",
  });

  const medicationCategories = [
    "Antibiotics",
    "Pain Relief",
    "Heart & Blood",
    "Diabetes",
    "Mental Health",
    "Respiratory",
    "Digestive",
    "Vitamins & Supplements",
    "Topical",
    "Emergency",
    "Other"
  ];

  useEffect(() => {
    loadMedications();
  }, [currentPage, searchTerm, categoryFilter]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      handleAddMedication();
      router.replace("/dashboard/medications");
    }
  }, [searchParams]);

  const loadMedications = async () => {
    setLoading(true);
    try {
      const queryParams: any = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
      };

      if (categoryFilter && categoryFilter !== "all") {
        queryParams.category = categoryFilter;
      }

      const response = await medicationsAPI.getAll(queryParams);

      if (response.data.medications) {
        setMedications(response.data.medications);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        setMedications(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      } else {
        setMedications([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load medications:", error);
      toast.error(t("medications.loading_error"));
      setMedications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    setIsAddMode(true);
    setSelectedMedication(null);
    setFormData({
      name: "",
      description: "",
      dosage: "",
      manufacturer: "",
      expiry_date: "",
      stock_quantity: "",
      price: "",
      category: "",
      side_effects: "",
    });
    onOpen();
  };

  const handleEditMedication = (medication: Medication) => {
    setIsAddMode(false);
    setSelectedMedication(medication);

    setFormData({
      name: medication.name || "",
      description: medication.description || "",
      dosage: medication.dosage || "",
      manufacturer: medication.manufacturer || "",
      expiry_date: medication.expiry_date ? medication.expiry_date.split("T")[0] : "",
      stock_quantity: medication.stock_quantity ? medication.stock_quantity.toString() : "",
      price: medication.price ? medication.price.toString() : "",
      category: medication.category || "",
      side_effects: medication.side_effects || "",
    });

    onOpen();
  };

  const handleViewMedication = (medication: Medication) => {
    setMedicationToView(medication);
    onViewOpen();
  };

  const handleDeleteMedication = (medication: Medication) => {
    setMedicationToDelete(medication);
    onDeleteOpen();
  };

  const confirmDeleteMedication = async () => {
    if (!medicationToDelete) return;

    try {
      const medicationId = medicationToDelete.medication_id || medicationToDelete._id || medicationToDelete.id?.toString();
      await medicationsAPI.delete(medicationId || "");
      toast.success(t("medications.medication_deleted"));
      loadMedications();
      onDeleteClose();
      setMedicationToDelete(null);
    } catch (error) {
      console.error("Failed to delete medication:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error(t("medications.name_required"));
        return;
      }
      if (!formData.dosage.trim()) {
        toast.error(t("medications.dosage_required"));
        return;
      }
      if (!formData.manufacturer.trim()) {
        toast.error(t("medications.manufacturer_required"));
        return;
      }
      if (!formData.expiry_date) {
        toast.error(t("medications.expiry_date_required"));
        return;
      }

      const apiData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        dosage: formData.dosage.trim(),
        manufacturer: formData.manufacturer.trim(),
        expiry_date: formData.expiry_date,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : 0,
        price: formData.price ? parseFloat(formData.price) : 0,
        category: formData.category || "Other",
        side_effects: formData.side_effects.trim(),
      };

      if (isAddMode) {
        await medicationsAPI.create(apiData);
        toast.success(t("medications.medication_created"));
      } else {
        const medicationId = selectedMedication!.medication_id || selectedMedication!._id || selectedMedication!.id?.toString();
        await medicationsAPI.update(medicationId || "", apiData);
        toast.success(t("medications.medication_updated"));
      }
      onClose();
      loadMedications();
    } catch (error: any) {
      console.error("Failed to save medication:", error);
      const errorMessage = error?.response?.data?.error || error?.message || t("common.error_saving");
      toast.error(errorMessage);
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const monthFromNow = new Date();
    monthFromNow.setMonth(today.getMonth() + 1);
    return expiry <= monthFromNow;
  };

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { color: "danger", text: "Out of Stock" };
    if (quantity < 10) return { color: "warning", text: "Low Stock" };
    return { color: "success", text: "In Stock" };
  };

  const renderCell = (medication: Medication, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return (
          <div>
            <p className="font-medium">{medication.name}</p>
            <p className="text-sm text-gray-500">{medication.dosage}</p>
          </div>
        );
      case "manufacturer":
        return (
          <div>
            <p className="font-medium">{medication.manufacturer}</p>
            <p className="text-sm text-gray-500">{medication.category}</p>
          </div>
        );
      case "stock":
        const stockStatus = getStockStatus(medication.stock_quantity || 0);
        return (
          <div>
            <p className="font-medium">{medication.stock_quantity || 0} units</p>
            <Chip color={stockStatus.color as any} size="sm" variant="flat">
              {stockStatus.text}
            </Chip>
          </div>
        );
      case "expiry":
        const expired = isExpired(medication.expiry_date || "");
        const expiringSoon = isExpiringSoon(medication.expiry_date || "");
        return (
          <div className="flex items-center gap-2">
            {(expired || expiringSoon) && (
              <AlertTriangle 
                size={16} 
                className={expired ? "text-red-500" : "text-yellow-500"} 
              />
            )}
            <div>
              <p className={`font-medium ${expired ? "text-red-500" : expiringSoon ? "text-yellow-500" : ""}`}>
                {formatDate(medication.expiry_date || "")}
              </p>
              {expired && <p className="text-xs text-red-500">Expired</p>}
              {!expired && expiringSoon && <p className="text-xs text-yellow-500">Expires Soon</p>}
            </div>
          </div>
        );
      case "price":
        return medication.price ? `$${medication.price.toFixed(2)}` : "-";
      case "actions":
        const medicationId = medication.medication_id || medication._id || medication.id?.toString() || "";
        return (
          <div className="flex gap-2 items-center">
            <Button size="sm" color="secondary" variant="flat" onPress={() => handleViewMedication(medication)}>
              <Eye size={16} />
            </Button>
            {getPermissionLevel(user) >= 2 && (
              <>
                <Button size="sm" color="primary" variant="flat" onPress={() => handleEditMedication(medication)}>
                  <Edit size={16} />
                </Button>
                <Button size="sm" color="danger" variant="flat" onPress={() => handleDeleteMedication(medication)}>
                  <Trash2 size={16} />
                </Button>
              </>
            )}
          </div>
        );
      default:
        return medication[columnKey as keyof Medication];
    }
  };

  const columns = [
    { key: "name", label: t("medications.name_dosage") },
    { key: "manufacturer", label: t("medications.manufacturer_category") },
    { key: "stock", label: t("medications.stock_status") },
    { key: "expiry", label: t("medications.expiry_date") },
    { key: "price", label: t("medications.price") },
    { key: "actions", label: t("common.actions") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("medications.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("medications.subtitle")}
          </p>
        </div>
        {getPermissionLevel(user) >= 2 && (
          <Button color="primary" onPress={handleAddMedication}>
            <Plus className="mr-2" size={20} />
            {t("medications.add_medication")}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder={t("medications.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<Search size={16} />}
              isClearable
            />
            <Select
              placeholder={t("medications.filter_by_category")}
              className="sm:w-48"
              selectedKeys={categoryFilter !== "all" ? [categoryFilter] : []}
              onSelectionChange={(keys) => setCategoryFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("medications.all_categories")}</SelectItem>
              {medicationCategories.map((category) => (
                <SelectItem key={category}>
                  {category}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Medications Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Medications table">
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={t("medications.loading_medications")}
              emptyContent={t("medications.no_medications")}
            >
              {medications.map((medication) => (
                <TableRow key={medication.id || medication.medication_id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(medication, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {medications.length > 0 && totalPages > 1 && (
            <div className="flex justify-center p-4">
              <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Medication Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {isAddMode ? t("medications.add_medication") : t("medications.edit_medication")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t("medications.name")}
                  placeholder={t("medications.name_placeholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  isRequired
                />

                <Input
                  label={t("medications.dosage")}
                  placeholder={t("medications.dosage_placeholder")}
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  isRequired
                />

                <Input
                  label={t("medications.manufacturer")}
                  placeholder={t("medications.manufacturer_placeholder")}
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  isRequired
                />

                <Select
                  label={t("medications.category")}
                  placeholder={t("medications.select_category")}
                  selectedKeys={formData.category ? [formData.category] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, category: Array.from(keys)[0] as string || "" })}
                >
                  {medicationCategories.map((category) => (
                    <SelectItem key={category}>
                      {category}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  type="date"
                  label={t("medications.expiry_date")}
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  isRequired
                />

                <Input
                  type="number"
                  label={t("medications.stock_quantity")}
                  placeholder="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  min="0"
                />

                <Input
                  type="number"
                  label={t("medications.price")}
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  startContent={<span className="text-default-400">$</span>}
                  step="0.01"
                  min="0"
                  className="md:col-span-2"
                />
              </div>

              <Textarea
                label={t("medications.description")}
                placeholder={t("medications.description_placeholder")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <Textarea
                label={t("medications.side_effects")}
                placeholder={t("medications.side_effects_placeholder")}
                value={formData.side_effects}
                onChange={(e) => setFormData({ ...formData, side_effects: e.target.value })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {isAddMode ? t("medications.create_medication") : t("medications.update_medication")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Medication Details Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t("medications.medication_details")}</ModalHeader>
          <ModalBody>
            {medicationToView && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t("medications.name")}</p>
                    <p className="font-medium">{medicationToView.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("medications.dosage")}</p>
                    <p className="font-medium">{medicationToView.dosage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("medications.manufacturer")}</p>
                    <p className="font-medium">{medicationToView.manufacturer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("medications.category")}</p>
                    <p className="font-medium">{medicationToView.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("medications.stock_quantity")}</p>
                    <p className="font-medium">{medicationToView.stock_quantity} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("medications.price")}</p>
                    <p className="font-medium">${medicationToView.price?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("medications.expiry_date")}</p>
                    <p className={`font-medium ${isExpired(medicationToView.expiry_date || "") ? "text-red-500" : isExpiringSoon(medicationToView.expiry_date || "") ? "text-yellow-500" : ""}`}>
                      {formatDate(medicationToView.expiry_date || "")}
                      {isExpired(medicationToView.expiry_date || "") && " (Expired)"}
                      {!isExpired(medicationToView.expiry_date || "") && isExpiringSoon(medicationToView.expiry_date || "") && " (Expires Soon)"}
                    </p>
                  </div>
                </div>

                {medicationToView.description && (
                  <div>
                    <p className="text-sm text-gray-500">{t("medications.description")}</p>
                    <p className="font-medium">{medicationToView.description}</p>
                  </div>
                )}

                {medicationToView.side_effects && (
                  <div>
                    <p className="text-sm text-gray-500">{t("medications.side_effects")}</p>
                    <p className="font-medium">{medicationToView.side_effects}</p>
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
          <ModalHeader>{t("medications.delete_medication")}</ModalHeader>
          <ModalBody>
            <p>{t("medications.delete_confirmation")}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onDeleteClose}>
              {t("common.cancel")}
            </Button>
            <Button color="danger" onPress={confirmDeleteMedication}>
              {t("common.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}