const mongoose = require('mongoose');
const { Staff, Department } = require('../src/Modules/Database/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management';

const checkData = async () => {
  try {
    console.log('🔌 MongoDB\'ye bağlanılıyor...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı!');

    // Departmanları kontrol et
    console.log('\n📋 DEPARTMAN VERİLERİ:');
    const departments = await Department.find({});
    console.log(`📊 Toplam departman sayısı: ${departments.length}`);
    
    if (departments.length > 0) {
      departments.forEach((dept, index) => {
        console.log(`${index + 1}. ${dept.name} (ID: ${dept._id})`);
      });
    } else {
      console.log('❌ Hiç departman bulunamadı!');
    }

    // Personeli kontrol et
    console.log('\n👨‍⚕️ PERSONEL VERİLERİ:');
    const staff = await Staff.find({});
    console.log(`📊 Toplam personel sayısı: ${staff.length}`);
    
    if (staff.length > 0) {
      // Role bazında grupla
      const staffByRole = staff.reduce((acc, person) => {
        acc[person.role] = (acc[person.role] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 Role bazında dağılım:');
      Object.entries(staffByRole).forEach(([role, count]) => {
        console.log(`   - ${role}: ${count} kişi`);
      });

      // Departman bazında grupla
      console.log('\n🏥 Departman bazında dağılım:');
      for (const dept of departments) {
        const deptStaff = staff.filter(person => 
          person.department_id && person.department_id.toString() === dept._id.toString()
        );
        console.log(`📂 ${dept.name}: ${deptStaff.length} personel`);
        deptStaff.forEach(person => {
          console.log(`   - ${person.name} (${person.role})`);
        });
      }

      // Departmanı olmayan personel
      const noDepStaff = staff.filter(person => !person.department_id);
      if (noDepStaff.length > 0) {
        console.log(`\n⚠️  Departmanı belirsiz personel: ${noDepStaff.length}`);
        noDepStaff.forEach(person => {
          console.log(`   - ${person.name} (${person.role})`);
        });
      }
    } else {
      console.log('❌ Hiç personel bulunamadı!');
    }

  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    console.log('\n🔌 MongoDB bağlantısı kapatılıyor...');
    await mongoose.connection.close();
    console.log('✅ Bağlantı kapatıldı!');
    process.exit(0);
  }
};

if (require.main === module) {
  checkData();
}

module.exports = { checkData };
