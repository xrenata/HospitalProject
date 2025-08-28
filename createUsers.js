require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./src/Modules/Database/db');
const { Staff } = require('./src/Modules/Database/models');

async function createDefaultUser() {
    try {
        // Connect to the database
        await connectDB();
        console.log('Connected to MongoDB');

        // Check if admin user already exists
        const existingAdmin = await Staff.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log({
                username: existingAdmin.username,
                permLevel: existingAdmin.permLevel,
                _id: existingAdmin._id
            });
        } else {
            // Create default admin user
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            const adminUser = new Staff({
                firstName: 'Admin',
                lastName: 'User',
                role: 'Admin',
                email: 'admin@hospital.com',
                username: 'admin',
                password: hashedPassword,
                permLevel: 3, // Admin level permission
                phone: '555-123-4567',
                specialization: 'System Administration',
                status: 'active'
            });
            
            await adminUser.save();
            console.log('Admin user created successfully!');
            console.log({
                username: adminUser.username,
                permLevel: adminUser.permLevel,
                _id: adminUser._id
            });
        }
        
        // Create a doctor user
        const existingDoctor = await Staff.findOne({ username: 'doctor' });
        
        if (existingDoctor) {
            console.log('Doctor user already exists!');
            console.log({
                username: existingDoctor.username,
                permLevel: existingDoctor.permLevel,
                _id: existingDoctor._id
            });
        } else {
            const hashedPassword = await bcrypt.hash('doctor123', 10);
            
            const doctorUser = new Staff({
                firstName: 'John',
                lastName: 'Smith',
                role: 'Doctor',
                email: 'doctor@hospital.com',
                username: 'doctor',
                password: hashedPassword,
                permLevel: 2, // Doctor level permission
                phone: '555-987-6543',
                specialization: 'General Medicine',
                status: 'active'
            });
            
            await doctorUser.save();
            console.log('Doctor user created successfully!');
            console.log({
                username: doctorUser.username,
                permLevel: doctorUser.permLevel,
                _id: doctorUser._id
            });
        }
        
        // Create a nurse user
        const existingNurse = await Staff.findOne({ username: 'nurse' });
        
        if (existingNurse) {
            console.log('Nurse user already exists!');
            console.log({
                username: existingNurse.username,
                permLevel: existingNurse.permLevel,
                _id: existingNurse._id
            });
        } else {
            const hashedPassword = await bcrypt.hash('nurse123', 10);
            
            const nurseUser = new Staff({
                firstName: 'Sarah',
                lastName: 'Johnson',
                role: 'Nurse',
                email: 'nurse@hospital.com',
                username: 'nurse',
                password: hashedPassword,
                permLevel: 1, // Nurse level permission
                phone: '555-456-7890',
                specialization: 'General Care',
                status: 'active'
            });
            
            await nurseUser.save();
            console.log('Nurse user created successfully!');
            console.log({
                username: nurseUser.username,
                permLevel: nurseUser.permLevel,
                _id: nurseUser._id
            });
        }

        console.log('\nUser credentials:');
        console.log('Admin: username=admin, password=admin123, permLevel=3');
        console.log('Doctor: username=doctor, password=doctor123, permLevel=2');
        console.log('Nurse: username=nurse, password=nurse123, permLevel=1');

    } catch (error) {
        console.error('Error creating users:', error);
    } finally {
        // Close the connection after operation
        mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

// Run the script
createDefaultUser();
