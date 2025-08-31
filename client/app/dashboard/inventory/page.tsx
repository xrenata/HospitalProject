"use client";

import React, { useState, useEffect } from 'react';
import {
  Card, CardBody, Button, Input, Table, TableHeader, TableColumn, 
  TableBody, TableRow, TableCell, Chip, Pagination, Modal, ModalContent, 
  ModalHeader, ModalBody, ModalFooter, useDisclosure, Select, SelectItem,
  Textarea, Tabs, Tab, Progress
} from '@heroui/react';
import { Wrench, Pill, DollarSign, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { Equipment, Medication } from '@/types';
import { formatDate, getPermissionLevel, formatCurrency } from '@/lib/utils';

export default function InventoryPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('equipment');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isAddMode, setIsAddMode] = useState(false);

  // Mock equipment data
  const mockEquipment: Equipment[] = [
    {
      equipment_id: '1',
      name: 'MRI Scanner',
      description: 'High-resolution 3T MRI machine',
      department_id: '2',
      manufacturer: 'Siemens',
      model: 'MAGNETOM Vida',
      purchase_date: '2022-01-15',
      status: 'operational',
      cost: 2500000
    },
    {
      equipment_id: '2',
      name: 'Ventilator',
      description: 'ICU ventilator for critical care',
      department_id: '4',
      manufacturer: 'Hamilton Medical',
      model: 'HAMILTON-C6',
      purchase_date: '2021-03-20',
      status: 'operational',
      cost: 45000
    },
    {
      equipment_id: '3',
      name: 'X-Ray Machine',
      description: 'Digital radiography system',
      department_id: '3',
      manufacturer: 'GE Healthcare',
      model: 'Discovery XR656',
      purchase_date: '2020-06-10',
      status: 'maintenance',
      cost: 180000
    }
  ];

  // Mock medication data
  const mockMedications: Medication[] = [
    {
      medication_id: '1',
      name: 'Paracetamol',
      description: 'Pain reliever and fever reducer',
      dosage: '500mg',
      manufacturer: 'Generic Pharmaceuticals',
      expiry_date: '2025-12-31',
      stock_quantity: 5000,
      price: 0.15,
      category: 'Pain Management'
    },
    {
      medication_id: '2',
      name: 'Amoxicillin',
      description: 'Broad-spectrum antibiotic',
      dosage: '250mg',
      manufacturer: 'MediCorp Pharma',
      expiry_date: '2025-06-30',
      stock_quantity: 1200,
      price: 0.85,
      category: 'Antibiotics'
    },
    {
      medication_id: '3',
      name: 'Insulin',
      description: 'Fast-acting insulin for diabetes',
      dosage: '100 units/ml',
      manufacturer: 'Novo Nordisk',
      expiry_date: '2024-12-31',
      stock_quantity: 150,
      price: 25.50,
      category: 'Diabetes'
    }
  ];

  useEffect(() => {
    loadData();
  }, [activeTab, searchTerm, statusFilter]);

  const loadData = () => {
    setLoading(true);
    try {
      if (activeTab === 'equipment') {
        let filtered = mockEquipment;
        if (searchTerm) {
          filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        if (statusFilter !== 'all') {
          filtered = filtered.filter(item => item.status === statusFilter);
        }
        setEquipment(filtered);
      } else {
        let filtered = mockMedications;
        if (searchTerm) {
          filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        setMedications(filtered);
      }
      setTotalPages(1);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAddMode(true);
    onOpen();
  };

  const handleEdit = (item: any) => {
    setIsAddMode(false);
    onOpen();
  };

  const handleSubmit = () => {
    alert(`${activeTab === 'equipment' ? 'Equipment' : 'Medication'} ${isAddMode ? 'added' : 'updated'} successfully!`);
    onClose();
    loadData();
  };

  const handleDelete = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      alert('Item deleted successfully!');
      loadData();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'success';
      case 'maintenance': return 'warning';
      case 'out-of-order': return 'danger';
      default: return 'default';
    }
  };

  const getStockLevel = (quantity: number) => {
    if (quantity <= 100) return 'danger';
    if (quantity <= 500) return 'warning';
    return 'success';
  };

  const renderEquipmentCell = (equipment: Equipment, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div>
            <p className="font-medium">{equipment.name}</p>
            <p className="text-sm text-gray-500">{equipment.manufacturer}</p>
          </div>
        );
      case 'model':
        return equipment.model;
      case 'department':
        return `Dept ${equipment.department_id}`;
      case 'cost':
        return formatCurrency(equipment.cost);
      case 'status':
        return (
          <Chip color={getStatusColor(equipment.status)} size="sm">
            {equipment.status}
          </Chip>
        );
      case 'actions':
        return (
          <div className="flex gap-2">
            <Button size="sm" color="primary" variant="flat" onPress={() => handleEdit(equipment)}>
              ✏️
            </Button>
            {getPermissionLevel(user) >= 3 && (
              <Button size="sm" color="danger" variant="flat" onPress={() => handleDelete(equipment.equipment_id)}>
                🗑️
              </Button>
            )}
          </div>
        );
      default:
        return equipment[columnKey as keyof Equipment];
    }
  };

  const renderMedicationCell = (medication: Medication, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return (
          <div>
            <p className="font-medium">{medication.name}</p>
            <p className="text-sm text-gray-500">{medication.dosage}</p>
          </div>
        );
      case 'stock':
        return (
          <div>
            <p>{medication.stock_quantity} units</p>
            <Progress 
              value={(medication.stock_quantity / 1000) * 100} 
              color={getStockLevel(medication.stock_quantity)}
              size="sm"
              className="mt-1"
            />
          </div>
        );
      case 'price':
        return formatCurrency(medication.price);
      case 'expiry':
        return formatDate(medication.expiry_date);
      case 'category':
        return (
          <Chip size="sm" variant="flat">
            {medication.category}
          </Chip>
        );
      case 'actions':
        return (
          <div className="flex gap-2">
            <Button size="sm" color="primary" variant="flat" onPress={() => handleEdit(medication)}>
              ✏️
            </Button>
            {getPermissionLevel(user) >= 2 && (
              <Button size="sm" color="danger" variant="flat" onPress={() => handleDelete(medication.medication_id)}>
                🗑️
              </Button>
            )}
          </div>
        );
      default:
        return medication[columnKey as keyof Medication];
    }
  };

  const equipmentColumns = [
    { key: 'name', label: 'Equipment' },
    { key: 'model', label: 'Model' },
    { key: 'department', label: 'Department' },
    { key: 'cost', label: 'Cost' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ];

  const medicationColumns = [
    { key: 'name', label: 'Medication' },
    { key: 'stock', label: 'Stock Level' },
    { key: 'price', label: 'Price' },
    { key: 'expiry', label: 'Expiry' },
    { key: 'category', label: 'Category' },
    { key: 'actions', label: 'Actions' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('inventory.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('inventory.subtitle')}
          </p>
        </div>
        {getPermissionLevel(user) >= 2 && (
          <Button color="primary" onPress={handleAdd}>
            <span className="mr-2">{activeTab === 'equipment' ? <Wrench size={20} /> : <Pill size={20} />}</span>
            {activeTab === 'equipment' ? t('inventory.add_equipment') : t('inventory.add_medication')}
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-6 text-center">
            <div className="text-2xl mb-2"><Wrench size={32} /></div>
            <h3 className="text-lg font-semibold">{t('inventory.equipment')}</h3>
            <p className="text-2xl font-bold text-blue-600">{equipment.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-6 text-center">
            <div className="text-2xl mb-2"><Pill size={32} /></div>
            <h3 className="text-lg font-semibold">{t('inventory.medications')}</h3>
            <p className="text-2xl font-bold text-green-600">{medications.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-6 text-center">
            <div className="text-2xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold">{t('inventory.low_stock')}</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {medications.filter(m => m.stock_quantity <= 100).length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-6 text-center">
            <div className="text-2xl mb-2"><DollarSign size={32} /></div>
            <h3 className="text-lg font-semibold">{t('inventory.total_value')}</h3>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(equipment.reduce((sum, item) => sum + item.cost, 0))}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder={t('inventory.search_placeholder', { type: activeTab })}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<Search size={16} />}
            />
            {activeTab === 'equipment' && (
              <Select
                placeholder={t('inventory.filter_by_status')}
                className="sm:w-48"
                selectedKeys={statusFilter !== 'all' ? [statusFilter] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setStatusFilter(selectedKey || 'all');
                }}
              >
                <SelectItem key="all">{t('inventory.all_status')}</SelectItem>
                <SelectItem key="operational">{t('inventory.operational')}</SelectItem>
                <SelectItem key="maintenance">{t('inventory.maintenance')}</SelectItem>
                <SelectItem key="out-of-order">{t('inventory.out_of_order')}</SelectItem>
              </Select>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <Card>
        <CardBody className="p-0">
          <Tabs 
            selectedKey={activeTab} 
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="p-6"
          >
            <Tab key="equipment" title={<span className="flex items-center gap-2"><Wrench size={16} /> Equipment</span>}>
              <div className="mt-4">
                <Table aria-label="Equipment table">
                  <TableHeader>
                    {equipmentColumns.map((column) => (
                      <TableColumn key={column.key}>{column.label}</TableColumn>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {equipment.map((item) => (
                      <TableRow key={item.equipment_id}>
                        {equipmentColumns.map((column) => (
                          <TableCell key={column.key}>
                            {renderEquipmentCell(item, column.key)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Tab>
            
            <Tab key="medications" title={<span className="flex items-center gap-2"><Pill size={16} /> Medications</span>}>
              <div className="mt-4">
                <Table aria-label="Medications table">
                  <TableHeader>
                    {medicationColumns.map((column) => (
                      <TableColumn key={column.key}>{column.label}</TableColumn>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {medications.map((item) => (
                      <TableRow key={item.medication_id}>
                        {medicationColumns.map((column) => (
                          <TableCell key={column.key}>
                            {renderMedicationCell(item, column.key)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Simple Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            {isAddMode ? 'Add New' : 'Edit'} {activeTab === 'equipment' ? 'Equipment' : 'Medication'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input label="Name" placeholder="Enter name" />
              <Input label="Manufacturer" placeholder="Enter manufacturer" />
              {activeTab === 'equipment' ? (
                <>
                  <Input label="Model" placeholder="Enter model" />
                  <Input 
                    label="Cost" 
                    type="number" 
                    startContent="$" 
                    onChange={(e) => {
                      // Sadece rakam ve nokta karakterine izin ver
                      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
                    }}
                    placeholder="0.00"
                  />
                </>
              ) : (
                <>
                  <Input 
                    label="Stock Quantity" 
                    type="number" 
                    onChange={(e) => {
                      // Sadece rakam karakterine izin ver
                      e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    }}
                    placeholder="100"
                  />
                  <Input 
                    label="Price" 
                    type="number" 
                    startContent="$" 
                    onChange={(e) => {
                      // Sadece rakam ve nokta karakterine izin ver
                      e.target.value = e.target.value.replace(/[^0-9.]/g, '');
                    }}
                    placeholder="0.00"
                  />
                </>
              )}
              <Textarea label="Description" placeholder="Enter description" />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>Cancel</Button>
            <Button color="primary" onPress={handleSubmit}>
              {isAddMode ? 'Add' : 'Update'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}