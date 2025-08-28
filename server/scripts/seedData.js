const mongoose = require('mongoose');
const { Staff, Department } = require('../src/Modules/Database/models');

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await Staff.deleteMany({});
        await Department.deleteMany({});

        // Create departments
        const departments = await Department.insertMany([
            {
                name: 'Cardiology',
                description: 'Heart and cardiovascular care',
                status: 'active'
            },
            {
                name: 'Neurology',
                description: 'Brain and nervous system care',
                status: 'active'
            },
            {
                name: 'Orthopedics',
                description: 'Bone and joint care',
                status: 'active'
            },
            {
                name: 'Administration',
                description: 'Hospital administration and management',
                status: 'active'
            },
            {
                name: 'Emergency',
                description: 'Emergency medical care',
                status: 'active'
            }
        ]);

        console.log('Departments created:', departments.length);

        // Create staff members
        const staff = await Staff.insertMany([
            {
                name: 'Dr. Sarah Wilson',
                role: 'Doctor',
                department_id: departments[0]._id,
                email: 'dr.sarah.wilson@hospital.com',
                phone: '+1-555-0100',
                specialization: 'Cardiology',
                hire_date: new Date('2020-01-15'),
                salary: 150000,
                status: 'active',
                permLevel: 2
            },
            {
                name: 'Dr. Michael Johnson',
                role: 'Doctor',
                department_id: departments[1]._id,
                email: 'dr.michael.johnson@hospital.com',
                phone: '+1-555-0101',
                specialization: 'Neurology',
                hire_date: new Date('2019-03-20'),
                salary: 160000,
                status: 'active',
                permLevel: 2
            },
            {
                name: 'Nurse Emily Davis',
                role: 'Nurse',
                department_id: departments[0]._id,
                email: 'nurse.emily.davis@hospital.com',
                phone: '+1-555-0102',
                specialization: 'Emergency Care',
                hire_date: new Date('2021-06-10'),
                salary: 75000,
                status: 'active',
                permLevel: 1
            },
            {
                name: 'Dr. Robert Brown',
                role: 'Doctor',
                department_id: departments[2]._id,
                email: 'dr.robert.brown@hospital.com',
                phone: '+1-555-0103',
                specialization: 'Orthopedics',
                hire_date: new Date('2018-09-15'),
                salary: 145000,
                status: 'active',
                permLevel: 2
            },
            {
                name: 'Admin Lisa Thompson',
                role: 'Administrator',
                department_id: departments[3]._id,
                email: 'admin.lisa.thompson@hospital.com',
                phone: '+1-555-0104',
                specialization: 'Hospital Administration',
                hire_date: new Date('2017-02-01'),
                salary: 85000,
                status: 'active',
                permLevel: 3
            },
            {
                name: 'Nurse John Smith',
                role: 'Nurse',
                department_id: departments[4]._id,
                email: 'nurse.john.smith@hospital.com',
                phone: '+1-555-0105',
                specialization: 'Emergency Medicine',
                hire_date: new Date('2022-01-15'),
                salary: 70000,
                status: 'active',
                permLevel: 1
            },
            {
                name: 'Dr. Maria Garcia',
                role: 'Doctor',
                department_id: departments[4]._id,
                email: 'dr.maria.garcia@hospital.com',
                phone: '+1-555-0106',
                specialization: 'Emergency Medicine',
                hire_date: new Date('2020-08-10'),
                salary: 155000,
                status: 'active',
                permLevel: 2
            },
            {
                name: 'Nurse David Wilson',
                role: 'Nurse',
                department_id: departments[1]._id,
                email: 'nurse.david.wilson@hospital.com',
                phone: '+1-555-0107',
                specialization: 'Neurology Care',
                hire_date: new Date('2021-11-20'),
                salary: 72000,
                status: 'active',
                permLevel: 1
            }
        ]);

        console.log('Staff members created:', staff.length);
        console.log('Seed data created successfully!');
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();