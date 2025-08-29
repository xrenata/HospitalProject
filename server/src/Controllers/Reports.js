const { 
    Patient, 
    Appointment, 
    Staff, 
    Department, 
    Treatment, 
    Surgery, 
    Visit,
    Room,
    Equipment,
    Medication,
    Prescription
} = require('../Modules/Database/models');

class ReportsController {
    // Get available report templates
    async getReportTemplates(req, res) {
        try {
            const templates = [
                {
                    id: 'patient-summary',
                    name: 'Hasta Özet Raporu',
                    description: 'Hasta demografik bilgileri ve genel istatistikler',
                    category: 'patients',
                    fields: ['demographics', 'admissions', 'treatments', 'billing'],
                    requiredPermission: 1
                },
                {
                    id: 'appointment-analytics',
                    name: 'Randevu Analiz Raporu',
                    description: 'Randevu trendleri ve performans metrikleri',
                    category: 'appointments',
                    fields: ['daily_counts', 'department_breakdown', 'completion_rates', 'no_shows'],
                    requiredPermission: 1
                },
                {
                    id: 'financial-summary',
                    name: 'Mali Özet Raporu',
                    description: 'Gelir, gider ve karlılık analizleri',
                    category: 'financial',
                    fields: ['revenue', 'expenses', 'profit_margins', 'payment_methods'],
                    requiredPermission: 2
                },
                {
                    id: 'staff-performance',
                    name: 'Personel Performans Raporu',
                    description: 'Personel iş yükü ve performans değerlendirmesi',
                    category: 'staff',
                    fields: ['workload', 'patient_satisfaction', 'overtime', 'efficiency'],
                    requiredPermission: 2
                },
                {
                    id: 'inventory-status',
                    name: 'Envanter Durum Raporu',
                    description: 'İlaç ve ekipman stok durumu',
                    category: 'inventory',
                    fields: ['stock_levels', 'expiry_dates', 'usage_rates', 'procurement_needs'],
                    requiredPermission: 2
                },
                {
                    id: 'department-efficiency',
                    name: 'Departman Verimlilik Raporu',
                    description: 'Departman bazlı performans ve kaynak kullanımı',
                    category: 'departments',
                    fields: ['patient_throughput', 'resource_utilization', 'wait_times', 'satisfaction_scores'],
                    requiredPermission: 2
                },
                {
                    id: 'quality-metrics',
                    name: 'Kalite Metrikleri Raporu',
                    description: 'Hasta güvenliği ve kalite göstergeleri',
                    category: 'quality',
                    fields: ['patient_safety', 'infection_rates', 'readmission_rates', 'mortality_rates'],
                    requiredPermission: 3
                },
                {
                    id: 'comprehensive-monthly',
                    name: 'Aylık Kapsamlı Rapor',
                    description: 'Tüm departmanları kapsayan aylık performans raporu',
                    category: 'comprehensive',
                    fields: ['all_metrics', 'trends', 'recommendations', 'action_items'],
                    requiredPermission: 3
                }
            ];

            // Filter templates based on user permission
            const userPermission = req.user?.permLevel || 0;
            const filteredTemplates = templates.filter(template => 
                userPermission >= template.requiredPermission
            );

            res.status(200).json({
                success: true,
                data: filteredTemplates
            });
        } catch (error) {
            console.error('Error getting report templates:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Generate patient summary report
    async generatePatientReport(req, res) {
        try {
            const { startDate, endDate, departments, ageGroups, includeFields } = req.body;
            
            const dateFilter = this.buildDateFilter(startDate, endDate, 'createdAt');
            let departmentFilter = {};
            
            if (departments && departments.length > 0) {
                departmentFilter = { departmentId: { $in: departments } };
            }

            // Patient demographics
            const totalPatients = await Patient.countDocuments(dateFilter);
            
            const genderDistribution = await Patient.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$gender', count: { $sum: 1 } } }
            ]);

            const ageDistribution = await Patient.aggregate([
                { $match: dateFilter },
                {
                    $addFields: {
                        ageGroup: {
                            $switch: {
                                branches: [
                                    { case: { $lt: ['$age', 18] }, then: '0-17' },
                                    { case: { $lt: ['$age', 30] }, then: '18-29' },
                                    { case: { $lt: ['$age', 50] }, then: '30-49' },
                                    { case: { $lt: ['$age', 65] }, then: '50-64' },
                                    { case: { $gte: ['$age', 65] }, then: '65+' }
                                ],
                                default: 'Unknown'
                            }
                        }
                    }
                },
                { $group: { _id: '$ageGroup', count: { $sum: 1 } } }
            ]);

            // Patient admissions
            const totalAdmissions = await Visit.countDocuments(dateFilter);
            const averageStayDuration = await Visit.aggregate([
                { $match: dateFilter },
                {
                    $addFields: {
                        stayDuration: {
                            $subtract: ['$dischargeDate', '$admissionDate']
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgStay: { $avg: '$stayDuration' }
                    }
                }
            ]);

            // Top conditions
            const topConditions = await Treatment.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$diagnosis', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);

            const reportData = {
                metadata: {
                    reportType: 'patient-summary',
                    generatedAt: new Date(),
                    period: { startDate, endDate },
                    totalRecords: totalPatients
                },
                demographics: {
                    totalPatients,
                    genderDistribution,
                    ageDistribution
                },
                admissions: {
                    totalAdmissions,
                    averageStayDays: averageStayDuration[0]?.avgStay ? 
                        Math.round(averageStayDuration[0].avgStay / (1000 * 60 * 60 * 24)) : 0
                },
                conditions: {
                    topConditions
                }
            };

            res.status(200).json({
                success: true,
                data: reportData
            });
        } catch (error) {
            console.error('Error generating patient report:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Generate appointment analytics report
    async generateAppointmentReport(req, res) {
        try {
            const { startDate, endDate, departments } = req.body;
            
            const dateFilter = this.buildDateFilter(startDate, endDate, 'appointmentDate');

            // Appointment counts
            const totalAppointments = await Appointment.countDocuments(dateFilter);
            const completedAppointments = await Appointment.countDocuments({
                ...dateFilter,
                status: 'completed'
            });
            const cancelledAppointments = await Appointment.countDocuments({
                ...dateFilter,
                status: 'cancelled'
            });
            const noShowAppointments = await Appointment.countDocuments({
                ...dateFilter,
                status: 'no-show'
            });

            // Daily trends
            const dailyTrends = await Appointment.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: {
                            year: { $year: '$appointmentDate' },
                            month: { $month: '$appointmentDate' },
                            day: { $dayOfMonth: '$appointmentDate' }
                        },
                        total: { $sum: 1 },
                        completed: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        },
                        cancelled: {
                            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                        }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ]);

            // Department breakdown
            const departmentBreakdown = await Appointment.aggregate([
                { $match: dateFilter },
                {
                    $lookup: {
                        from: 'staff',
                        localField: 'staffId',
                        foreignField: '_id',
                        as: 'staff'
                    }
                },
                {
                    $lookup: {
                        from: 'departments',
                        localField: 'staff.departmentId',
                        foreignField: '_id',
                        as: 'department'
                    }
                },
                {
                    $group: {
                        _id: { $arrayElemAt: ['$department.name', 0] },
                        total: { $sum: 1 },
                        completed: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        },
                        completionRate: {
                            $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        }
                    }
                }
            ]);

            const reportData = {
                metadata: {
                    reportType: 'appointment-analytics',
                    generatedAt: new Date(),
                    period: { startDate, endDate }
                },
                summary: {
                    totalAppointments,
                    completedAppointments,
                    cancelledAppointments,
                    noShowAppointments,
                    completionRate: totalAppointments > 0 ? 
                        ((completedAppointments / totalAppointments) * 100).toFixed(1) : 0
                },
                trends: {
                    dailyTrends
                },
                departments: {
                    departmentBreakdown
                }
            };

            res.status(200).json({
                success: true,
                data: reportData
            });
        } catch (error) {
            console.error('Error generating appointment report:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Generate financial summary report
    async generateFinancialReport(req, res) {
        try {
            const { startDate, endDate } = req.body;
            
            const dateFilter = this.buildDateFilter(startDate, endDate, 'startDate');

            // Treatment revenue
            const treatmentRevenue = await Treatment.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$cost' },
                        averageCost: { $avg: '$cost' },
                        totalTreatments: { $sum: 1 }
                    }
                }
            ]);

            // Revenue by treatment type
            const revenueByType = await Treatment.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: '$treatmentType',
                        revenue: { $sum: '$cost' },
                        count: { $sum: 1 },
                        averageCost: { $avg: '$cost' }
                    }
                },
                { $sort: { revenue: -1 } }
            ]);

            // Monthly revenue trend
            const monthlyRevenue = await Treatment.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: {
                            year: { $year: '$startDate' },
                            month: { $month: '$startDate' }
                        },
                        revenue: { $sum: '$cost' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            // Surgery revenue
            const surgeryRevenue = await Surgery.aggregate([
                { $match: this.buildDateFilter(startDate, endDate, 'surgeryDate') },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$cost' },
                        totalSurgeries: { $sum: 1 },
                        averageCost: { $avg: '$cost' }
                    }
                }
            ]);

            const reportData = {
                metadata: {
                    reportType: 'financial-summary',
                    generatedAt: new Date(),
                    period: { startDate, endDate }
                },
                revenue: {
                    treatments: treatmentRevenue[0] || { totalRevenue: 0, averageCost: 0, totalTreatments: 0 },
                    surgeries: surgeryRevenue[0] || { totalRevenue: 0, averageCost: 0, totalSurgeries: 0 },
                    total: (treatmentRevenue[0]?.totalRevenue || 0) + (surgeryRevenue[0]?.totalRevenue || 0)
                },
                breakdown: {
                    byType: revenueByType,
                    monthly: monthlyRevenue
                }
            };

            res.status(200).json({
                success: true,
                data: reportData
            });
        } catch (error) {
            console.error('Error generating financial report:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Generate staff performance report
    async generateStaffReport(req, res) {
        try {
            const { startDate, endDate, departments } = req.body;
            
            const dateFilter = this.buildDateFilter(startDate, endDate, 'appointmentDate');

            // Staff workload
            const staffWorkload = await Appointment.aggregate([
                { $match: dateFilter },
                {
                    $lookup: {
                        from: 'staff',
                        localField: 'staffId',
                        foreignField: '_id',
                        as: 'staff'
                    }
                },
                {
                    $group: {
                        _id: {
                            staffId: '$staffId',
                            name: { $arrayElemAt: ['$staff.name', 0] },
                            role: { $arrayElemAt: ['$staff.role', 0] }
                        },
                        totalAppointments: { $sum: 1 },
                        completedAppointments: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        },
                        completionRate: {
                            $avg: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        }
                    }
                },
                { $sort: { totalAppointments: -1 } }
            ]);

            // Department performance
            const departmentPerformance = await Staff.aggregate([
                {
                    $lookup: {
                        from: 'departments',
                        localField: 'departmentId',
                        foreignField: '_id',
                        as: 'department'
                    }
                },
                {
                    $group: {
                        _id: {
                            departmentId: '$departmentId',
                            departmentName: { $arrayElemAt: ['$department.name', 0] }
                        },
                        totalStaff: { $sum: 1 },
                        activeStaff: {
                            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                        }
                    }
                }
            ]);

            const reportData = {
                metadata: {
                    reportType: 'staff-performance',
                    generatedAt: new Date(),
                    period: { startDate, endDate }
                },
                workload: {
                    individual: staffWorkload,
                    departments: departmentPerformance
                }
            };

            res.status(200).json({
                success: true,
                data: reportData
            });
        } catch (error) {
            console.error('Error generating staff report:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Generate inventory status report
    async generateInventoryReport(req, res) {
        try {
            // Medication inventory
            const medicationInventory = await Medication.aggregate([
                {
                    $addFields: {
                        stockStatus: {
                            $switch: {
                                branches: [
                                    { case: { $lt: ['$stockQuantity', 50] }, then: 'Low' },
                                    { case: { $lt: ['$stockQuantity', 200] }, then: 'Medium' },
                                    { case: { $gte: ['$stockQuantity', 200] }, then: 'High' }
                                ],
                                default: 'Unknown'
                            }
                        },
                        expiryStatus: {
                            $switch: {
                                branches: [
                                    {
                                        case: { $lt: ['$expiryDate', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)] },
                                        then: 'Expiring Soon'
                                    },
                                    {
                                        case: { $lt: ['$expiryDate', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)] },
                                        then: 'Expiring in 3 Months'
                                    }
                                ],
                                default: 'Good'
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            category: '$category',
                            stockStatus: '$stockStatus',
                            expiryStatus: '$expiryStatus'
                        },
                        count: { $sum: 1 },
                        totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } }
                    }
                }
            ]);

            // Equipment status
            const equipmentStatus = await Equipment.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Low stock alerts
            const lowStockItems = await Medication.find({
                stockQuantity: { $lt: 50 }
            }).select('name stockQuantity category');

            const reportData = {
                metadata: {
                    reportType: 'inventory-status',
                    generatedAt: new Date()
                },
                medications: {
                    inventory: medicationInventory,
                    lowStock: lowStockItems
                },
                equipment: {
                    status: equipmentStatus
                }
            };

            res.status(200).json({
                success: true,
                data: reportData
            });
        } catch (error) {
            console.error('Error generating inventory report:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Generate comprehensive report
    async generateComprehensiveReport(req, res) {
        try {
            const { startDate, endDate } = req.body;

            // Get all report data
            const [
                patientData,
                appointmentData,
                financialData,
                staffData,
                inventoryData
            ] = await Promise.all([
                this.getPatientData(startDate, endDate),
                this.getAppointmentData(startDate, endDate),
                this.getFinancialData(startDate, endDate),
                this.getStaffData(startDate, endDate),
                this.getInventoryData()
            ]);

            const reportData = {
                metadata: {
                    reportType: 'comprehensive-monthly',
                    generatedAt: new Date(),
                    period: { startDate, endDate }
                },
                executive_summary: {
                    totalPatients: patientData.totalPatients,
                    totalAppointments: appointmentData.totalAppointments,
                    totalRevenue: financialData.totalRevenue,
                    activeStaff: staffData.activeStaff
                },
                patients: patientData,
                appointments: appointmentData,
                financial: financialData,
                staff: staffData,
                inventory: inventoryData
            };

            res.status(200).json({
                success: true,
                data: reportData
            });
        } catch (error) {
            console.error('Error generating comprehensive report:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Helper method to build date filter
    buildDateFilter(startDate, endDate, dateField = 'createdAt') {
        const filter = {};
        if (startDate || endDate) {
            filter[dateField] = {};
            if (startDate) filter[dateField].$gte = new Date(startDate);
            if (endDate) filter[dateField].$lte = new Date(endDate);
        }
        return filter;
    }

    // Helper methods for comprehensive report
    async getPatientData(startDate, endDate) {
        const dateFilter = this.buildDateFilter(startDate, endDate, 'createdAt');
        const totalPatients = await Patient.countDocuments(dateFilter);
        return { totalPatients };
    }

    async getAppointmentData(startDate, endDate) {
        const dateFilter = this.buildDateFilter(startDate, endDate, 'appointmentDate');
        const totalAppointments = await Appointment.countDocuments(dateFilter);
        return { totalAppointments };
    }

    async getFinancialData(startDate, endDate) {
        const dateFilter = this.buildDateFilter(startDate, endDate, 'startDate');
        const revenue = await Treatment.aggregate([
            { $match: dateFilter },
            { $group: { _id: null, totalRevenue: { $sum: '$cost' } } }
        ]);
        return { totalRevenue: revenue[0]?.totalRevenue || 0 };
    }

    async getStaffData(startDate, endDate) {
        const activeStaff = await Staff.countDocuments({ status: 'active' });
        return { activeStaff };
    }

    async getInventoryData() {
        const lowStockCount = await Medication.countDocuments({ stockQuantity: { $lt: 50 } });
        return { lowStockCount };
    }
}

module.exports = new ReportsController();
