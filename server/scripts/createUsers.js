require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../src/Modules/Database/db');
const { Staff } = require('../src/Modules/Database/models');

// Passwords come from env (SEED_ADMIN_PASSWORD, ...) or are generated randomly and printed once
const passwords = {
    admin: process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url'),
    doctor: process.env.SEED_DOCTOR_PASSWORD || crypto.randomBytes(9).toString('base64url'),
    nurse: process.env.SEED_NURSE_PASSWORD || crypto.randomBytes(9).toString('base64url'),
};

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
            const hashedPassword = await bcrypt.hash(passwords.admin, 10);
            
            const adminUser = new Staff({
                name: 'Admin User',
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
            const hashedPassword = await bcrypt.hash(passwords.doctor, 10);
            
            const doctorUser = new Staff({
                name: 'John Smith',
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
            const hashedPassword = await bcrypt.hash(passwords.nurse, 10);
            
            const nurseUser = new Staff({
                name: 'Sarah Johnson',
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
        console.log(`Admin: username=admin, password=${passwords.admin}, permLevel=3`);
        console.log(`Doctor: username=doctor, password=${passwords.doctor}, permLevel=2`);
        console.log(`Nurse: username=nurse, password=${passwords.nurse}, permLevel=1`);

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
