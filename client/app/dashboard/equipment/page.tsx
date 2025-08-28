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
import { Zap, Search, Trash2, Edit, Plus, Eye, AlertTriangle, Wrench } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import { equipmentAPI, departmentsAPI, roomsAPI } from "@/lib/api";
import { Equipment, Department, Room } from "@/types";
import { formatDate, getPermissionLevel } from "@/lib/utils";
import toast from "react-hot-toast";

export default function EquipmentPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // View and delete modals
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [equipmentToView, setEquipmentToView] = useState<Equipment | null>(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    department_id: "",
    room_id: "",
    manufacturer: "",
    model: "",
    purchase_date: "",
    warranty_expiry: "",
    maintenance_schedule: "",
    cost: "",
  });

  useEffect(() => {
    loadEquipment();
    loadDepartments();
    loadRooms();
  }, [currentPage, searchTerm, statusFilter, departmentFilter]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      handleAddEquipment();
      router.replace("/dashboard/equipment");
    }
  }, [searchParams]);

  const loadEquipment = async () => {
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

      if (departmentFilter && departmentFilter !== "all") {
        queryParams.departmentId = departmentFilter;
      }

      const response = await equipmentAPI.getAll(queryParams);

      if (response.data.equipment) {
        setEquipment(response.data.equipment);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        setEquipment(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      } else {
        setEquipment([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load equipment:", error);
      toast.error(t("equipment.loading_error"));
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentsAPI.getAll({ limit: 1000 });
      if (response.data.departments) {
        setDepartments(response.data.departments);
      } else if (Array.isArray(response.data)) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error("Failed to load departments:", error);
      setDepartments([]);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await roomsAPI.getAll({ limit: 1000 });
      if (response.data.rooms) {
        setRooms(response.data.rooms);
      } else if (Array.isArray(response.data)) {
        setRooms(response.data);
      }
    } catch (error) {
      console.error("Failed to load rooms:", error);
      setRooms([]);
    }
  };

  const handleAddEquipment = () => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("equipment.insufficient_permissions"));
      return;
    }

    setIsAddMode(true);
    setSelectedEquipment(null);
    setFormData({
      name: "",
      description: "",
      department_id: "",
      room_id: "",
      manufacturer: "",
      model: "",
      purchase_date: "",
      warranty_expiry: "",
      maintenance_schedule: "",
      cost: "",
    });
    onOpen();
  };

  const handleEditEquipment = (equipment: Equipment) => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("equipment.insufficient_permissions"));
      return;
    }

    setIsAddMode(false);
    setSelectedEquipment(equipment);

    setFormData({
      name: equipment.name || "",
      description: equipment.description || "",
      department_id: equipment.department_id || "",
      room_id: equipment.room_id || "",
      manufacturer: equipment.manufacturer || "",
      model: equipment.model || "",
      purchase_date: equipment.purchase_date ? equipment.purchase_date.split("T")[0] : "",
      warranty_expiry: equipment.warranty_expiry ? equipment.warranty_expiry.split("T")[0] : "",
      maintenance_schedule: equipment.maintenance_schedule || "",
      cost: equipment.cost ? equipment.cost.toString() : "",
    });

    onOpen();
  };

  const handleViewEquipment = (equipment: Equipment) => {
    setEquipmentToView(equipment);
    onViewOpen();
  };

  const handleDeleteEquipment = (equipment: Equipment) => {
    if (getPermissionLevel(user) < 3) {
      toast.error(t("equipment.insufficient_permissions_delete"));
      return;
    }

    setEquipmentToDelete(equipment);
    onDeleteOpen();
  };

  const confirmDeleteEquipment = async () => {
    if (!equipmentToDelete) return;

    try {
      const equipmentId = equipmentToDelete.equipment_id || equipmentToDelete._id || equipmentToDelete.id?.toString();
      await equipmentAPI.delete(equipmentId || "");
      toast.success(t("equipment.equipment_deleted"));
      loadEquipment();
      onDeleteClose();
      setEquipmentToDelete(null);
    } catch (error) {
      console.error("Failed to delete equipment:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error(t("equipment.name_required"));
        return;
      }
      if (!formData.department_id) {
        toast.error(t("equipment.department_required"));
        return;
      }
      if (!formData.manufacturer.trim()) {
        toast.error(t("equipment.manufacturer_required"));
        return;
      }
      if (!formData.model.trim()) {
        toast.error(t("equipment.model_required"));
        return;
      }
      if (!formData.purchase_date) {
        toast.error(t("equipment.purchase_date_required"));
        return;
      }

      const apiData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        department_id: formData.department_id,
        room_id: formData.room_id || null,
        manufacturer: formData.manufacturer.trim(),
        model: formData.model.trim(),
        purchase_date: formData.purchase_date,
        warranty_expiry: formData.warranty_expiry || null,
        maintenance_schedule: formData.maintenance_schedule.trim(),
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        status: isAddMode ? "operational" : selectedEquipment?.status || "operational",
      };

      if (isAddMode) {
        await equipmentAPI.create(apiData);
        toast.success(t("equipment.equipment_created"));
      } else {
        const equipmentId = selectedEquipment!.equipment_id || selectedEquipment!._id || selectedEquipment!.id?.toString();
        await equipmentAPI.update(equipmentId || "", apiData);
        toast.success(t("equipment.equipment_updated"));
      }
      onClose();
      loadEquipment();
    } catch (error: any) {
      console.error("Failed to save equipment:", error);
      const errorMessage = error?.response?.data?.error || error?.message || t("common.error_saving");
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (equipmentId: string, newStatus: string) => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("equipment.insufficient_permissions"));
      return;
    }

    try {
      await equipmentAPI.update(equipmentId, { status: newStatus });
      toast.success(t("equipment.status_updated"));
      loadEquipment();
    } catch (error) {
      console.error("Failed to update equipment status:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "success";
      case "maintenance": return "warning";
      case "out-of-order": return "danger";
      case "retired": return "default";
      default: return "default";
    }
  };

  const isWarrantyExpiring = (warrantyDate: string) => {
    if (!warrantyDate) return false;
    const warranty = new Date(warrantyDate);
    const today = new Date();
    const monthFromNow = new Date();
    monthFromNow.setMonth(today.getMonth() + 1);
    return warranty <= monthFromNow && warranty > today;
  };

  const isWarrantyExpired = (warrantyDate: string) => {
    if (!warrantyDate) return false;
    const warranty = new Date(warrantyDate);
    const today = new Date();
    return warranty < today;
  };

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find(d => (d.department_id === departmentId) || (d._id === departmentId));
    return department?.name || t("equipment.unknown_department");
  };

  const getRoomName = (roomId: string) => {
    if (!roomId) return "-";
    const room = rooms.find(r => (r.room_id === roomId) || (r._id === roomId));
    return room ? `${room.room_number} (${room.room_type})` : t("equipment.unknown_room");
  };

  const renderCell = (equipment: Equipment, columnKey: string) => {
    switch (columnKey) {
      case "equipment_info":
        return (
          <div>
            <p className="font-medium">{equipment.name}</p>
            <p className="text-sm text-gray-500">{equipment.manufacturer} - {equipment.model}</p>
          </div>
        );
      case "location":
        return (
          <div>
            <p className="font-medium">{getDepartmentName(equipment.department_id || "")}</p>
            <p className="text-sm text-gray-500">{getRoomName(equipment.room_id || "")}</p>
          </div>
        );
      case "warranty":
        const expired = isWarrantyExpired(equipment.warranty_expiry || "");
        const expiring = isWarrantyExpiring(equipment.warranty_expiry || "");
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
                {equipment.warranty_expiry ? formatDate(equipment.warranty_expiry) : "-"}
              </p>
              {expired && <p className="text-xs text-red-500">Expired</p>}
              {!expired && expiring && <p className="text-xs text-yellow-500">Expires Soon</p>}
            </div>
          </div>
        );
      case "purchase_info":
        return (
          <div>
            <p className="text-sm font-medium">{formatDate(equipment.purchase_date || "")}</p>
            <p className="text-sm text-gray-500">{equipment.cost ? `$${equipment.cost.toLocaleString()}` : "-"}</p>
          </div>
        );
      case "status":
        return (
          <Chip color={getStatusColor(equipment.status || "")} size="sm">
            {t(`equipment.${equipment.status}`) || equipment.status || "operational"}
          </Chip>
        );
      case "actions":
        const equipmentId = equipment.equipment_id || equipment._id || equipment.id?.toString() || "";
        return (
          <div className="flex gap-2 items-center">
            <Button size="sm" color="secondary" variant="flat" onPress={() => handleViewEquipment(equipment)}>
              <Eye size={16} />
            </Button>
            {getPermissionLevel(user) >= 2 && (
              <>
                <Button size="sm" color="primary" variant="flat" onPress={() => handleEditEquipment(equipment)}>
                  <Edit size={16} />
                </Button>
                <Select
                  size="sm"
                  placeholder="Status"
                  className="w-32"
                  selectedKeys={equipment.status ? [equipment.status] : []}
                  onSelectionChange={(keys) => {
                    const newStatus = Array.from(keys)[0] as string;
                    if (newStatus !== equipment.status) {
                      handleStatusChange(equipmentId, newStatus);
                    }
                  }}
                >
                  <SelectItem key="operational">{t("equipment.operational")}</SelectItem>
                  <SelectItem key="maintenance">{t("equipment.maintenance")}</SelectItem>
                  <SelectItem key="out-of-order">{t("equipment.out_of_order")}</SelectItem>
                  <SelectItem key="retired">{t("equipment.retired")}</SelectItem>
                </Select>
                {getPermissionLevel(user) >= 3 && (
                  <Button size="sm" color="danger" variant="flat" onPress={() => handleDeleteEquipment(equipment)}>
                    <Trash2 size={16} />
                  </Button>
                )}
              </>
            )}
          </div>
        );
      default:
        return equipment[columnKey as keyof Equipment];
    }
  };

  const columns = [
    { key: "equipment_info", label: t("equipment.equipment_info") },
    { key: "location", label: t("equipment.location") },
    { key: "warranty", label: t("equipment.warranty") },
    { key: "purchase_info", label: t("equipment.purchase_info") },
    { key: "status", label: t("common.status") },
    { key: "actions", label: t("common.actions") },
  ];

  const getFilteredRooms = () => {
    if (!formData.department_id) return [];
    return rooms.filter(r => r.department_id === formData.department_id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("equipment.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("equipment.subtitle")}
          </p>
        </div>
        {getPermissionLevel(user) >= 2 && (
          <Button color="primary" onPress={handleAddEquipment}>
            <Plus className="mr-2" size={20} />
            {t("equipment.add_equipment")}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder={t("equipment.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<Search size={16} />}
              isClearable
            />
            <Select
              placeholder={t("equipment.filter_by_department")}
              className="sm:w-48"
              selectedKeys={departmentFilter !== "all" ? [departmentFilter] : []}
              onSelectionChange={(keys) => setDepartmentFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("equipment.all_departments")}</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.department_id || department._id || ""}>
                  {department.name}
                </SelectItem>
              ))}
            </Select>
            <Select
              placeholder={t("equipment.filter_by_status")}
              className="sm:w-48"
              selectedKeys={statusFilter !== "all" ? [statusFilter] : []}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("equipment.all_status")}</SelectItem>
              <SelectItem key="operational">{t("equipment.operational")}</SelectItem>
              <SelectItem key="maintenance">{t("equipment.maintenance")}</SelectItem>
              <SelectItem key="out-of-order">{t("equipment.out_of_order")}</SelectItem>
              <SelectItem key="retired">{t("equipment.retired")}</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Equipment table">
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={t("equipment.loading_equipment")}
              emptyContent={t("equipment.no_equipment")}
            >
              {equipment.map((item) => (
                <TableRow key={item.id || item.equipment_id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(item, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {equipment.length > 0 && totalPages > 1 && (
            <div className="flex justify-center p-4">
              <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Equipment Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {isAddMode ? t("equipment.add_equipment") : t("equipment.edit_equipment")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t("equipment.name")}
                  placeholder={t("equipment.name_placeholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  isRequired
                  className="md:col-span-2"
                />

                <Input
                  label={t("equipment.manufacturer")}
                  placeholder={t("equipment.manufacturer_placeholder")}
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  isRequired
                />

                <Input
                  label={t("equipment.model")}
                  placeholder={t("equipment.model_placeholder")}
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  isRequired
                />

                <Select
                  label={t("equipment.department")}
                  placeholder={t("equipment.select_department")}
                  selectedKeys={formData.department_id ? [formData.department_id] : []}
                  onSelectionChange={(keys) => {
                    const newDeptId = Array.from(keys)[0] as string || "";
                    setFormData({ ...formData, department_id: newDeptId, room_id: "" });
                  }}
                  isRequired
                >
                  {departments.map((department) => (
                    <SelectItem key={department.department_id || department._id || ""}>
                      {department.name}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label={t("equipment.room")}
                  placeholder={t("equipment.select_room")}
                  selectedKeys={formData.room_id ? [formData.room_id] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, room_id: Array.from(keys)[0] as string || "" })}
                  isDisabled={!formData.department_id}
                >
                  {getFilteredRooms().map((room) => (
                    <SelectItem key={room.room_id || room._id || ""}>
                      {room.room_number} - {room.room_type}
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  type="date"
                  label={t("equipment.purchase_date")}
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  isRequired
                />

                <Input
                  type="date"
                  label={t("equipment.warranty_expiry")}
                  value={formData.warranty_expiry}
                  onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                />

                <Input
                  type="number"
                  label={t("equipment.cost")}
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
                label={t("equipment.description")}
                placeholder={t("equipment.description_placeholder")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <Textarea
                label={t("equipment.maintenance_schedule")}
                placeholder={t("equipment.maintenance_schedule_placeholder")}
                value={formData.maintenance_schedule}
                onChange={(e) => setFormData({ ...formData, maintenance_schedule: e.target.value })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {isAddMode ? t("equipment.create_equipment") : t("equipment.update_equipment")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Equipment Details Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t("equipment.equipment_details")}</ModalHeader>
          <ModalBody>
            {equipmentToView && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t("equipment.name")}</p>
                    <p className="font-medium">{equipmentToView.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("equipment.manufacturer")}</p>
                    <p className="font-medium">{equipmentToView.manufacturer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("equipment.model")}</p>
                    <p className="font-medium">{equipmentToView.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("common.status")}</p>
                    <Chip color={getStatusColor(equipmentToView.status || "")} size="sm">
                      {t(`equipment.${equipmentToView.status}`) || equipmentToView.status}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("equipment.department")}</p>
                    <p className="font-medium">{getDepartmentName(equipmentToView.department_id || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("equipment.room")}</p>
                    <p className="font-medium">{getRoomName(equipmentToView.room_id || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("equipment.purchase_date")}</p>
                    <p className="font-medium">{formatDate(equipmentToView.purchase_date || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("equipment.warranty_expiry")}</p>
                    <p className={`font-medium ${isWarrantyExpired(equipmentToView.warranty_expiry || "") ? "text-red-500" : isWarrantyExpiring(equipmentToView.warranty_expiry || "") ? "text-yellow-500" : ""}`}>
                      {equipmentToView.warranty_expiry ? formatDate(equipmentToView.warranty_expiry) : "-"}
                      {isWarrantyExpired(equipmentToView.warranty_expiry || "") && " (Expired)"}
                      {!isWarrantyExpired(equipmentToView.warranty_expiry || "") && isWarrantyExpiring(equipmentToView.warranty_expiry || "") && " (Expires Soon)"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("equipment.cost")}</p>
                    <p className="font-medium">{equipmentToView.cost ? `$${equipmentToView.cost.toLocaleString()}` : "-"}</p>
                  </div>
                </div>

                {equipmentToView.description && (
                  <div>
                    <p className="text-sm text-gray-500">{t("equipment.description")}</p>
                    <p className="font-medium">{equipmentToView.description}</p>
                  </div>
                )}

                {equipmentToView.maintenance_schedule && (
                  <div>
                    <p className="text-sm text-gray-500">{t("equipment.maintenance_schedule")}</p>
                    <p className="font-medium">{equipmentToView.maintenance_schedule}</p>
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
          <ModalHeader>{t("equipment.delete_equipment")}</ModalHeader>
          <ModalBody>
            <p>{t("equipment.delete_confirmation")}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onDeleteClose}>
              {t("common.cancel")}
            </Button>
            <Button color="danger" onPress={confirmDeleteEquipment}>
              {t("common.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}