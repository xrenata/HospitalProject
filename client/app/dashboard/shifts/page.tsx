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
import { Clock, Search, Trash2, Edit, Plus, Eye, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import { shiftsAPI, staffAPI } from "@/lib/api";
import { Shift, Staff } from "@/types";
import { formatDate, formatTime, getPermissionLevel } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ShiftsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // View and delete modals
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [shiftToView, setShiftToView] = useState<Shift | null>(null);
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    staff_id: "",
    date: "",
    start_time: "",
    end_time: "",
    break_start: "",
    break_end: "",
    notes: "",
  });

  useEffect(() => {
    loadShifts();
    loadStaff();
  }, [currentPage, searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      handleAddShift();
      router.replace("/dashboard/shifts");
    }
  }, [searchParams]);

  const loadShifts = async () => {
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

      if (dateFilter) {
        queryParams.date = dateFilter;
      }

      const response = await shiftsAPI.getAll(queryParams);

      if (response.data.shifts) {
        setShifts(response.data.shifts);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        setShifts(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      } else {
        setShifts([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load shifts:", error);
      toast.error(t("shifts.loading_error"));
      setShifts([]);
    } finally {
      setLoading(false);
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
          department_id: staff.department_id || staff.departmentId || "",
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

  const handleAddShift = () => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("shifts.insufficient_permissions"));
      return;
    }

    setIsAddMode(true);
    setSelectedShift(null);
    setFormData({
      staff_id: "",
      date: "",
      start_time: "",
      end_time: "",
      break_start: "",
      break_end: "",
      notes: "",
    });
    onOpen();
  };

  const handleEditShift = (shift: Shift) => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("shifts.insufficient_permissions"));
      return;
    }

    setIsAddMode(false);
    setSelectedShift(shift);

    setFormData({
      staff_id: shift.staff_id || shift.staffId || "",
      date: shift.date ? shift.date.split("T")[0] : "",
      start_time: shift.start_time || shift.startTime || "",
      end_time: shift.end_time || shift.endTime || "",
      break_start: shift.break_start || shift.breakStart || "",
      break_end: shift.break_end || shift.breakEnd || "",
      notes: shift.notes || "",
    });

    onOpen();
  };

  const handleViewShift = (shift: Shift) => {
    setShiftToView(shift);
    onViewOpen();
  };

  const handleDeleteShift = (shift: Shift) => {
    if (getPermissionLevel(user) < 3) {
      toast.error(t("shifts.insufficient_permissions_delete"));
      return;
    }

    setShiftToDelete(shift);
    onDeleteOpen();
  };

  const confirmDeleteShift = async () => {
    if (!shiftToDelete) return;

    try {
      const shiftId = shiftToDelete.shift_id || shiftToDelete._id || shiftToDelete.id?.toString();
      await shiftsAPI.delete(shiftId || "");
      toast.success(t("shifts.shift_deleted"));
      loadShifts();
      onDeleteClose();
      setShiftToDelete(null);
    } catch (error) {
      console.error("Failed to delete shift:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const calculateHours = (startTime: string, endTime: string, breakStart?: string, breakEnd?: string) => {
    if (!startTime || !endTime) return 0;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    let totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    if (breakStart && breakEnd) {
      const breakStartTime = new Date(`2000-01-01T${breakStart}`);
      const breakEndTime = new Date(`2000-01-01T${breakEnd}`);
      const breakMinutes = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60);
      totalMinutes -= breakMinutes;
    }
    
    return Math.max(0, totalMinutes / 60);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.staff_id) {
        toast.error(t("shifts.staff_required"));
        return;
      }
      if (!formData.date) {
        toast.error(t("shifts.date_required"));
        return;
      }
      if (!formData.start_time) {
        toast.error(t("shifts.start_time_required"));
        return;
      }
      if (!formData.end_time) {
        toast.error(t("shifts.end_time_required"));
        return;
      }

      const hoursWorked = calculateHours(
        formData.start_time,
        formData.end_time,
        formData.break_start,
        formData.break_end
      );

      const overtimeHours = Math.max(0, hoursWorked - 8);

      const apiData = {
        staff_id: formData.staff_id,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        break_start: formData.break_start || null,
        break_end: formData.break_end || null,
        hours_worked: hoursWorked,
        overtime_hours: overtimeHours,
        notes: formData.notes.trim(),
        status: isAddMode ? "scheduled" : selectedShift?.status || "scheduled",
      };

      if (isAddMode) {
        await shiftsAPI.create(apiData);
        toast.success(t("shifts.shift_created"));
      } else {
        const shiftId = selectedShift!.shift_id || selectedShift!._id || selectedShift!.id?.toString();
        await shiftsAPI.update(shiftId || "", apiData);
        toast.success(t("shifts.shift_updated"));
      }
      onClose();
      loadShifts();
    } catch (error: any) {
      console.error("Failed to save shift:", error);
      const errorMessage = error?.response?.data?.error || error?.message || t("common.error_saving");
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (shiftId: string, newStatus: string) => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("shifts.insufficient_permissions"));
      return;
    }

    try {
      await shiftsAPI.update(shiftId, { status: newStatus });
      toast.success(t("shifts.status_updated"));
      loadShifts();
    } catch (error) {
      console.error("Failed to update shift status:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "warning";
      case "completed": return "success";
      case "cancelled": return "danger";
      case "no-show": return "danger";
      default: return "default";
    }
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => (s.staff_id === staffId) || (s._id === staffId));
    return staffMember?.name || t("shifts.unknown_staff");
  };

  const getStaffRole = (staffId: string) => {
    const staffMember = staff.find(s => (s.staff_id === staffId) || (s._id === staffId));
    return staffMember?.role || "";
  };

  const renderCell = (shift: Shift, columnKey: string) => {
    switch (columnKey) {
      case "staff":
        const staffId = shift.staff_id || shift.staffId || "";
        return (
          <div>
            <p className="font-medium">{getStaffName(staffId)}</p>
            <p className="text-sm text-gray-500">{getStaffRole(staffId)}</p>
          </div>
        );
      case "date":
        return formatDate(shift.date || "");
      case "time_schedule":
        return (
          <div>
            <p className="text-sm font-medium">
              {shift.start_time || shift.startTime} - {shift.end_time || shift.endTime}
            </p>
            {(shift.break_start || shift.breakStart) && (
              <p className="text-sm text-gray-500">
                {t("shifts.break")}: {shift.break_start || shift.breakStart} - {shift.break_end || shift.breakEnd}
              </p>
            )}
          </div>
        );
      case "hours":
        return (
          <div>
            <p className="text-sm font-medium">{(shift.hours_worked || shift.hoursWorked || 0).toFixed(1)}h</p>
            {(shift.overtime_hours || shift.overtimeHours || 0) > 0 && (
              <p className="text-sm text-orange-500">
                {t("shifts.overtime")}: {(shift.overtime_hours || shift.overtimeHours || 0).toFixed(1)}h
              </p>
            )}
          </div>
        );
      case "status":
        return (
          <Chip color={getStatusColor(shift.status || "")} size="sm">
            {t(`shifts.${shift.status}`) || shift.status || "scheduled"}
          </Chip>
        );
      case "actions":
        const shiftId = shift.shift_id || shift._id || shift.id?.toString() || "";
        return (
          <div className="flex gap-2 items-center">
            <Button size="sm" color="secondary" variant="flat" onPress={() => handleViewShift(shift)}>
              <Eye size={16} />
            </Button>
            {getPermissionLevel(user) >= 2 && (
              <>
                <Button size="sm" color="primary" variant="flat" onPress={() => handleEditShift(shift)}>
                  <Edit size={16} />
                </Button>
                <Select
                  size="sm"
                  placeholder="Status"
                  className="w-32"
                  selectedKeys={shift.status ? [shift.status] : []}
                  onSelectionChange={(keys) => {
                    const newStatus = Array.from(keys)[0] as string;
                    if (newStatus !== shift.status) {
                      handleStatusChange(shiftId, newStatus);
                    }
                  }}
                >
                  <SelectItem key="scheduled">{t("shifts.scheduled")}</SelectItem>
                  <SelectItem key="completed">{t("shifts.completed")}</SelectItem>
                  <SelectItem key="cancelled">{t("shifts.cancelled")}</SelectItem>
                  <SelectItem key="no-show">{t("shifts.no_show")}</SelectItem>
                </Select>
                {getPermissionLevel(user) >= 3 && (
                  <Button size="sm" color="danger" variant="flat" onPress={() => handleDeleteShift(shift)}>
                    <Trash2 size={16} />
                  </Button>
                )}
              </>
            )}
          </div>
        );
      default:
        return shift[columnKey as keyof Shift];
    }
  };

  const columns = [
    { key: "staff", label: t("shifts.staff_member") },
    { key: "date", label: t("shifts.date") },
    { key: "time_schedule", label: t("shifts.time_schedule") },
    { key: "hours", label: t("shifts.hours_worked") },
    { key: "status", label: t("common.status") },
    { key: "actions", label: t("common.actions") },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("shifts.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("shifts.subtitle")}
          </p>
        </div>
        {getPermissionLevel(user) >= 2 && (
          <Button color="primary" onPress={handleAddShift}>
            <Plus className="mr-2" size={20} />
            {t("shifts.add_shift")}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder={t("shifts.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<Search size={16} />}
              isClearable
            />
            <Input
              type="date"
              placeholder={t("shifts.filter_by_date")}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="sm:w-48"
              startContent={<Calendar size={16} />}
            />
            <Select
              placeholder={t("shifts.filter_by_status")}
              className="sm:w-48"
              selectedKeys={statusFilter !== "all" ? [statusFilter] : []}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("shifts.all_status")}</SelectItem>
              <SelectItem key="scheduled">{t("shifts.scheduled")}</SelectItem>
              <SelectItem key="completed">{t("shifts.completed")}</SelectItem>
              <SelectItem key="cancelled">{t("shifts.cancelled")}</SelectItem>
              <SelectItem key="no-show">{t("shifts.no_show")}</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Shifts Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Shifts table">
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={t("shifts.loading_shifts")}
              emptyContent={t("shifts.no_shifts")}
            >
              {shifts.map((shift) => (
                <TableRow key={shift.id || shift.shift_id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(shift, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {shifts.length > 0 && totalPages > 1 && (
            <div className="flex justify-center p-4">
              <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Shift Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {isAddMode ? t("shifts.add_shift") : t("shifts.edit_shift")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={t("shifts.staff_member")}
                  placeholder={t("shifts.select_staff")}
                  selectedKeys={formData.staff_id ? [formData.staff_id] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, staff_id: Array.from(keys)[0] as string || "" })}
                  isRequired
                  className="md:col-span-2"
                >
                  {staff.filter(s => s.status === 'active').map((staffMember) => (
                    <SelectItem key={staffMember._id || staffMember.staff_id || ""}>
                      {staffMember.name} ({staffMember.role})
                    </SelectItem>
                  ))}
                </Select>

                <Input
                  type="date"
                  label={t("shifts.date")}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  isRequired
                />

                <div />

                <Input
                  type="time"
                  label={t("shifts.start_time")}
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  isRequired
                />

                <Input
                  type="time"
                  label={t("shifts.end_time")}
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  isRequired
                />

                <Input
                  type="time"
                  label={t("shifts.break_start")}
                  value={formData.break_start}
                  onChange={(e) => setFormData({ ...formData, break_start: e.target.value })}
                />

                <Input
                  type="time"
                  label={t("shifts.break_end")}
                  value={formData.break_end}
                  onChange={(e) => setFormData({ ...formData, break_end: e.target.value })}
                />
              </div>

              {/* Hours calculation preview */}
              {formData.start_time && formData.end_time && (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("shifts.calculated_hours")}: {calculateHours(formData.start_time, formData.end_time, formData.break_start, formData.break_end).toFixed(1)}h
                  </p>
                  {calculateHours(formData.start_time, formData.end_time, formData.break_start, formData.break_end) > 8 && (
                    <p className="text-sm text-orange-600">
                      {t("shifts.overtime_hours")}: {(calculateHours(formData.start_time, formData.end_time, formData.break_start, formData.break_end) - 8).toFixed(1)}h
                    </p>
                  )}
                </div>
              )}

              <Textarea
                label={t("shifts.notes")}
                placeholder={t("shifts.notes_placeholder")}
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
              {isAddMode ? t("shifts.create_shift") : t("shifts.update_shift")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Shift Details Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t("shifts.shift_details")}</ModalHeader>
          <ModalBody>
            {shiftToView && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t("shifts.staff_member")}</p>
                    <p className="font-medium">{getStaffName(shiftToView.staff_id || shiftToView.staffId || "")}</p>
                    <p className="text-sm text-gray-500">{getStaffRole(shiftToView.staff_id || shiftToView.staffId || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("shifts.date")}</p>
                    <p className="font-medium">{formatDate(shiftToView.date || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("shifts.start_time")}</p>
                    <p className="font-medium">{shiftToView.start_time || shiftToView.startTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("shifts.end_time")}</p>
                    <p className="font-medium">{shiftToView.end_time || shiftToView.endTime}</p>
                  </div>
                  {(shiftToView.break_start || shiftToView.breakStart) && (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">{t("shifts.break_start")}</p>
                        <p className="font-medium">{shiftToView.break_start || shiftToView.breakStart}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{t("shifts.break_end")}</p>
                        <p className="font-medium">{shiftToView.break_end || shiftToView.breakEnd}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">{t("shifts.hours_worked")}</p>
                    <p className="font-medium">{(shiftToView.hours_worked || shiftToView.hoursWorked || 0).toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("shifts.overtime_hours")}</p>
                    <p className="font-medium">{(shiftToView.overtime_hours || shiftToView.overtimeHours || 0).toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("common.status")}</p>
                    <Chip color={getStatusColor(shiftToView.status || "")} size="sm">
                      {t(`shifts.${shiftToView.status}`) || shiftToView.status}
                    </Chip>
                  </div>
                </div>

                {shiftToView.notes && (
                  <div>
                    <p className="text-sm text-gray-500">{t("shifts.notes")}</p>
                    <p className="font-medium">{shiftToView.notes}</p>
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
          <ModalHeader>{t("shifts.delete_shift")}</ModalHeader>
          <ModalBody>
            <p>{t("shifts.delete_confirmation")}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onDeleteClose}>
              {t("common.cancel")}
            </Button>
            <Button color="danger" onPress={confirmDeleteShift}>
              {t("common.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}