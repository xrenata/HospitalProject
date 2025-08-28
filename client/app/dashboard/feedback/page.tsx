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
  Switch,
} from "@heroui/react";
import { Star, Search, Trash2, Edit, Plus, Eye, ThumbsUp, ThumbsDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { useRouter, useSearchParams } from "next/navigation";
import { feedbackAPI, patientsAPI } from "@/lib/api";
import { Feedback, Patient } from "@/types";
import { formatDate, getPermissionLevel } from "@/lib/utils";
import toast from "react-hot-toast";
import PatientAutocomplete from "@/components/PatientAutocomplete";

export default function FeedbackPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // View and delete modals
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [feedbackToView, setFeedbackToView] = useState<Feedback | null>(null);
  const [feedbackToDelete, setFeedbackToDelete] = useState<Feedback | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    patient_id: "",
    rating: "",
    category: "",
    comments: "",
    anonymous: false,
  });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const feedbackCategories = [
    "overall",
    "service",
    "cleanliness",
    "staff",
    "facilities"
  ];

  useEffect(() => {
    loadFeedback();
    loadPatients();
  }, [currentPage, searchTerm, categoryFilter, ratingFilter]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      handleAddFeedback();
      router.replace("/dashboard/feedback");
    }
  }, [searchParams]);

  const loadFeedback = async () => {
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

      if (ratingFilter && ratingFilter !== "all") {
        queryParams.rating = ratingFilter;
      }

      const response = await feedbackAPI.getAll(queryParams);

      if (response.data.feedback) {
        setFeedback(response.data.feedback);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else if (Array.isArray(response.data)) {
        setFeedback(response.data);
        setTotalPages(Math.ceil(response.data.length / 10));
      } else {
        setFeedback([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load feedback:", error);
      toast.error(t("feedback.loading_error"));
      setFeedback([]);
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

  const handleAddFeedback = () => {
    setIsAddMode(true);
    setSelectedFeedback(null);
    setFormData({
      patient_id: "",
      rating: "",
      category: "",
      comments: "",
      anonymous: false,
    });
    setSelectedPatient(null);
    onOpen();
  };

  const handleEditFeedback = (feedback: Feedback) => {
    if (getPermissionLevel(user) < 2) {
      toast.error(t("feedback.insufficient_permissions"));
      return;
    }

    setIsAddMode(false);
    setSelectedFeedback(feedback);

    const patient = patients.find(p => p.patient_id === feedback.patient_id);
    setSelectedPatient(patient || null);

    setFormData({
      patient_id: feedback.patient_id || "",
      rating: feedback.rating ? feedback.rating.toString() : "",
      category: feedback.category || "",
      comments: feedback.comments || "",
      anonymous: feedback.anonymous || false,
    });

    onOpen();
  };

  const handleViewFeedback = (feedback: Feedback) => {
    setFeedbackToView(feedback);
    onViewOpen();
  };

  const handleDeleteFeedback = (feedback: Feedback) => {
    if (getPermissionLevel(user) < 3) {
      toast.error(t("feedback.insufficient_permissions_delete"));
      return;
    }

    setFeedbackToDelete(feedback);
    onDeleteOpen();
  };

  const confirmDeleteFeedback = async () => {
    if (!feedbackToDelete) return;

    try {
      const feedbackId = feedbackToDelete.feedback_id || feedbackToDelete._id || feedbackToDelete.id?.toString();
      await feedbackAPI.delete(feedbackId || "");
      toast.success(t("feedback.feedback_deleted"));
      loadFeedback();
      onDeleteClose();
      setFeedbackToDelete(null);
    } catch (error) {
      console.error("Failed to delete feedback:", error);
      toast.error(t("common.error_saving"));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.patient_id) {
        toast.error(t("feedback.patient_required"));
        return;
      }
      if (!formData.rating) {
        toast.error(t("feedback.rating_required"));
        return;
      }
      if (!formData.category) {
        toast.error(t("feedback.category_required"));
        return;
      }

      const apiData = {
        patient_id: formData.patient_id,
        rating: parseInt(formData.rating),
        category: formData.category,
        comments: formData.comments.trim(),
        anonymous: formData.anonymous,
      };

      if (isAddMode) {
        await feedbackAPI.create(apiData);
        toast.success(t("feedback.feedback_created"));
      } else {
        const feedbackId = selectedFeedback!.feedback_id || selectedFeedback!._id || selectedFeedback!.id?.toString();
        await feedbackAPI.update(feedbackId || "", apiData);
        toast.success(t("feedback.feedback_updated"));
      }
      onClose();
      loadFeedback();
    } catch (error: any) {
      console.error("Failed to save feedback:", error);
      const errorMessage = error?.response?.data?.error || error?.message || t("common.error_saving");
      toast.error(errorMessage);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "success";
    if (rating >= 3) return "warning";
    return "danger";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "overall": return "primary";
      case "service": return "success";
      case "cleanliness": return "warning";
      case "staff": return "secondary";
      case "facilities": return "default";
      default: return "default";
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => (p.patient_id === patientId) || (p._id === patientId));
    if (patient) {
      const name = patient.name || `${patient.first_name || patient.firstName || ""} ${patient.last_name || patient.lastName || ""}`.trim();
      return name || t("feedback.unknown_patient");
    }
    return t("feedback.unknown_patient");
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };

  const renderCell = (feedback: Feedback, columnKey: string) => {
    switch (columnKey) {
      case "patient":
        return feedback.anonymous ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Anonymous</span>
            <Chip size="sm" variant="flat">Anonymous</Chip>
          </div>
        ) : getPatientName(feedback.patient_id || "");
      case "rating_category":
        return (
          <div>
            <div className="mb-1">{renderStars(feedback.rating || 0)}</div>
            <Chip color={getCategoryColor(feedback.category || "")} size="sm" variant="flat">
              {t(`feedback.${feedback.category}`) || feedback.category}
            </Chip>
          </div>
        );
      case "comments":
        return feedback.comments ? (
          <p className="text-sm truncate max-w-xs">{feedback.comments.substring(0, 50)}...</p>
        ) : (
          <span className="text-gray-400">-</span>
        );
      case "date":
        return formatDate(feedback.created_at || "");
      case "actions":
        const feedbackId = feedback.feedback_id || feedback._id || feedback.id?.toString() || "";
        return (
          <div className="flex gap-2 items-center">
            <Button size="sm" color="secondary" variant="flat" onPress={() => handleViewFeedback(feedback)}>
              <Eye size={16} />
            </Button>
            {getPermissionLevel(user) >= 2 && (
              <>
                <Button size="sm" color="primary" variant="flat" onPress={() => handleEditFeedback(feedback)}>
                  <Edit size={16} />
                </Button>
                {getPermissionLevel(user) >= 3 && (
                  <Button size="sm" color="danger" variant="flat" onPress={() => handleDeleteFeedback(feedback)}>
                    <Trash2 size={16} />
                  </Button>
                )}
              </>
            )}
          </div>
        );
      default:
        return feedback[columnKey as keyof Feedback];
    }
  };

  const columns = [
    { key: "patient", label: t("feedback.patient") },
    { key: "rating_category", label: t("feedback.rating_category") },
    { key: "comments", label: t("feedback.comments") },
    { key: "date", label: t("feedback.date") },
    { key: "actions", label: t("common.actions") },
  ];

  // Calculate average rating for display
  const averageRating = feedback.length > 0 
    ? feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("feedback.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("feedback.subtitle")}
          </p>
        </div>
        <Button color="primary" onPress={handleAddFeedback}>
          <Plus className="mr-2" size={20} />
          {t("feedback.add_feedback")}
        </Button>
      </div>

      {/* Stats Card */}
      {feedback.length > 0 && (
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{t("feedback.overall_rating")}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {renderStars(Math.round(averageRating * 10) / 10)}
                  <span className="text-sm text-gray-500">({feedback.length} {t("feedback.reviews")})</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {feedback.filter(f => (f.rating || 0) >= 4).length}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <ThumbsUp size={12} />
                    {t("feedback.positive")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {feedback.filter(f => (f.rating || 0) < 3).length}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <ThumbsDown size={12} />
                    {t("feedback.negative")}
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <Input
              placeholder={t("feedback.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<Search size={16} />}
              isClearable
            />
            <Select
              placeholder={t("feedback.filter_by_category")}
              className="lg:w-40"
              selectedKeys={categoryFilter !== "all" ? [categoryFilter] : []}
              onSelectionChange={(keys) => setCategoryFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("feedback.all_categories")}</SelectItem>
              {feedbackCategories.map((category) => (
                <SelectItem key={category}>
                  {t(`feedback.${category}`)}
                </SelectItem>
              ))}
            </Select>
            <Select
              placeholder={t("feedback.filter_by_rating")}
              className="lg:w-40"
              selectedKeys={ratingFilter !== "all" ? [ratingFilter] : []}
              onSelectionChange={(keys) => setRatingFilter(Array.from(keys)[0] as string || "all")}
            >
              <SelectItem key="all">{t("feedback.all_ratings")}</SelectItem>
              <SelectItem key="5">5 ⭐</SelectItem>
              <SelectItem key="4">4 ⭐</SelectItem>
              <SelectItem key="3">3 ⭐</SelectItem>
              <SelectItem key="2">2 ⭐</SelectItem>
              <SelectItem key="1">1 ⭐</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Feedback Table */}
      <Card>
        <CardBody className="p-0">
          <Table aria-label="Feedback table">
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody
              isLoading={loading}
              loadingContent={t("feedback.loading_feedback")}
              emptyContent={t("feedback.no_feedback")}
            >
              {feedback.map((item) => (
                <TableRow key={item.id || item.feedback_id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(item, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {feedback.length > 0 && totalPages > 1 && (
            <div className="flex justify-center p-4">
              <Pagination total={totalPages} page={currentPage} onChange={setCurrentPage} />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Feedback Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {isAddMode ? t("feedback.add_feedback") : t("feedback.edit_feedback")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <PatientAutocomplete
                label={t("feedback.patient")}
                placeholder={t("feedback.search_patient_placeholder")}
                value={selectedPatient ? `${selectedPatient.firstName || selectedPatient.first_name} ${selectedPatient.lastName || selectedPatient.last_name} (TC: ${selectedPatient.tcNumber || selectedPatient.tc_number})` : ""}
                onSelect={(patient) => {
                  setSelectedPatient(patient);
                  setFormData({ ...formData, patient_id: patient.patient_id || patient._id || "" });
                }}
                isRequired
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label={t("feedback.rating")}
                  placeholder={t("feedback.select_rating")}
                  selectedKeys={formData.rating ? [formData.rating] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, rating: Array.from(keys)[0] as string || "" })}
                  isRequired
                >
                  <SelectItem key="5">5 ⭐ {t("feedback.excellent")}</SelectItem>
                  <SelectItem key="4">4 ⭐ {t("feedback.very_good")}</SelectItem>
                  <SelectItem key="3">3 ⭐ {t("feedback.good")}</SelectItem>
                  <SelectItem key="2">2 ⭐ {t("feedback.fair")}</SelectItem>
                  <SelectItem key="1">1 ⭐ {t("feedback.poor")}</SelectItem>
                </Select>

                <Select
                  label={t("feedback.category")}
                  placeholder={t("feedback.select_category")}
                  selectedKeys={formData.category ? [formData.category] : []}
                  onSelectionChange={(keys) => setFormData({ ...formData, category: Array.from(keys)[0] as string || "" })}
                  isRequired
                >
                  {feedbackCategories.map((category) => (
                    <SelectItem key={category}>
                      {t(`feedback.${category}`)}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">{t("feedback.anonymous_feedback")}</p>
                  <p className="text-sm text-gray-500">{t("feedback.anonymous_description")}</p>
                </div>
                <Switch
                  isSelected={formData.anonymous}
                  onValueChange={(value) => setFormData({ ...formData, anonymous: value })}
                />
              </div>

              <Textarea
                label={t("feedback.comments")}
                placeholder={t("feedback.comments_placeholder")}
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                minRows={4}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              {t("common.cancel")}
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {isAddMode ? t("feedback.create_feedback") : t("feedback.update_feedback")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Feedback Details Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="2xl">
        <ModalContent>
          <ModalHeader>{t("feedback.feedback_details")}</ModalHeader>
          <ModalBody>
            {feedbackToView && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">{t("feedback.patient")}</p>
                    {feedbackToView.anonymous ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Anonymous</span>
                        <Chip size="sm" variant="flat">Anonymous</Chip>
                      </div>
                    ) : (
                      <p className="font-medium">{getPatientName(feedbackToView.patient_id || "")}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("feedback.date")}</p>
                    <p className="font-medium">{formatDate(feedbackToView.created_at || "")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("feedback.rating")}</p>
                    <div className="mt-1">{renderStars(feedbackToView.rating || 0)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t("feedback.category")}</p>
                    <Chip color={getCategoryColor(feedbackToView.category || "")} size="sm">
                      {t(`feedback.${feedbackToView.category}`) || feedbackToView.category}
                    </Chip>
                  </div>
                </div>

                {feedbackToView.comments && (
                  <div>
                    <p className="text-sm text-gray-500">{t("feedback.comments")}</p>
                    <p className="font-medium">{feedbackToView.comments}</p>
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
          <ModalHeader>{t("feedback.delete_feedback")}</ModalHeader>
          <ModalBody>
            <p>{t("feedback.delete_confirmation")}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onDeleteClose}>
              {t("common.cancel")}
            </Button>
            <Button color="danger" onPress={confirmDeleteFeedback}>
              {t("common.delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}