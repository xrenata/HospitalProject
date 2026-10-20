const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || require('crypto').randomBytes(9).toString('base64url');
const { Staff } = require('../src/Modules/Database/models');

// MongoDB connection
const connectDB = async () => {
    try {
        console.log('🔌 MongoDB\'ye bağlanılıyor...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management');
        console.log('✅ MongoDB bağlantısı başarılı!');
    } catch (error) {
        console.error('❌ MongoDB bağlantı hatası:', error);
        process.exit(1);
    }
};

// Fix Admin User
const fixAdmin = async () => {
    try {
        console.log('\n🔧 Admin hesabı düzeltiliyor...');

        // Find existing admin
        const existingAdmin = await Staff.findOne({ 
            $or: [
                { username: 'admin' },
                { email: 'admin@hospital.com' },
                { role: 'Admin' }
            ]
        });

        if (!existingAdmin) {
            console.log('❌ Admin hesabı bulunamadı! Yeni oluşturuluyor...');
            
            // Hash password
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

            // Create new admin user
            const adminUser = new Staff({
                name: 'Emirhan',
                role: 'Admin',
                specialization: 'Sistem Yönetimi',
                email: 'admin@hospital.com',
                phone: '+905001234567',
                username: 'admin',
                password: hashedPassword,
                permissionLevel: 3, // Highest permission level
                departmentId: null, // Admin doesn't belong to a specific department
                status: 'active',
                hireDate: new Date(),
                // Additional admin-specific fields
                isSystemAdmin: true,
                canManageUsers: true,
                canAccessAllDepartments: true,
                lastLogin: null
            });

            await adminUser.save();
            console.log('✅ Yeni admin hesabı oluşturuldu!');
        } else {
            console.log('📝 Mevcut admin hesabı güncelleniyor...');
            console.log('   Eski bilgiler:');
            console.log('   👤 Ad:', existingAdmin.name);
            console.log('   🏆 Rol:', existingAdmin.role);
            console.log('   🔐 Yetki Seviyesi:', existingAdmin.permissionLevel);
            console.log('   📧 Email:', existingAdmin.email);
            console.log('   👤 Username:', existingAdmin.username);

            // Update admin user with correct data
            const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
            
            existingAdmin.name = 'Emirhan';
            existingAdmin.role = 'Admin';
            existingAdmin.specialization = 'Sistem Yönetimi';
            existingAdmin.email = 'admin@hospital.com';
            existingAdmin.phone = '+905001234567';
            existingAdmin.username = 'admin';
            existingAdmin.password = hashedPassword;
            existingAdmin.permLevel = 3; // Highest permission level (database field)
            existingAdmin.permissionLevel = 3; // Frontend compatibility
            existingAdmin.departmentId = null; // Admin doesn't belong to a specific department
            existingAdmin.department_id = null; // Alternative field name
            existingAdmin.status = 'active';
            existingAdmin.isSystemAdmin = true;
            existingAdmin.canManageUsers = true;
            existingAdmin.canAccessAllDepartments = true;

            await existingAdmin.save();
            console.log('✅ Admin hesabı başarıyla güncellendi!');
        }

        console.log('\n📋 Güncel Admin Bilgileri:');
        console.log('   👤 Ad: Emirhan');
        console.log('   📧 Email: admin@hospital.com');
        console.log('   👨‍💼 Kullanıcı Adı: admin');
        console.log(`   🔑 Şifre: ${ADMIN_PASSWORD}`);
        console.log('   🏆 Rol: Admin');
        console.log('   🔐 Yetki Seviyesi: 3 (En Yüksek)');
        console.log('   📱 Telefon: +905001234567');
        console.log('   💼 Uzmanlık: Sistem Yönetimi');

        console.log('\n🎯 Giriş için kullanın:');
        console.log('   Kullanıcı Adı: admin');
        console.log(`   Şifre: ${ADMIN_PASSWORD}`);

    } catch (error) {
        console.error('❌ Admin düzeltme hatası:', error);
        throw error;
    }
};

// Verify admin fix
const verifyAdmin = async () => {
    try {
        console.log('\n🔍 Admin hesabı doğrulanıyor...');
        
        const admin = await Staff.findOne({ username: 'admin' });
        if (admin) {
            console.log('✅ Admin hesabı doğrulandı!');
            console.log('   ID:', admin._id);
            console.log('   Ad:', admin.name);
            console.log('   Email:', admin.email);
            console.log('   Username:', admin.username);
            console.log('   Rol:', admin.role);
            console.log('   Yetki Seviyesi:', admin.permissionLevel);
            console.log('   Durum:', admin.status);
            console.log('   Sistem Admin:', admin.isSystemAdmin);
            console.log('   Kullanıcı Yönetimi:', admin.canManageUsers);
            console.log('   Tüm Departmanlar:', admin.canAccessAllDepartments);
        } else {
            console.log('❌ Admin hesabı bulunamadı!');
        }

        // Also check if there are any duplicate admin accounts
        const allAdmins = await Staff.find({ role: 'Admin' });
        console.log(`\n📊 Toplam Admin hesap sayısı: ${allAdmins.length}`);
        allAdmins.forEach((admin, index) => {
            console.log(`   ${index + 1}. ${admin.name} (${admin.username}) - ${admin.email}`);
        });

    } catch (error) {
        console.error('❌ Admin doğrulama hatası:', error);
    }
};

// Main execution
const main = async () => {
    try {
        await connectDB();
        await fixAdmin();
        await verifyAdmin();
    } catch (error) {
        console.error('❌ Script çalıştırma hatası:', error);
    } finally {
        console.log('\n🔌 MongoDB bağlantısı kapatılıyor...');
        await mongoose.connection.close();
        console.log('✅ Bağlantı kapatıldı!');
        process.exit(0);
    }
};

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n⏹️  Script durduruldu...');
    await mongoose.connection.close();
    process.exit(0);
});

// Run script
main().catch(error => {
    console.error('❌ Genel hata:', error);
    process.exit(1);
});
