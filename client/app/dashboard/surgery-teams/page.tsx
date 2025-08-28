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
import { UserCheck, Search, Trash2, Edit, Plus, Eye, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import { surgeryTeamsAPI, surgeriesAPI, staffAPI } from "@/lib/api";
import { SurgeryTeam, Surgery, Staff } from "@/types";
import { formatDate, getPermissionLevel } from "@/lib/utils";
import toast from "react-hot-toast";

export default function SurgeryTeamsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [surgeryTeams, setSurgeryTeams] = useState<SurgeryTeam[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTeamMember, setSelectedTeamMember] = useState<SurgeryTeam | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // View and delete modals
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [teamMemberToView, setTeamMemberToView] = useState<SurgeryTeam | null>(null);
  const [teamMemberToDelete, setTeamMemberToDelete] = useState<SurgeryTeam | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    surgery_id: "",
    staff_id: "",
    role: "",
    notes: "",
  });

  const teamRoles = [
    "primary_surgeon",
    "assistant_surgeon", 
    "anesthesiologist",
    "nurse",
    "technician"
  ];

  useEffect(() => {
    loadSurgeryTeams();
    loadSurgeries();
    loadStaff();
  }, [currentPage, searchTerm, roleFilter]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      handleAddTeamMember();
      router.replace("/dashboard/surgery-teams");
    }
  }, [searchParams]);

  const loadSurgeryTeams = async () => {
    setLoading(true);
    try {
      const queryParams: any = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
      };

      if (roleFilter && roleFilter !== "all") {
        queryParams.role = roleFilter;
      }

      const response = await surgeryTeamsAPI.getAll(queryParams);

      if (response.data.surgeryTeams) {
        setSurgeryTeams(response.data.surgeryTeams);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        setSurgeryTeams(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      } else {
        setSurgeryTeams([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load surgery teams:", error);
      toast.error(t("surgery_teams.loading_error"));
      setSurgeryTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSurgeries = async () => {
    try {
      const response = await surgeriesAPI.getAll({ limit: 1000 });
      if (response.data.surgeries) {
        setSurgeries(response.data.surgeries);
      } else if (Array.isArray(response.data)) {
        setSurgeries(response.data);
      }
    } catch (error) {
      console.error("Failed to load surgeries:", error);
      setSurgeries([]);
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

  const handleAddTeamMember = () => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("surgery_teams.insufficient_permissions"));
      return;
    }

    setIsAddMode(true);
    setSelectedTeamMember(null);
    setFormData({
      surgery_id: "",
      staff_id: "",
      role: "",
      notes: "",
    });
    onOpen();
  };

  const handleEditTeamMember = (teamMember: SurgeryTeam) => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("surgery_teams.insufficient_permissions"));
      return;
    }

    setIsAddMode(false);
    setSelectedTeamMember(teamMember);

    setFormData({
      surgery_id: teamMember.surgery_id || teamMember.surgeryId || "",
      staff_id: teamMember.staff_id || teamMember.staffId || "",
      role: teamMember.role || "",
      notes: teamMember.notes || "",
    });

    onOpen();
  };

  const handleViewTeamMember = (teamMember: SurgeryTeam) => {
    setTeamMemberToView(teamMember);
    onViewOpen();
  };

  const handleDeleteTeamMember = (teamMember: SurgeryTeam) => {
    if (getPermissionLevel(user) < 3) {
      toast.error(t("surgery_teams.insufficient_permissions_delete"));
      return;
    }

    setTeamMemberToDelete(teamMember);
    onDeleteOpen();
  };

  const confirmDeleteTeamMember = async () => {
    if (!teamMemberToDelete) return;

    try {
      const teamMemberId = teamMemberToDelete.surgery_team_id || teamMemberToDelete._id || teamMemberToDelete.id?.toString();
      await surgeryTeamsAPI.delete(teamMemberId || "");
      toast.success(t("surgery_teams.team_member_deleted"));
      loadSurgeryTeams();
      onDeleteClose();
      setTeamMemberToDelete(null);
    } catch (error) {
      console.error("Failed to delete team member:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.surgery_id) {
        toast.error(t("surgery_teams.surgery_required"));
        return;
      }
      if (!formData.staff_id) {
        toast.error(t("surgery_teams.staff_required"));
        return;
      }
      if (!formData.role) {
        toast.error(t("surgery_teams.role_required"));
        return;
      }

      const apiData = {
        surgery_id: formData.surgery_id,
        staff_id: formData.staff_id,
        role: formData.role,
        notes: formData.notes.trim(),
      };

      if (isAddMode) {
        await surgeryTeamsAPI.create(apiData);
        toast.success(t("surgery_teams.team_member_added"));
      } else {
        const teamMemberId = selectedTeamMember!.surgery_team_id || selectedTeamMember!._id || selectedTeamMember!.id?.toString();
        await surgeryTeamsAPI.update(teamMemberId || "", apiData);
        toast.success(t("surgery_teams.team_member_updated"));
      }
      onClose();
      loadSurgeryTeams();
    } catch (error: any) {
      console.error("Failed to save team member:", error);
      const errorMessage = error?.response?.data?.error || error?.message || t("common.error_saving");
      toast.error(errorMessage);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "primary_surgeon": return "primary";
      case "assistant_surgeon": return "secondary";
      case "anesthesiologist": return "warning";
      case "nurse": return "success";
      case "technician": return "default";
      default: return "default";
    }
  };

  const getSurgeryInfo = (surgeryId: string) => {
    const surgery = surgeries.find(s => (s.surgery_id === surgeryId) || (s._id === surgeryId));
    return surgery ? `${surgery.surgery_type} - ${formatDate(surgery.scheduled_date || "")}` : t("surgery_teams.unknown_surgery");
  };

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => (s.staff_id === staffId) || (s._id === staffId));
    return staffMember?.name || t("surgery_teams.unknown_staff");
  };

  const getStaffRole = (staffId: string) => {
    const staffMember = staff.find(s => (s.staff_id === staffId) || (s._id === staffId));
    return staffMember?.role || "";
  };

  const renderCell = (teamMember: SurgeryTeam, columnKey: string) => {
    switch (columnKey) {
      case "surgery":
        return getSurgeryInfo(teamMember.surgery_id || teamMember.surgeryId || "");
      case "staff":
        const staffId = teamMember.staff_id || teamMember.staffId || "";
        return (
          <div>
            <p className="font-medium">{getStaffName(staffId)}</p>
            <p className="text-sm text-gray-500">{getStaffRole(staffId)}</p>
          </div>
        );
      case "team_role":
        return (
          <Chip color={getRoleColor(teamMember.role || "")} size="sm">
            {t(`surgery_teams.${teamMember.role}`) || teamMember.role}
          </Chip>
        );
      case "actions":
        const teamMemberId = teamMember.surgery_team_id || teamMember._id || teamMember.id?.toString() || "";
        return (
          <div className="flex gap-2 items-center">
            <Button size="sm" color="secondary" variant="flat" onPress={() => handleViewTeamMember(teamMember)}>
              <Eye size={16} />
            </Button>
            {getPermissionLevel(user) >= 2 && (
              <>
                <Button size="sm" color="primary" variant="flat" onPress={() => handleEditTeamMember(teamMember)}>
                  <Edit size={16} />
                </Button>
                {getPermissionLevel(user) >= 3 && (
                  <Button size="sm" color="danger" variant="flat" onPress={() => handleDeleteTeamMember(teamMember)}>
                    <Trash2 size={16} />
                  </Button>
                )}
              </>
            )}
          </div>
        );
      default:
        return teamMember[columnKey as keyof SurgeryTeam];
    }
  };

  const columns = [
    { key: "surgery", label: t("surgery_teams.surgery") },
    { key: "staff", label: t("surgery_teams.staff_member") },
    { key: "team_role", label: t("surgery_teams.team_role") },
    { key: "actions", label: t("common.actions") },
  ];

  const getFilteredStaff = (targetRole: string) => {
    return staff.filter(s => {
      if (s.status !== 'active') return false;
      
      switch (targetRole) {
        case "primary_surgeon":
        case "assistant_surgeon":
          return s.role?.toLowerCase().includes('doctor') || s.role?.toLowerCase().includes('surgeon');
        case "anesthesiologist":
          return s.specialization?.toLowerCase().includes('anesthesi') || s.role?.toLowerCase().includes('anesthesi');
        case "nurse":
          return s.role?.toLowerCase().includes('nurse');
        case "technician":
          return s.role?.toLowerCase().includes('technician') || s.role?.toLowerCase().includes('tech');
        default:
          return true;
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("surgery_teams.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("surgery_teams.subtitle")}
          </p>
        </div>
        {getPermissionLevel(user) >= 2 && (
          <Button color="primary" onPress={handleAddTeamMember}>
            <Plus className="mr-2" size={20} />
            {t("surgery_teams.add_team_member")}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder={t("surgery_teams.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<Search size={16} />}
              isClearable
            />
            <Select
              placeholder={t("surgery_teams.filter_by_role")}
              className="sm:w-48"
              selectedKeys={roleFilter !== "all" ? [roleFilter] : []}
              onSelectionChange={(keys) => setRoleFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("surgery_teams.all_roles")}</SelectItem>
              {teamRoles.map((role) => (
                <SelectItem key={role}>
                  {t(`surgery_teams.${role}`)}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Surgery Teams Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Surgery teams table">
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={t("surgery_teams.loading_teams")}
              emptyContent={t("surgery_teams.no_teams")}
            >
              {surgeryTeams.map((teamMember) => (
                <TableRow key={teamMember.id || teamMember.surgery_team_id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(teamMember, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {surgeryTeams.length > 0 && totalPages > 1 && (
            <div className="flex justify-center p-4">
              <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Team Member Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {isAddMode ? t("surgery_teams.add_team_member") : t("surgery_teams.edit_team_member")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={t("surgery_teams.surgery")}
                  placeholder={t("surgery_teams.select_surgery")}
                  selectedKeys={formData.surgery_id ? [formData.surgery_id] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, surgery_id: Array.from(keys)[0] as string || "" })}
                  isRequired
                  className="md:col-span-2"
                >
                  {surgeries.filter(s => s.status === 'scheduled' || s.status === 'in-progress').map((surgery) => (
                    <SelectItem key={surgery.surgery_id || surgery._id || ""}>
                      {surgery.surgery_type} - {formatDate(surgery.scheduled_date || "")} at {surgery.scheduled_time}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label={t("surgery_teams.team_role")}
                  placeholder={t("surgery_teams.select_role")}
                  selectedKeys={formData.role ? [formData.role] : []}
                  onSelectionChange={(keys) => {
                    const newRole = Array.from(keys)[0] as string || "";
                    setFormData({ ...formData, role: newRole, staff_id: "" });
                  }}
                  isRequired
                >
                  {teamRoles.map((role) => (
                    <SelectItem key={role}>
                      {t(`surgery_teams.${role}`)}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label={t("surgery_teams.staff_member")}
                  placeholder={t("surgery_teams.select_staff")}
                  selectedKeys={formData.staff_id ? [formData.staff_id] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, staff_id: Array.from(keys)[0] as string || "" })}
                  isRequired
                  isDisabled={!formData.role}
                >
                  {getFilteredStaff(formData.role).map((staffMember) => (
                    <SelectItem key={staffMember._id || staffMember.staff_id || ""}>
                      {staffMember.name} ({staffMember.role})
                      {staffMember.specialization && ` - ${staffMember.specialization}`}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <Textarea
                label={t("surgery_teams.notes")}
                placeholder={t("surgery_teams.notes_placeholder")}
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
              {isAddMode ? t("surgery_teams.add_member") : t("surgery_teams.update_member")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Team Member Details Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t("surgery_teams.team_member_details")}</ModalHeader>
          <ModalBody>
            {teamMemberToView && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t("surgery_teams.surgery")}</p>
                    <p className="font-medium">{getSurgeryInfo(teamMemberToView.surgery_id || teamMemberToView.surgeryId || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("surgery_teams.staff_member")}</p>
                    <p className="font-medium">{getStaffName(teamMemberToView.staff_id || teamMemberToView.staffId || "")}</p>
                    <p className="text-sm text-gray-500">{getStaffRole(teamMemberToView.staff_id || teamMemberToView.staffId || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("surgery_teams.team_role")}</p>
                    <Chip color={getRoleColor(teamMemberToView.role || "")} size="sm">
                      {t(`surgery_teams.${teamMemberToView.role}`) || teamMemberToView.role}
                    </Chip>
                  </div>
                </div>

                {teamMemberToView.notes && (
                  <div>
                    <p className="text-sm text-gray-500">{t("surgery_teams.notes")}</p>
                    <p className="font-medium">{teamMemberToView.notes}</p>
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
          <ModalHeader>{t("surgery_teams.delete_team_member")}</ModalHeader>
          <ModalBody>
            <p>{t("surgery_teams.delete_confirmation")}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onDeleteClose}>
              {t("common.cancel")}
            </Button>
            <Button color="danger" onPress={confirmDeleteTeamMember}>
              {t("common.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}