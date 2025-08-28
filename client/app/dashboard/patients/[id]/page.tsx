"use client";

import React, { useState, useEffect } from 'react';
import {
  Card, CardBody, Button, Chip, Tabs, Tab, Table, TableHeader, 
  TableColumn, TableBody, TableRow, TableCell
} from '@heroui/react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Patient, Appointment, Treatment } from '@/types';
import { formatDate, getPermissionLevel } from '@/lib/utils';

export default function PatientDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock patient data
  const mockPatient: Patient = {
    patient_id: '1',
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    name: 'John Doe',
    age: 39,
    date_of_birth: '1985-03-15',
    gender: 'Male',
    phone: '+1-555-0123',
    email: 'john.doe@email.com',
    address: '123 Main St, City, State 12345',
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '+1-555-0124',
    blood_type: 'O+',
    insurance_info: 'Blue Cross Blue Shield',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  };

  const mockAppointments: Appointment[] = [
    {
      appointment_id: '1',
      id: 1,
      patient_id: '1',
      staff_id: '2',
      appointment_date: '2024-02-15T10:00:00Z',
      appointment_time: '10:00',
      reason: 'Annual checkup',
      status: 'scheduled',
      notes: 'Regular health examination',
      created_at: '2024-01-20T08:00:00Z',
      updated_at: '2024-01-20T08:00:00Z'
    },
    {
      appointment_id: '2',
      id: 2,
      patient_id: '1',
      staff_id: '3',
      appointment_date: '2024-01-28T14:30:00Z',
      appointment_time: '14:30',
      reason: 'Follow-up consultation',
      status: 'completed',
      notes: 'Blood pressure check completed',
      created_at: '2024-01-15T09:00:00Z',
      updated_at: '2024-01-28T15:00:00Z'
    }
  ];

  const mockTreatments: Treatment[] = [
    {
      treatment_id: '1',
      id: 1,
      patient_id: '1',
      staff_id: '2',
      diagnosis: 'Hypertension',
      treatment_description: 'Blood pressure medication prescribed',
      description: 'Blood pressure medication prescribed',
      medication: 'Lisinopril 10mg daily',
      treatment_date: '2024-01-28T14:30:00Z',
      start_date: '2024-01-28T14:30:00Z',
      status: 'ongoing',
      notes: 'Patient responded well to treatment',
      created_at: '2024-01-28T15:00:00Z',
      updated_at: '2024-01-28T15:00:00Z'
    }
  ];

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      // For now, use mock data
      // const patientResponse = await api.getPatient(patientId);
      // const appointmentsResponse = await api.getPatientAppointments(patientId);
      // const treatmentsResponse = await api.getPatientTreatments(patientId);
      
      setPatient(mockPatient);
      setAppointments(mockAppointments);
      setTreatments(mockTreatments);
    } catch (error) {
      console.error('Failed to load patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'no-show': return 'warning';
      default: return 'default';
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading patient information...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Patient not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="flat" onPress={() => router.back()}>
            <span className="mr-2">←</span>
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {patient.first_name || ''} {patient.last_name || ''}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Patient ID: #{patient.id || patient.patient_id}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button color="primary" variant="flat">
            <span className="mr-2">📅</span>
            Schedule Appointment
          </Button>
          <Button color="primary">
            <span className="mr-2">📝</span>
            Add Treatment
          </Button>
        </div>
      </div>

      {/* Patient Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                <p className="font-medium">{patient.first_name || ''} {patient.last_name || ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Age</p>
                <p className="font-medium">{patient.date_of_birth ? calculateAge(patient.date_of_birth) : patient.age} years old</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</p>
                <p className="font-medium">{patient.date_of_birth ? formatDate(patient.date_of_birth) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gender</p>
                <p className="font-medium">{patient.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                <p className="font-medium">{patient.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-medium">{patient.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Blood Type</p>
                <p className="font-medium">{patient.blood_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Insurance</p>
                <p className="font-medium">{patient.insurance_info || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                <p className="font-medium">{patient.address}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                <p className="font-medium">{patient.emergency_contact_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                <p className="font-medium">{patient.emergency_contact_phone || 'N/A'}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold mb-3">Quick Stats</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Appointments</span>
                  <span className="font-medium">{appointments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Treatments</span>
                  <span className="font-medium">{treatments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Visit</span>
                  <span className="font-medium">
                    {appointments.length > 0 ? formatDate(appointments[0].appointment_date) : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Card>
        <CardBody className="p-0">
          <Tabs aria-label="Patient details" className="p-6">
            <Tab key="appointments" title="Appointments">
              <div className="mt-4">
                <Table aria-label="Appointments table">
                  <TableHeader>
                    <TableColumn>Date & Time</TableColumn>
                    <TableColumn>Reason</TableColumn>
                    <TableColumn>Status</TableColumn>
                    <TableColumn>Notes</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id || appointment.appointment_id}>
                        <TableCell>
                          <div>
                            <p>{formatDate(appointment.appointment_date)}</p>
                            <p className="text-sm text-gray-500">{appointment.appointment_time}</p>
                          </div>
                        </TableCell>
                        <TableCell>{appointment.reason || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip color={getStatusColor(appointment.status)} size="sm">
                            {appointment.status}
                          </Chip>
                        </TableCell>
                        <TableCell>{appointment.notes || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Tab>
            
            <Tab key="treatments" title="Medical History">
              <div className="mt-4">
                <Table aria-label="Treatments table">
                  <TableHeader>
                    <TableColumn>Date</TableColumn>
                    <TableColumn>Diagnosis</TableColumn>
                    <TableColumn>Treatment</TableColumn>
                    <TableColumn>Medication</TableColumn>
                    <TableColumn>Notes</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {treatments.map((treatment) => (
                      <TableRow key={treatment.id || treatment.treatment_id}>
                        <TableCell>{treatment.treatment_date ? formatDate(treatment.treatment_date) : (treatment.start_date ? formatDate(treatment.start_date) : 'N/A')}</TableCell>
                        <TableCell>{treatment.diagnosis || 'N/A'}</TableCell>
                        <TableCell>{treatment.treatment_description || treatment.description}</TableCell>
                        <TableCell>{treatment.medication || 'N/A'}</TableCell>
                        <TableCell>{treatment.notes || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Tab>

            <Tab key="documents" title="Documents">
              <div className="mt-4 text-center py-8">
                <p className="text-gray-500">No documents uploaded yet</p>
                <Button color="primary" variant="flat" className="mt-4">
                  <span className="mr-2">📎</span>
                  Upload Document
                </Button>
              </div>
            </Tab>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}