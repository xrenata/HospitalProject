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
    Medication
} = require('../Modules/Database/models');

class AnalyticsController {
    // Get dashboard overview statistics
    async getOverviewStats(req, res) {
        try {
            const { period = '30d', startDate, endDate } = req.query;
            
            // Calculate date range
            let dateRange = {};
            if (startDate && endDate) {
                dateRange = {
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                };
            } else {
                const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
                const pastDate = new Date();
                pastDate.setDate(pastDate.getDate() - days);
                dateRange = {
                    createdAt: { $gte: pastDate }
                };
            }

            // Get basic counts
            const totalPatients = await Patient.countDocuments();
            const totalStaff = await Staff.countDocuments({ status: 'active' });
            const totalDepartments = await Department.countDocuments({ status: 'active' });
            const totalRooms = await Room.countDocuments();

            // Get period-specific stats
            const newPatients = await Patient.countDocuments(dateRange);
            const totalAppointments = await Appointment.countDocuments(dateRange);
            const completedAppointments = await Appointment.countDocuments({
                ...dateRange,
                status: 'completed'
            });
            const cancelledAppointments = await Appointment.countDocuments({
                ...dateRange,
                status: 'cancelled'
            });

            // Calculate appointment completion rate
            const appointmentCompletionRate = totalAppointments > 0 
                ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
                : 0;

            res.status(200).json({
                success: true,
                data: {
                    overview: {
                        totalPatients,
                        totalStaff,
                        totalDepartments,
                        totalRooms,
                        newPatients,
                        totalAppointments,
                        completedAppointments,
                        cancelledAppointments,
                        appointmentCompletionRate: parseFloat(appointmentCompletionRate)
                    },
                    period
                }
            });
        } catch (error) {
            console.error('Error getting overview stats:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get patient analytics
    async getPatientAnalytics(req, res) {
        try {
            const { period = '30d' } = req.query;
            
            // Patient registration trends
            const patientTrends = await Patient.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            day: { $dayOfMonth: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
                { $limit: 30 }
            ]);

            // Age distribution
            const ageDistribution = await Patient.aggregate([
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
                {
                    $group: {
                        _id: '$ageGroup',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Gender distribution
            const genderDistribution = await Patient.aggregate([
                {
                    $group: {
                        _id: '$gender',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Blood type distribution
            const bloodTypeDistribution = await Patient.aggregate([
                {
                    $group: {
                        _id: '$bloodType',
                        count: { $sum: 1 }
                    }
                }
            ]);

            res.status(200).json({
                success: true,
                data: {
                    patientTrends,
                    ageDistribution,
                    genderDistribution,
                    bloodTypeDistribution
                }
            });
        } catch (error) {
            console.error('Error getting patient analytics:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get appointment analytics
    async getAppointmentAnalytics(req, res) {
        try {
            const { period = '30d' } = req.query;
            
            // Appointment trends by day
            const appointmentTrends = await Appointment.aggregate([
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
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
                { $limit: 30 }
            ]);

            // Status distribution
            const statusDistribution = await Appointment.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Appointments by department
            const departmentStats = await Appointment.aggregate([
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
                        count: { $sum: 1 },
                        completed: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        }
                    }
                }
            ]);

            // Peak hours analysis
            const hourlyDistribution = await Appointment.aggregate([
                {
                    $addFields: {
                        hour: { $hour: '$appointmentDate' }
                    }
                },
                {
                    $group: {
                        _id: '$hour',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id': 1 } }
            ]);

            res.status(200).json({
                success: true,
                data: {
                    appointmentTrends,
                    statusDistribution,
                    departmentStats,
                    hourlyDistribution
                }
            });
        } catch (error) {
            console.error('Error getting appointment analytics:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get staff analytics
    async getStaffAnalytics(req, res) {
        try {
            // Staff by department
            const staffByDepartment = await Staff.aggregate([
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
                        _id: { $arrayElemAt: ['$department.name', 0] },
                        count: { $sum: 1 },
                        doctors: {
                            $sum: { $cond: [{ $eq: ['$role', 'Doctor'] }, 1, 0] }
                        },
                        nurses: {
                            $sum: { $cond: [{ $eq: ['$role', 'Nurse'] }, 1, 0] }
                        }
                    }
                }
            ]);

            // Staff by role
            const staffByRole = await Staff.aggregate([
                {
                    $group: {
                        _id: '$role',
                        count: { $sum: 1 }
                    }
                }
            ]);

            // Staff workload (appointments handled)
            const staffWorkload = await Appointment.aggregate([
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
                            name: { $arrayElemAt: ['$staff.name', 0] }
                        },
                        totalAppointments: { $sum: 1 },
                        completedAppointments: {
                            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                        }
                    }
                },
                { $sort: { totalAppointments: -1 } },
                { $limit: 10 }
            ]);

            res.status(200).json({
                success: true,
                data: {
                    staffByDepartment,
                    staffByRole,
                    staffWorkload
                }
            });
        } catch (error) {
            console.error('Error getting staff analytics:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get financial analytics
    async getFinancialAnalytics(req, res) {
        try {
            // Revenue from treatments
            const treatmentRevenue = await Treatment.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$startDate' },
                            month: { $month: '$startDate' }
                        },
                        totalRevenue: { $sum: '$cost' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            // Revenue by treatment type
            const revenueByType = await Treatment.aggregate([
                {
                    $group: {
                        _id: '$treatmentType',
                        totalRevenue: { $sum: '$cost' },
                        count: { $sum: 1 },
                        averageCost: { $avg: '$cost' }
                    }
                },
                { $sort: { totalRevenue: -1 } }
            ]);

            // Surgery costs
            const surgeryRevenue = await Surgery.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$surgeryDate' },
                            month: { $month: '$surgeryDate' }
                        },
                        totalRevenue: { $sum: '$cost' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]);

            res.status(200).json({
                success: true,
                data: {
                    treatmentRevenue,
                    revenueByType,
                    surgeryRevenue
                }
            });
        } catch (error) {
            console.error('Error getting financial analytics:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get resource utilization analytics
    async getResourceAnalytics(req, res) {
        try {
            // Room utilization
            const roomUtilization = await Room.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
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

            // Medication inventory levels
            const medicationLevels = await Medication.aggregate([
                {
                    $addFields: {
                        stockLevel: {
                            $switch: {
                                branches: [
                                    { case: { $lt: ['$stockQuantity', 50] }, then: 'Low' },
                                    { case: { $lt: ['$stockQuantity', 200] }, then: 'Medium' },
                                    { case: { $gte: ['$stockQuantity', 200] }, then: 'High' }
                                ],
                                default: 'Unknown'
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: '$stockLevel',
                        count: { $sum: 1 }
                    }
                }
            ]);

            res.status(200).json({
                success: true,
                data: {
                    roomUtilization,
                    equipmentStatus,
                    medicationLevels
                }
            });
        } catch (error) {
            console.error('Error getting resource analytics:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Generate custom report
    async generateReport(req, res) {
        try {
            const { 
                reportType, 
                startDate, 
                endDate, 
                departments, 
                metrics 
            } = req.body;

            const dateRange = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };

            let reportData = {};

            if (reportType === 'comprehensive') {
                // Get all metrics for comprehensive report
                const [
                    overviewStats,
                    patientStats,
                    appointmentStats,
                    staffStats,
                    financialStats
                ] = await Promise.all([
                    this.getOverviewStatsData(dateRange),
                    this.getPatientStatsData(dateRange),
                    this.getAppointmentStatsData(dateRange),
                    this.getStaffStatsData(dateRange),
                    this.getFinancialStatsData(dateRange)
                ]);

                reportData = {
                    overview: overviewStats,
                    patients: patientStats,
                    appointments: appointmentStats,
                    staff: staffStats,
                    financial: financialStats
                };
            }

            res.status(200).json({
                success: true,
                data: {
                    reportType,
                    period: { startDate, endDate },
                    generatedAt: new Date(),
                    data: reportData
                }
            });
        } catch (error) {
            console.error('Error generating report:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Helper methods for report generation
    async getOverviewStatsData(dateRange) {
        const totalPatients = await Patient.countDocuments(dateRange);
        const totalAppointments = await Appointment.countDocuments(dateRange);
        const totalTreatments = await Treatment.countDocuments(dateRange);
        
        return {
            totalPatients,
            totalAppointments,
            totalTreatments
        };
    }

    async getPatientStatsData(dateRange) {
        return await Patient.aggregate([
            { $match: dateRange },
            {
                $group: {
                    _id: '$gender',
                    count: { $sum: 1 }
                }
            }
        ]);
    }

    async getAppointmentStatsData(dateRange) {
        return await Appointment.aggregate([
            { $match: dateRange },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
    }

    async getStaffStatsData(dateRange) {
        return await Staff.aggregate([
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);
    }

    async getFinancialStatsData(dateRange) {
        const treatmentRevenue = await Treatment.aggregate([
            { $match: dateRange },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$cost' }
                }
            }
        ]);

        return {
            treatmentRevenue: treatmentRevenue[0]?.totalRevenue || 0
        };
    }
}

module.exports = new AnalyticsController();
