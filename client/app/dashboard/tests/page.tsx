"use client";

import React, { useState, useEffect } from "react";
import { 
  Button, 
  Card, 
  CardBody, 
  Input, 
  Select, 
  SelectItem, 
  DatePicker, 
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Spinner,
  Tooltip,
  Badge,
  Tabs,
  Tab
} from "@heroui/react";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  Calendar,
  Clock,
  User,
  TestTube,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PlayCircle,
  MoreVertical,
  Download,
  RefreshCw
} from "lucide-react";
import { testsAPI, patientsAPI, staffAPI, departmentsAPI } from "@/lib/api";
import { useI18n } from "@/contexts/I18nContext";
import TimeWheelPicker from "@/components/TimeWheelPicker";
import PatientAutocomplete from "@/components/PatientAutocomplete";
import toast from "react-hot-toast";

interface Test {
  _id: string;
  id?: string;
  patientId: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  staffId: string | {
    _id: string;
    name: string;
    email: string;
    role: string;
    specialization: string;
  };
  departmentId?: string | {
    _id: string;
    name: string;
  };
  testType: string;
  testName: string;
  testDate: string;
  testTime: string;
  results?: string;
  resultValue?: string;
  normalRange?: string;
  unit?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  cost?: number;
  notes?: string;
  instructions?: string;
  sampleType?: string;
  createdAt: string;
  updatedAt: string;
}

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Staff {
  _id: string;
  name: string;
  email: string;
  role: string;
  specialization: string;
  departmentId?: string;
}

interface Department {
  _id: string;
  name: string;
}

const TestsPage = () => {
  const { t } = useI18n();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // State
  const [tests, setTests] = useState<Test[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTests, setTotalTests] = useState(0);
  const itemsPerPage = 10;
  
  // Filters
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  
  // Form data
  const [formData, setFormData] = useState({
    patientId: "",
    staffId: "",
    departmentId: "",
    testType: "",
    testName: "",
    testDate: "",
    testTime: "",
    priority: "normal",
    cost: "",
    notes: "",
    instructions: "",
    sampleType: "",
    resultValue: "",
    normalRange: "",
    unit: "",
    results: ""
  });

  // Test types
  const testTypes = [
    "Kan Tahlili",
    "İdrar Tahlili",
    "Röntgen",
    "MR",
    "CT",
    "Ultrason",
    "EKG",
    "EEG",
    "Biyopsi",
    "Endoskopi",
    "Kolonoskopi",
    "Mamografi",
    "Kemik Yoğunluğu",
    "Stres Testi",
    "Holter",
    "Spirometri"
  ];

  const sampleTypes = [
    "Kan",
    "İdrar", 
    "Tükürük",
    "Doku",
    "Yok"
  ];

  const priorities = [
    { key: "low", label: t("tests.priority_levels.low"), color: "success" },
    { key: "normal", label: t("tests.priority_levels.normal"), color: "primary" },
    { key: "high", label: t("tests.priority_levels.high"), color: "warning" },
    { key: "urgent", label: t("tests.priority_levels.urgent"), color: "danger" }
  ];

  const statuses = [
    { key: "pending", label: t("tests.status_types.pending"), color: "warning" },
    { key: "in_progress", label: t("tests.status_types.in_progress"), color: "primary" },
    { key: "completed", label: t("tests.status_types.completed"), color: "success" },
    { key: "cancelled", label: t("tests.status_types.cancelled"), color: "danger" }
  ];

  // Load data
  useEffect(() => {
    loadTests();
    loadPatients();
    loadStaff();
    loadDepartments();
  }, [currentPage, selectedTab, searchTerm, selectedStatus, selectedPriority, selectedDepartment]);

  const loadTests = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (selectedTab !== "all") {
        if (selectedTab === "urgent") {
          params.priority = "urgent";
        } else {
          params.status = selectedTab;
        }
      }
      
      if (searchTerm) params.testType = searchTerm;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPriority) params.priority = selectedPriority;
      if (selectedDepartment) params.departmentId = selectedDepartment;

      const response = await testsAPI.getAll(params);
      const data = response.data;
      
      setTests(data.tests || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalTests(data.pagination?.totalItems || 0);
      
    } catch (error) {
      console.error('Error loading tests:', error);
      toast.error(t("tests.error_loading"));
    } finally {
      setLoading(false);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await patientsAPI.getAll({ limit: 1000 });
      const patientsData = response.data.patients || response.data || [];
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error) {
      console.error('Error loading patients:', error);
      setPatients([]); // Ensure patients is always an array
    }
  };

  const loadStaff = async () => {
    try {
      const response = await staffAPI.getAll();
      const staffData = response.data.data || response.data || [];
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch (error) {
      console.error('Error loading staff:', error);
      setStaff([]); // Ensure staff is always an array
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentsAPI.getAll();
      const data = response.data;
      
      // Handle different response formats
      let departmentsData = [];
      if (Array.isArray(data)) {
        departmentsData = data;
      } else if (data && data.departments && Array.isArray(data.departments)) {
        departmentsData = data.departments;
      } else if (data && data.data && Array.isArray(data.data)) {
        departmentsData = data.data;
      } else {
        console.warn('Unexpected departments response format:', data);
        departmentsData = [];
      }
      
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error loading departments:', error);
      setDepartments([]); // Ensure departments is always an array
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: "",
      staffId: "",
      departmentId: "",
      testType: "",
      testName: "",
      testDate: "",
      testTime: "",
      priority: "normal",
      cost: "",
      notes: "",
      instructions: "",
      sampleType: "",
      resultValue: "",
      normalRange: "",
      unit: "",
      results: ""
    });
    setSelectedTest(null);
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.patientId || !formData.staffId || !formData.testType || 
          !formData.testName || !formData.testDate || !formData.testTime) {
        toast.error(t("tests.required_fields"));
        return;
      }

      const submitData = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        priority: formData.priority as 'low' | 'normal' | 'high' | 'urgent'
      };

      if (isEditing && selectedTest) {
        await testsAPI.update(selectedTest._id, submitData);
        toast.success(t("tests.test_updated"));
      } else {
        await testsAPI.create(submitData);
        toast.success(t("tests.test_created"));
      }

      resetForm();
      onClose();
      loadTests();
    } catch (error) {
      console.error('Error saving test:', error);
      toast.error(isEditing ? t("tests.error_updating") : t("tests.error_creating"));
    }
  };

  const handleEdit = (test: Test) => {
    setSelectedTest(test);
    setIsEditing(true);
    
    setFormData({
      patientId: typeof test.patientId === 'string' ? test.patientId : test.patientId._id,
      staffId: typeof test.staffId === 'string' ? test.staffId : test.staffId._id,
      departmentId: test.departmentId ? (typeof test.departmentId === 'string' ? test.departmentId : test.departmentId._id) : "",
      testType: test.testType,
      testName: test.testName,
      testDate: test.testDate.split('T')[0],
      testTime: test.testTime,
      priority: test.priority,
      cost: test.cost?.toString() || "",
      notes: test.notes || "",
      instructions: test.instructions || "",
      sampleType: test.sampleType || "",
      resultValue: test.resultValue || "",
      normalRange: test.normalRange || "",
      unit: test.unit || "",
      results: test.results || ""
    });
    
    onOpen();
  };

  const handleDelete = async (testId: string) => {
    if (!confirm(t("tests.delete_confirmation"))) return;
    
    try {
      await testsAPI.delete(testId);
      toast.success(t("tests.test_deleted"));
      loadTests();
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error(t("tests.error_deleting"));
    }
  };

  const getStatusIcon = (status: Test['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority: Test['priority']) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getPatientName = (patient: Test['patientId']) => {
    if (typeof patient === 'string') {
      if (!Array.isArray(patients)) return 'Bilinmeyen Hasta';
      const found = patients.find(p => p._id === patient);
      return found ? `${found.firstName} ${found.lastName}` : 'Bilinmeyen Hasta';
    }
    return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Bilinmeyen Hasta';
  };

  const getStaffName = (staffMember: Test['staffId']) => {
    if (typeof staffMember === 'string') {
      if (!Array.isArray(staff)) return 'Bilinmeyen Personel';
      const found = staff.find(s => s._id === staffMember);
      return found ? found.name : 'Bilinmeyen Personel';
    }
    return staffMember.name || 'Bilinmeyen Personel';
  };

  const getDepartmentName = (department: Test['departmentId']) => {
    if (!department) return '-';
    if (typeof department === 'string') {
      if (!Array.isArray(departments)) return 'Bilinmeyen Bölüm';
      const found = departments.find(d => d._id === department);
      return found ? found.name : 'Bilinmeyen Bölüm';
    }
    return department.name || 'Bilinmeyen Bölüm';
  };

  const renderCell = (test: Test, columnKey: React.Key) => {
    switch (columnKey) {
      case "patient":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{getPatientName(test.patientId)}</p>
            <p className="text-bold text-sm capitalize text-default-400">
              {typeof test.patientId === 'object' ? test.patientId.phone : ''}
            </p>
          </div>
        );
      case "test":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{test.testName}</p>
            <p className="text-bold text-sm capitalize text-default-400">{test.testType}</p>
          </div>
        );
      case "staff":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm capitalize">{getStaffName(test.staffId)}</p>
            <p className="text-bold text-sm capitalize text-default-400">
              {typeof test.staffId === 'object' ? test.staffId.role : ''}
            </p>
          </div>
        );
      case "department":
        return (
          <span className="text-sm">{getDepartmentName(test.departmentId)}</span>
        );
      case "datetime":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-sm">{new Date(test.testDate).toLocaleDateString('tr-TR')}</p>
            <p className="text-bold text-sm text-default-400">{test.testTime}</p>
          </div>
        );
      case "priority":
        const priority = priorities.find(p => p.key === test.priority);
        return (
          <Chip
            className="capitalize"
            color={priority?.color as any}
            size="sm"
            variant="flat"
            startContent={getPriorityIcon(test.priority)}
          >
            {priority?.label}
          </Chip>
        );
      case "status":
        const status = statuses.find(s => s.key === test.status);
        return (
          <Chip
            className="capitalize"
            color={status?.color as any}
            size="sm"
            variant="flat"
            startContent={getStatusIcon(test.status)}
          >
            {status?.label}
          </Chip>
        );
      case "result":
        return (
          <div className="flex flex-col">
            {test.resultValue && (
              <>
                <p className="text-bold text-sm">{test.resultValue} {test.unit}</p>
                {test.normalRange && (
                  <p className="text-xs text-default-400">Normal: {test.normalRange}</p>
                )}
              </>
            )}
            {test.results && !test.resultValue && (
              <p className="text-sm">{test.results.slice(0, 30)}...</p>
            )}
            {!test.results && !test.resultValue && (
              <span className="text-default-400 text-sm">{t("tests.awaiting_result")}</span>
            )}
          </div>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content={t("tests.view")}>
              <Button size="sm" variant="flat" color="primary" isIconOnly>
                <Eye size={16} />
              </Button>
            </Tooltip>
            <Tooltip content={t("tests.edit")}>
              <Button 
                size="sm" 
                variant="flat" 
                color="warning" 
                isIconOnly
                onPress={() => handleEdit(test)}
              >
                <Edit size={16} />
              </Button>
            </Tooltip>
            <Dropdown>
              <DropdownTrigger>
                <Button size="sm" variant="flat" isIconOnly>
                  <MoreVertical size={16} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  key="download"
                  startContent={<Download size={16} />}
                >
                  {t("tests.download_report")}
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<Trash2 size={16} />}
                  onPress={() => handleDelete(test._id)}
                >
                  {t("tests.delete")}
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return null;
    }
  };

  const filteredTests = tests.filter(test => {
    if (selectedTab === "all") return true;
    if (selectedTab === "urgent") return test.priority === "urgent";
    return test.status === selectedTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("tests.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("tests.subtitle")}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="flat"
            color="primary"
            onPress={loadTests}
            isLoading={loading}
            startContent={!loading && <RefreshCw size={16} />}
          >
            {t("tests.refresh")}
          </Button>
          <Button
            color="primary"
            onPress={() => {
              resetForm();
              onOpen();
            }}
            startContent={<Plus size={16} />}
          >
            {t("tests.add_test")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                              placeholder={t("tests.search_placeholder")}
              value={searchTerm}
              onValueChange={setSearchTerm}
              startContent={<Search size={16} />}
              className="sm:max-w-xs"
              isClearable
              />
              
              <Select
                placeholder={t("tests.status")}
                selectedKeys={selectedStatus ? [selectedStatus] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setSelectedStatus(key || "");
                }}
                className="sm:max-w-xs"
                isClearable
              >
                {statuses.map((status) => (
                  <SelectItem key={status.key} >
                    {status.label}
                  </SelectItem>
                ))}
              </Select>
              
              <Select
                placeholder={t("tests.priority")}
                selectedKeys={selectedPriority ? [selectedPriority] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setSelectedPriority(key || "");
                }}
                className="sm:max-w-xs"
                isClearable
              >
                {priorities.map((priority) => (
                  <SelectItem key={priority.key} >
                    {priority.label}
                  </SelectItem>
                ))}
              </Select>
              
              <Select
                placeholder={t("tests.department")}
                selectedKeys={selectedDepartment ? [selectedDepartment] : []}
                onSelectionChange={(keys) => {
                  const key = Array.from(keys)[0] as string;
                  setSelectedDepartment(key || "");
                }}
                className="sm:max-w-xs"
                isClearable
              >
                {Array.isArray(departments) ? departments.map((dept) => (
                  <SelectItem key={dept._id} >
                    {dept.name}
                  </SelectItem>
                )) : []}
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <Card>
        <CardBody>
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary-500",
              tab: "max-w-fit px-0 h-12",
            }}
          >
            <Tab
              key="all"
              title={
                <div className="flex items-center space-x-2">
                  <span>{t("tests.all")}</span>
                  <Chip size="sm" variant="flat">{totalTests}</Chip>
                  </div>
              }
            />
            <Tab
              key="pending"
              title={
                <div className="flex items-center space-x-2">
                  <span>{t("tests.pending")}</span>
                  <Chip size="sm" color="warning" variant="flat">
                    {tests.filter(t => t.status === 'pending').length}
                  </Chip>
                  </div>
              }
            />
            <Tab
              key="in_progress"
              title={
                <div className="flex items-center space-x-2">
                  <span>{t("tests.in_progress")}</span>
                  <Chip size="sm" color="primary" variant="flat">
                    {tests.filter(t => t.status === 'in_progress').length}
                  </Chip>
                </div>
              }
            />
            <Tab
              key="completed"
              title={
                <div className="flex items-center space-x-2">
                  <span>{t("tests.completed")}</span>
                  <Chip size="sm" color="success" variant="flat">
                    {tests.filter(t => t.status === 'completed').length}
                  </Chip>
                </div>
              }
            />
            <Tab
              key="urgent"
              title={
                <div className="flex items-center space-x-2">
                  <span>{t("tests.urgent")}</span>
                  <Chip size="sm" color="danger" variant="flat">
                    {tests.filter(t => t.priority === 'urgent').length}
                  </Chip>
              </div>
              }
            />
          </Tabs>
        </CardBody>
      </Card>

      {/* Tests Table */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredTests.length === 0 ? (
          <div className="text-center py-12">
              <TestTube className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t("tests.no_tests")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedTab === 'all' 
                  ? t("tests.no_tests_message")
                  : selectedTab === 'urgent' 
                    ? t("tests.no_urgent_tests")
                    : selectedTab === 'pending' 
                      ? t("tests.no_pending_tests")
                      : selectedTab === 'in_progress' 
                        ? t("tests.no_in_progress_tests")
                        : t("tests.no_completed_tests")}
            </p>
          </div>
        ) : (
            <Table aria-label="Tests table" removeWrapper>
              <TableHeader>
                <TableColumn key="patient">{t("tests.patient").toUpperCase()}</TableColumn>
                <TableColumn key="test">{t("tests.test").toUpperCase()}</TableColumn>
                <TableColumn key="staff">{t("tests.staff").toUpperCase()}</TableColumn>
                <TableColumn key="department">{t("tests.department").toUpperCase()}</TableColumn>
                <TableColumn key="datetime">{t("tests.datetime").toUpperCase()}</TableColumn>
                <TableColumn key="priority">{t("tests.priority").toUpperCase()}</TableColumn>
                <TableColumn key="status">{t("tests.status").toUpperCase()}</TableColumn>
                <TableColumn key="result">{t("tests.result").toUpperCase()}</TableColumn>
                <TableColumn key="actions">{t("tests.actions").toUpperCase()}</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredTests.map((test) => (
                  <TableRow key={test._id}>
                    {(columnKey) => (
                      <TableCell>{renderCell(test, columnKey)}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
            showShadow
            color="primary"
          />
                  </div>
      )}

      {/* Add/Edit Test Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          resetForm();
          onClose();
        }}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  {isEditing ? t("tests.edit_test") : t("tests.new_test")}
                  </div>
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patient Selection */}
                  <div className="md:col-span-2">
                    <PatientAutocomplete
                      value={formData.patientId}
                      onSelect={(patient: any) => 
                        setFormData({ ...formData, patientId: patient._id })
                      }
                      placeholder={t("tests.select_patient")}
                      label={`${t("tests.patient")} *`}
                    />
              </div>

                  {/* Staff Selection */}
                  <Select
                    label={`${t("tests.staff")} *`}
                    placeholder={t("tests.select_staff")}
                    selectedKeys={formData.staffId ? [formData.staffId] : []}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string;
                      setFormData({ ...formData, staffId: key || "" });
                    }}
                    variant="bordered"
                  >
                    {Array.isArray(staff) ? staff.map((member) => (
                      <SelectItem key={member._id} >
                        {member.name} - {member.role}
                      </SelectItem>
                    )) : []}
                  </Select>

                  {/* Department Selection */}
                  <Select
                    label={t("tests.department")}
                    placeholder={t("tests.select_department")}
                    selectedKeys={formData.departmentId ? [formData.departmentId] : []}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string;
                      setFormData({ ...formData, departmentId: key || "" });
                    }}
                    variant="bordered"
                  >
                    {Array.isArray(departments) ? departments.map((dept) => (
                      <SelectItem key={dept._id} >
                        {dept.name}
                      </SelectItem>
                    )) : []}
                  </Select>

                  {/* Test Type */}
                  <Select
                    label={`${t("tests.test_type")} *`}
                    placeholder={t("tests.select_test_type")}
                    selectedKeys={formData.testType ? [formData.testType] : []}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string;
                      setFormData({ ...formData, testType: key || "" });
                    }}
                    variant="bordered"
                  >
                    {testTypes.map((type) => (
                      <SelectItem key={type} >
                        {type}
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Test Name */}
                  <Input
                    label={`${t("tests.test_name")} *`}
                    placeholder={t("tests.enter_test_name")}
                    value={formData.testName}
                    onValueChange={(value) => setFormData({ ...formData, testName: value })}
                    variant="bordered"
                  />

                  {/* Test Date */}
                  <Input
                    label={`${t("tests.test_date")} *`}
                    type="date"
                    value={formData.testDate}
                    onValueChange={(value) => setFormData({ ...formData, testDate: value })}
                    variant="bordered"
                  />

                  {/* Test Time */}
                  <TimeWheelPicker
                    label={`${t("tests.test_time")} *`}
                    value={formData.testTime}
                    onChange={(time: string) => setFormData({ ...formData, testTime: time })}
                  />

                  {/* Priority */}
                  <Select
                    label={t("tests.priority")}
                    placeholder={t("tests.select_priority")}
                    selectedKeys={[formData.priority]}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string;
                      setFormData({ ...formData, priority: key || "normal" });
                    }}
                    variant="bordered"
                  >
                    {priorities.map((priority) => (
                      <SelectItem key={priority.key} >
                        {priority.label}
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Sample Type */}
                  <Select
                    label={t("tests.sample_type")}
                    placeholder={t("tests.select_sample_type")}
                    selectedKeys={formData.sampleType ? [formData.sampleType] : []}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0] as string;
                      setFormData({ ...formData, sampleType: key || "" });
                    }}
                    variant="bordered"
                  >
                    {sampleTypes.map((type) => (
                      <SelectItem key={type} >
                        {type}
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Cost */}
                  <Input
                    label={t("tests.cost")}
                    placeholder="0.00"
                    value={formData.cost}
                    onValueChange={(value) => setFormData({ ...formData, cost: value })}
                    variant="bordered"
                    type="number"
                    startContent={<span className="text-small text-default-400">₺</span>}
                  />

                  {/* Results Section - Only show when editing */}
                  {isEditing && (
                    <>
                      <Input
                        label={t("tests.result_value")}
                        placeholder={t("tests.enter_result_value")}
                        value={formData.resultValue}
                        onValueChange={(value) => setFormData({ ...formData, resultValue: value })}
                        variant="bordered"
                      />

                      <Input
                        label={t("tests.normal_range")}
                        placeholder={t("tests.enter_normal_range")}
                        value={formData.normalRange}
                        onValueChange={(value) => setFormData({ ...formData, normalRange: value })}
                        variant="bordered"
                      />

                      <Input
                        label={t("tests.unit")}
                        placeholder={t("tests.enter_unit")}
                        value={formData.unit}
                        onValueChange={(value) => setFormData({ ...formData, unit: value })}
                        variant="bordered"
                      />
                    </>
                  )}

                  {/* Instructions */}
                  <div className="md:col-span-2">
                    <Textarea
                      label={t("tests.instructions")}
                      placeholder={t("tests.enter_instructions")}
                      value={formData.instructions}
                      onValueChange={(value) => setFormData({ ...formData, instructions: value })}
                      variant="bordered"
                      minRows={3}
                    />
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-2">
                    <Textarea
                      label={t("tests.notes")}
                      placeholder={t("tests.enter_notes")}
                      value={formData.notes}
                      onValueChange={(value) => setFormData({ ...formData, notes: value })}
                      variant="bordered"
                      minRows={3}
                    />
                </div>

                  {/* Results - Only show when editing */}
                  {isEditing && (
                    <div className="md:col-span-2">
                      <Textarea
                        label={t("tests.results")}
                        placeholder={t("tests.enter_results")}
                        value={formData.results}
                        onValueChange={(value) => setFormData({ ...formData, results: value })}
                        variant="bordered"
                        minRows={4}
                      />
                </div>
              )}
            </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t("tests.cancel")}
                </Button>
                <Button color="primary" onPress={handleSubmit}>
                  {isEditing ? t("tests.update") : t("tests.save")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default TestsPage;