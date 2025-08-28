const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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

// Create Admin User
const createAdmin = async () => {
    try {
        console.log('\n👑 Admin hesabı oluşturuluyor...');

        // Check if admin already exists
        const existingAdmin = await Staff.findOne({ role: 'Admin' });
        if (existingAdmin) {
            console.log('⚠️  Admin hesabı zaten mevcut:', existingAdmin.name);
            console.log('📧 Email:', existingAdmin.email);
            console.log('👤 Kullanıcı Adı:', existingAdmin.username);
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin user
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

        console.log('✅ Admin hesabı başarıyla oluşturuldu!');
        console.log('📋 Admin Bilgileri:');
        console.log('   👤 Ad: Sistem Yöneticisi');
        console.log('   📧 Email: admin@hospital.com');
        console.log('   👨‍💼 Kullanıcı Adı: admin');
        console.log('   🔑 Şifre: admin123');
        console.log('   🏆 Rol: Admin');
        console.log('   🔐 Yetki Seviyesi: 3 (En Yüksek)');
        console.log('   📱 Telefon: +905001234567');
        console.log('   💼 Uzmanlık: Sistem Yönetimi');
        console.log('   📅 İşe Başlama: ' + new Date().toLocaleDateString('tr-TR'));

        console.log('\n🎯 Giriş için kullanın:');
        console.log('   Kullanıcı Adı: admin');
        console.log('   Şifre: admin123');

    } catch (error) {
        console.error('❌ Admin oluşturma hatası:', error);
        throw error;
    }
};

// Verify admin creation
const verifyAdmin = async () => {
    try {
        console.log('\n🔍 Admin hesabı doğrulanıyor...');
        
        const admin = await Staff.findOne({ role: 'Admin' });
        if (admin) {
            console.log('✅ Admin hesabı doğrulandı!');
            console.log('   ID:', admin._id);
            console.log('   Ad:', admin.name);
            console.log('   Email:', admin.email);
            console.log('   Rol:', admin.role);
            console.log('   Yetki Seviyesi:', admin.permissionLevel);
            console.log('   Durum:', admin.status);
        } else {
            console.log('❌ Admin hesabı bulunamadı!');
        }
    } catch (error) {
        console.error('❌ Admin doğrulama hatası:', error);
    }
};

// Main execution
const main = async () => {
    try {
        await connectDB();
        await createAdmin();
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
