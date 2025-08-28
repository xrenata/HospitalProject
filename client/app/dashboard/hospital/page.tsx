"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Textarea,
  Chip,
  Divider,
} from "@heroui/react";
import { Building2, Edit, Save, Plus, Trash2, Globe, Mail, Phone, MapPin, Users, Bed, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { hospitalAPI, departmentsAPI, staffAPI } from "@/lib/api";
import { HospitalInfo, Department, Staff } from "@/types";
import { formatDate, getPermissionLevel } from "@/lib/utils";
import toast from "react-hot-toast";

export default function HospitalInfoPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isServiceOpen, onOpen: onServiceOpen, onClose: onServiceClose } = useDisclosure();
  const { isOpen: isAccreditationOpen, onOpen: onAccreditationOpen, onClose: onAccreditationClose } = useDisclosure();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    established_date: "",
    bed_capacity: "",
    director_name: "",
    description: "",
  });

  // Service and accreditation management
  const [newService, setNewService] = useState("");
  const [newAccreditation, setNewAccreditation] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [accreditations, setAccreditations] = useState<string[]>([]);

  useEffect(() => {
    loadHospitalInfo();
    loadDepartments();
    loadStaff();
  }, []);

  const loadHospitalInfo = async () => {
    setLoading(true);
    try {
      const response = await hospitalAPI.getAll();
      
      let hospitalData = null;
      if (response.data.hospital && response.data.hospital.length > 0) {
        hospitalData = response.data.hospital[0];
      } else if (Array.isArray(response.data) && response.data.length > 0) {
        hospitalData = response.data[0];
      } else if (response.data && !Array.isArray(response.data)) {
        hospitalData = response.data;
      }

      if (hospitalData) {
        setHospitalInfo(hospitalData);
        setFormData({
          name: hospitalData.name || "",
          address: hospitalData.address || "",
          phone: hospitalData.phone || "",
          email: hospitalData.email || "",
          website: hospitalData.website || "",
          established_date: hospitalData.established_date || hospitalData.establishedDate ? (hospitalData.established_date || hospitalData.establishedDate)!.split("T")[0] : "",
          bed_capacity: hospitalData.bed_capacity || hospitalData.bedCapacity ? (hospitalData.bed_capacity || hospitalData.bedCapacity)!.toString() : "",
          director_name: hospitalData.director_name || hospitalData.directorName || "",
          description: hospitalData.description || "",
        });
        setServices(hospitalData.services || []);
        setAccreditations(hospitalData.accreditation || []);
      }
    } catch (error) {
      console.error("Failed to load hospital info:", error);
      toast.error(t("hospital.loading_error"));
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

  const loadStaff = async () => {
    try {
      const response = await staffAPI.getAll();
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setStaff(response.data.data);
      } else if (Array.isArray(response.data)) {
        setStaff(response.data);
      }
    } catch (error) {
      console.error("Failed to load staff:", error);
      setStaff([]);
    }
  };

  const handleEdit = () => {
    if (getPermissionLevel(user) < 3) {
      toast.error(t("hospital.insufficient_permissions"));
      return;
    }
    setIsEditing(true);
    onOpen();
  };

  const handleSave = async () => {
    if (getPermissionLevel(user) < 3) {
      toast.error(t("hospital.insufficient_permissions"));
      return;
    }

    try {
      if (!formData.name.trim()) {
        toast.error(t("hospital.name_required"));
        return;
      }

      const apiData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        website: formData.website.trim(),
        established_date: formData.established_date || null,
        bed_capacity: formData.bed_capacity ? parseInt(formData.bed_capacity) : 0,
        staff_count: staff.filter(s => s.status === 'active').length,
        director_name: formData.director_name.trim(),
        description: formData.description.trim(),
        services: services,
        accreditation: accreditations,
        departments: departments,
        status: "active",
      };

      if (hospitalInfo) {
        const hospitalId = hospitalInfo.hospital_id || hospitalInfo._id || hospitalInfo.id?.toString();
        await hospitalAPI.update(hospitalId || "", apiData);
        toast.success(t("hospital.hospital_updated"));
      } else {
        await hospitalAPI.create(apiData);
        toast.success(t("hospital.hospital_created"));
      }

      setIsEditing(false);
      onClose();
      loadHospitalInfo();
    } catch (error: any) {
      console.error("Failed to save hospital info:", error);
      const errorMessage = error?.response?.data?.error || error?.message || t("common.error_saving");
      toast.error(errorMessage);
    }
  };

  const handleAddService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService("");
    }
  };

  const handleRemoveService = (service: string) => {
    setServices(services.filter(s => s !== service));
  };

  const handleAddAccreditation = () => {
    if (newAccreditation.trim() && !accreditations.includes(newAccreditation.trim())) {
      setAccreditations([...accreditations, newAccreditation.trim()]);
      setNewAccreditation("");
    }
  };

  const handleRemoveAccreditation = (accreditation: string) => {
    setAccreditations(accreditations.filter(a => a !== accreditation));
  };

  const getActiveStaffCount = () => {
    return staff.filter(s => s.status === 'active').length;
  };

  const getActiveDepartments = () => {
    return departments.filter(d => d.status === 'active').length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t("hospital.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("hospital.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("hospital.subtitle")}
          </p>
        </div>
        {getPermissionLevel(user) >= 3 && (
          <Button color="primary" onPress={handleEdit}>
            <Edit className="mr-2" size={20} />
            {hospitalInfo ? t("hospital.edit_info") : t("hospital.add_info")}
          </Button>
        )}
      </div>

      {hospitalInfo ? (
        <>
          {/* Hospital Overview Card */}
          <Card>
            <CardBody className="p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-primary/20 rounded-xl">
                      <Building2 className="text-primary" size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {hospitalInfo.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {hospitalInfo.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <MapPin className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">{t("hospital.address")}</p>
                        <p className="font-medium">{hospitalInfo.address || "-"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">{t("hospital.phone")}</p>
                        <p className="font-medium">{hospitalInfo.phone || "-"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">{t("hospital.email")}</p>
                        <p className="font-medium">{hospitalInfo.email || "-"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Globe className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">{t("hospital.website")}</p>
                        <p className="font-medium">
                          {hospitalInfo.website ? (
                            <a 
                              href={hospitalInfo.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {hospitalInfo.website}
                            </a>
                          ) : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Calendar className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">{t("hospital.established_date")}</p>
                        <p className="font-medium">
                          {hospitalInfo.established_date || hospitalInfo.establishedDate 
                            ? formatDate(hospitalInfo.established_date || hospitalInfo.establishedDate || "") 
                            : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Users className="text-gray-400" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">{t("hospital.director")}</p>
                        <p className="font-medium">{hospitalInfo.director_name || hospitalInfo.directorName || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="lg:w-72">
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                      <CardBody className="p-4 text-center">
                        <Bed className="mx-auto mb-2 text-blue-600" size={24} />
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {hospitalInfo.bed_capacity || hospitalInfo.bedCapacity || 0}
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">{t("hospital.bed_capacity")}</p>
                      </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                      <CardBody className="p-4 text-center">
                        <Users className="mx-auto mb-2 text-green-600" size={24} />
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                          {getActiveStaffCount()}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">{t("hospital.staff_count")}</p>
                      </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
                      <CardBody className="p-4 text-center">
                        <Building2 className="mx-auto mb-2 text-purple-600" size={24} />
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {getActiveDepartments()}
                        </p>
                        <p className="text-sm text-purple-700 dark:text-purple-300">{t("hospital.departments")}</p>
                      </CardBody>
                    </Card>

                    <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
                      <CardBody className="p-4 text-center">
                        <Chip className="mx-auto mb-2" color="success" variant="flat">
                          {t(`hospital.${hospitalInfo.status}`) || hospitalInfo.status || "active"}
                        </Chip>
                        <p className="text-sm text-orange-700 dark:text-orange-300">{t("common.status")}</p>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Services and Accreditations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Services */}
            <Card>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold mb-4">{t("hospital.services")}</h3>
                {services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {services.map((service, index) => (
                      <Chip key={index} color="primary" variant="flat">
                        {service}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">{t("hospital.no_services")}</p>
                )}
              </CardBody>
            </Card>

            {/* Accreditations */}
            <Card>
              <CardBody className="p-6">
                <h3 className="text-lg font-semibold mb-4">{t("hospital.accreditations")}</h3>
                {accreditations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {accreditations.map((accreditation, index) => (
                      <Chip key={index} color="success" variant="flat">
                        {accreditation}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">{t("hospital.no_accreditations")}</p>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      ) : (
        // No hospital info exists
        <Card>
          <CardBody className="p-12 text-center">
            <Building2 className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-xl font-semibold mb-2">{t("hospital.no_info_title")}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {t("hospital.no_info_description")}
            </p>
            {getPermissionLevel(user) >= 3 && (
              <Button color="primary" onPress={handleEdit}>
                <Plus className="mr-2" size={20} />
                {t("hospital.add_info")}
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      {/* Edit Hospital Info Modal */}
      <Modal isOpen={isOpen} onClose={() => { onClose(); setIsEditing(false); }} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            {hospitalInfo ? t("hospital.edit_info") : t("hospital.add_info")}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-semibold mb-4">{t("hospital.basic_information")}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t("hospital.name")}
                    placeholder={t("hospital.name_placeholder")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    isRequired
                    className="md:col-span-2"
                  />

                  <Input
                    label={t("hospital.phone")}
                    placeholder={t("hospital.phone_placeholder")}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />

                  <Input
                    label={t("hospital.email")}
                    type="email"
                    placeholder={t("hospital.email_placeholder")}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />

                  <Input
                    label={t("hospital.website")}
                    placeholder={t("hospital.website_placeholder")}
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />

                  <Input
                    type="date"
                    label={t("hospital.established_date")}
                    value={formData.established_date}
                    onChange={(e) => setFormData({ ...formData, established_date: e.target.value })}
                  />

                  <Input
                    type="number"
                    label={t("hospital.bed_capacity")}
                    placeholder="0"
                    value={formData.bed_capacity}
                    onChange={(e) => setFormData({ ...formData, bed_capacity: e.target.value })}
                    min="0"
                  />

                  <Input
                    label={t("hospital.director_name")}
                    placeholder={t("hospital.director_name_placeholder")}
                    value={formData.director_name}
                    onChange={(e) => setFormData({ ...formData, director_name: e.target.value })}
                    className="md:col-span-2"
                  />
                </div>

                <Textarea
                  label={t("hospital.address")}
                  placeholder={t("hospital.address_placeholder")}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-4"
                />

                <Textarea
                  label={t("hospital.description")}
                  placeholder={t("hospital.description_placeholder")}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-4"
                />
              </div>

              <Divider />

              {/* Services */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">{t("hospital.services")}</h4>
                  <Button size="sm" color="primary" onPress={onServiceOpen}>
                    <Plus size={16} />
                    {t("hospital.add_service")}
                  </Button>
                </div>
                {services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {services.map((service, index) => (
                      <Chip 
                        key={index} 
                        color="primary" 
                        variant="flat"
                        onClose={() => handleRemoveService(service)}
                      >
                        {service}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">{t("hospital.no_services")}</p>
                )}
              </div>

              <Divider />

              {/* Accreditations */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">{t("hospital.accreditations")}</h4>
                  <Button size="sm" color="success" onPress={onAccreditationOpen}>
                    <Plus size={16} />
                    {t("hospital.add_accreditation")}
                  </Button>
                </div>
                {accreditations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {accreditations.map((accreditation, index) => (
                      <Chip 
                        key={index} 
                        color="success" 
                        variant="flat"
                        onClose={() => handleRemoveAccreditation(accreditation)}
                      >
                        {accreditation}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">{t("hospital.no_accreditations")}</p>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={() => { onClose(); setIsEditing(false); }}>
              {t("common.cancel")}
            </Button>
            <Button color="primary" onPress={handleSave}>
              <Save className="mr-2" size={16} />
              {hospitalInfo ? t("hospital.update_info") : t("hospital.create_info")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Service Modal */}
      <Modal isOpen={isServiceOpen} onClose={onServiceClose}>
        <ModalContent>
          <ModalHeader>{t("hospital.add_service")}</ModalHeader>
          <ModalBody>
            <Input
              label={t("hospital.service_name")}
              placeholder={t("hospital.service_name_placeholder")}
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddService()}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onServiceClose}>
              {t("common.cancel")}
            </Button>
            <Button color="primary" onPress={() => { handleAddService(); onServiceClose(); }}>
              {t("common.add")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Accreditation Modal */}
      <Modal isOpen={isAccreditationOpen} onClose={onAccreditationClose}>
        <ModalContent>
          <ModalHeader>{t("hospital.add_accreditation")}</ModalHeader>
          <ModalBody>
            <Input
              label={t("hospital.accreditation_name")}
              placeholder={t("hospital.accreditation_name_placeholder")}
              value={newAccreditation}
              onChange={(e) => setNewAccreditation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddAccreditation()}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onAccreditationClose}>
              {t("common.cancel")}
            </Button>
            <Button color="primary" onPress={() => { handleAddAccreditation(); onAccreditationClose(); }}>
              {t("common.add")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}