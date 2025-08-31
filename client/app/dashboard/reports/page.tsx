"use client";

import React, { useState, useEffect } from 'react';
import {
  Card, CardBody, CardHeader, Button, Input, Select, SelectItem,
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  useDisclosure, Spinner, Chip, Divider, Checkbox, CheckboxGroup,
  Textarea, Progress, Tabs, Tab
} from '@heroui/react';
import {
  FileText, Download, Calendar, Filter, Settings, Eye, Share2,
  Clock, CheckCircle, AlertCircle, TrendingUp, Users, DollarSign,
  Activity, Package, Stethoscope, Building, RefreshCw, Play,
  FileSpreadsheet, Mail, Printer
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { reportsAPI, departmentsAPI } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: string[];
  requiredPermission: number;
}

interface Department {
  _id: string;
  name: string;
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  status: 'completed' | 'processing' | 'failed';
  size?: string;
  downloadUrl?: string;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  
  // Form states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState('monthly');
  
  // Modal states
  const { isOpen: isGenerateOpen, onOpen: onGenerateOpen, onClose: onGenerateClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const [generating, setGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesResponse, departmentsResponse] = await Promise.all([
        reportsAPI.getTemplates(),
        departmentsAPI.getAll({ limit: 1000 })
      ]);

      setTemplates(templatesResponse.data?.data || []);
      setDepartments(departmentsResponse.data?.data || []);
      
      // Load saved reports from localStorage
      const savedReports = localStorage.getItem('generatedReports');
      if (savedReports) {
        setGeneratedReports(JSON.parse(savedReports));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate || !startDate || !endDate) {
      alert(t('reports.fill_required_fields'));
      return;
    }

    setGenerating(true);
    try {
      const reportData = {
        startDate,
        endDate,
        ...(selectedDepartments.length > 0 && { departments: selectedDepartments }),
        ...(selectedFields.length > 0 && { includeFields: selectedFields })
      };

      let response;
      switch (selectedTemplate.id) {
        case 'patient-summary':
          response = await reportsAPI.generatePatientReport(reportData);
          break;
        case 'appointment-analytics':
          response = await reportsAPI.generateAppointmentReport(reportData);
          break;
        case 'financial-summary':
          response = await reportsAPI.generateFinancialReport(reportData);
          break;
        case 'staff-performance':
          response = await reportsAPI.generateStaffReport(reportData);
          break;
        case 'inventory-status':
          response = await reportsAPI.generateInventoryReport();
          break;
        case 'comprehensive-monthly':
          response = await reportsAPI.generateComprehensiveReport(reportData);
          break;
        default:
          throw new Error(t('reports.invalid_report_type'));
      }

      // Create report entry
      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        name: reportName || selectedTemplate.name,
        type: selectedTemplate.id,
        generatedAt: new Date().toISOString(),
        status: 'completed',
        size: '2.4 MB' // Mock size
      };

      // Save to localStorage and state
      const updatedReports = [...generatedReports, newReport];
      setGeneratedReports(updatedReports);
      localStorage.setItem('generatedReports', JSON.stringify(updatedReports));

      // Store report data for preview
      setPreviewData(response.data?.data);
      
      onGenerateClose();
      alert(t('reports.report_generated_success'));
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert(t('reports.report_generation_error'));
    } finally {
      setGenerating(false);
    }
  };

  const handlePreviewReport = (report: GeneratedReport) => {
    // In a real app, you would fetch the actual report data
    setPreviewData({
      metadata: {
        reportType: report.type,
        generatedAt: report.generatedAt,
        name: report.name
      },
      summary: t('reports.preview_sample_data')
    });
    onPreviewOpen();
  };

  const handleDownloadReport = (report: GeneratedReport, format: 'json' | 'pdf' | 'excel') => {
    // Mock download functionality
    const blob = new Blob([JSON.stringify(previewData || {}, null, 2)], { 
      type: format === 'json' ? 'application/json' : 'application/octet-stream' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name}.${format === 'excel' ? 'xlsx' : format}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'patients': return <Users size={20} />;
      case 'appointments': return <Calendar size={20} />;
      case 'financial': return <DollarSign size={20} />;
      case 'staff': return <Stethoscope size={20} />;
      case 'inventory': return <Package size={20} />;
      case 'departments': return <Building size={20} />;
      case 'quality': return <Activity size={20} />;
      case 'comprehensive': return <FileText size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'patients': return 'primary';
      case 'appointments': return 'secondary';
      case 'financial': return 'success';
      case 'staff': return 'warning';
      case 'inventory': return 'danger';
      case 'departments': return 'default';
      case 'quality': return 'primary';
      case 'comprehensive': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'danger';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'processing': return <Clock size={16} />;
      case 'failed': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('reports.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('reports.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="flat"
            onPress={loadData}
            startContent={<RefreshCw size={16} />}
          >
            {t('reports.refresh')}
          </Button>
          <Button
            color="primary"
            onPress={() => {
              setSelectedTemplate(null);
              setStartDate('');
              setEndDate('');
              setSelectedDepartments([]);
              setSelectedFields([]);
              setReportName('');
              setReportDescription('');
              onGenerateOpen();
            }}
            startContent={<FileText size={16} />}
          >
            {t('reports.new_report')}
          </Button>
        </div>
      </div>

      <Tabs defaultSelectedKey="templates">
        <Tab key="templates" title={t('reports.report_templates')}>
          {/* Report Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card 
                key={template.id} 
                isPressable 
                onPress={() => {
                  setSelectedTemplate(template);
                  setReportName(template.name);
                  onGenerateOpen();
                }}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-${getCategoryColor(template.category)}-100 dark:bg-${getCategoryColor(template.category)}-900/20`}>
                        {getTemplateIcon(template.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{template.name}</h3>
                        <Chip 
                          size="sm" 
                          color={getCategoryColor(template.category) as any}
                          variant="flat"
                        >
                          {template.category}
                        </Chip>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {template.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {t('reports.fields_count', { count: template.fields.length.toString() })}
                    </span>
                    <div className="flex items-center gap-2 text-primary">
                      <Play size={14} />
                      <span className="text-sm font-medium">{t('reports.create')}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </Tab>

        <Tab key="generated" title={t('reports.generated_reports', { count: generatedReports.length.toString() })}>
          {/* Generated Reports */}
          <Card>
            <CardBody className="p-0">
              {generatedReports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('reports.no_reports_yet')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('reports.start_with_template')}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {generatedReports.map((report) => (
                    <div key={report.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(report.status)}
                            <div>
                              <h4 className="font-medium">{report.name}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <span>{formatDate(report.generatedAt)}</span>
                                <span>•</span>
                                <span>{report.size}</span>
                                <Chip 
                                  size="sm" 
                                  color={getStatusColor(report.status) as any}
                                  variant="flat"
                                >
                                  {t(`reports.${report.status}`)}
                                </Chip>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => handlePreviewReport(report)}
                            startContent={<Eye size={14} />}
                          >
                            {t('reports.preview')}
                          </Button>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() => handleDownloadReport(report, 'json')}
                              isIconOnly
                            >
                              <FileText size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() => handleDownloadReport(report, 'excel')}
                              isIconOnly
                            >
                              <FileSpreadsheet size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="flat"
                              onPress={() => handleDownloadReport(report, 'pdf')}
                              isIconOnly
                            >
                              <FileText size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </Tab>
      </Tabs>

      {/* Generate Report Modal */}
      <Modal 
        isOpen={isGenerateOpen} 
        onClose={onGenerateClose} 
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {selectedTemplate ? selectedTemplate.name : t('reports.new_report_create')}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {!selectedTemplate && (
                <Select
                  label={t('reports.report_template')}
                  placeholder={t('reports.select_template')}
                  onSelectionChange={(keys) => {
                    const templateId = Array.from(keys)[0] as string;
                    const template = templates.find(t => t.id === templateId);
                    setSelectedTemplate(template || null);
                    setReportName(template?.name || '');
                  }}
                >
                  {templates.map((template) => (
                    <SelectItem key={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </Select>
              )}

              {selectedTemplate && (
                <Card>
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      {getTemplateIcon(selectedTemplate.category)}
                      <div>
                        <h4 className="font-medium">{selectedTemplate.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedTemplate.description}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label={t('reports.start_date')}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  isRequired
                />
                <Input
                  type="date"
                  label={t('reports.end_date')}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  isRequired
                />
              </div>

              <Input
                label={t('reports.report_name')}
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder={t('reports.custom_report_name')}
              />

              <Textarea
                label={t('reports.description')}
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder={t('reports.report_description')}
                rows={2}
              />

              {departments.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t('reports.departments_optional')}
                  </label>
                  <CheckboxGroup
                    value={selectedDepartments}
                    onValueChange={setSelectedDepartments}
                    className="grid grid-cols-2 gap-2"
                  >
                    {departments.map((dept) => (
                      <Checkbox key={dept._id} value={dept._id}>
                        {dept.name}
                      </Checkbox>
                    ))}
                  </CheckboxGroup>
                </div>
              )}

              <Divider />

              <div className="flex items-center gap-2">
                <Checkbox
                  isSelected={autoSchedule}
                  onValueChange={setAutoSchedule}
                >
                  {t('reports.auto_schedule')}
                </Checkbox>
                {autoSchedule && (
                  <Select
                    size="sm"
                    selectedKeys={[scheduleFrequency]}
                    className="w-32"
                    onSelectionChange={(keys) => {
                      const freq = Array.from(keys)[0] as string;
                      setScheduleFrequency(freq);
                    }}
                  >
                    <SelectItem key="daily">{t('reports.daily')}</SelectItem>
                    <SelectItem key="weekly">{t('reports.weekly')}</SelectItem>
                    <SelectItem key="monthly">{t('reports.monthly')}</SelectItem>
                  </Select>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onGenerateClose}>
              {t('reports.cancel')}
            </Button>
            <Button 
              color="primary" 
              onPress={handleGenerateReport}
              isLoading={generating}
              isDisabled={!selectedTemplate || !startDate || !endDate}
            >
              {t('reports.generate_report')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Preview Modal */}
      <Modal 
        isOpen={isPreviewOpen} 
        onClose={onPreviewClose} 
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>{t('reports.report_preview')}</ModalHeader>
          <ModalBody>
            {previewData ? (
              <div className="space-y-4">
                <Card>
                  <CardBody>
                    <h4 className="font-medium mb-2">{t('reports.report_information')}</h4>
                    <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                      <p><strong>{t('reports.report_type')}:</strong> {previewData.metadata?.reportType}</p>
                      <p><strong>{t('reports.generated_at')}:</strong> {formatDate(previewData.metadata?.generatedAt)}</p>
                      <p><strong>{t('reports.report_name_label')}:</strong> {previewData.metadata?.name}</p>
                    </div>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardBody>
                    <h4 className="font-medium mb-2">{t('reports.report_content')}</h4>
                    <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96">
                      {JSON.stringify(previewData, null, 2)}
                    </pre>
                  </CardBody>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <Spinner size="lg" />
                <p className="mt-2">{t('reports.loading_report')}</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onPreviewClose}>
              {t('reports.close')}
            </Button>
            <Button 
              color="primary" 
              startContent={<Download size={16} />}
              onPress={() => {
                if (previewData) {
                  const blob = new Blob([JSON.stringify(previewData, null, 2)], { type: 'application/json' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `report-${Date.now()}.json`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }
              }}
            >
              {t('reports.download')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
