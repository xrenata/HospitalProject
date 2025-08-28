const mongoose = require('mongoose');
const { Staff, Department } = require('../src/Modules/Database/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management';

const seedStaff = async () => {
  try {
    console.log('🔌 MongoDB\'ye bağlanılıyor...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı!');

    // Önce departmanları oluştur
    console.log('🏥 Departmanlar oluşturuluyor...');
    await Department.deleteMany({});
    
    const departments = await Department.insertMany([
      {
        name: 'Kardiyoloji',
        description: 'Kalp ve damar hastalıkları',
        status: 'active'
      },
      {
        name: 'Nöroloji', 
        description: 'Beyin ve sinir sistemi hastalıkları',
        status: 'active'
      },
      {
        name: 'Ortopedi',
        description: 'Kemik ve eklem hastalıkları',
        status: 'active'
      },
      {
        name: 'Dahiliye',
        description: 'İç hastalıkları',
        status: 'active'
      },
      {
        name: 'Acil Tıp',
        description: 'Acil müdahale ve kritik bakım',
        status: 'active'
      },
      {
        name: 'Genel Cerrahi',
        description: 'Genel cerrahi operasyonları',
        status: 'active'
      },
      {
        name: 'Kadın Doğum',
        description: 'Kadın hastalıkları ve doğum',
        status: 'active'
      },
      {
        name: 'Çocuk Hastalıkları',
        description: 'Pediatri ve çocuk sağlığı',
        status: 'active'
      }
    ]);

    console.log(`✅ ${departments.length} departman oluşturuldu!`);

    // Staff verilerini temizle
    console.log('🗑️ Mevcut personel verileri temizleniyor...');
    await Staff.deleteMany({});
    console.log('✅ Mevcut veriler temizlendi!');

    // Personel verilerini oluştur
    console.log('👨‍⚕️ Personel verileri oluşturuluyor...');
    
    const staffData = [
      // Kardiyoloji
      {
        name: 'Prof. Dr. Mehmet Yılmaz',
        role: 'Doktor',
        department_id: departments[0]._id,
        email: 'mehmet.yilmaz@hastane.com',
        phone: '+90 532 123 4567',
        specialization: 'Kardiyoloji',
        hire_date: new Date('2018-01-15'),
        salary: 25000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Ayşe Kaya',
        role: 'Doktor',
        department_id: departments[0]._id,
        email: 'ayse.kaya@hastane.com',
        phone: '+90 533 234 5678',
        specialization: 'Kardiyoloji',
        hire_date: new Date('2020-03-10'),
        salary: 20000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Hemşire Fatma Demir',
        role: 'Hemşire',
        department_id: departments[0]._id,
        email: 'fatma.demir@hastane.com',
        phone: '+90 534 345 6789',
        specialization: 'Kardiyoloji Hemşireliği',
        hire_date: new Date('2021-06-15'),
        salary: 8000,
        status: 'active',
        permLevel: 1
      },

      // Nöroloji
      {
        name: 'Prof. Dr. Ali Şahin',
        role: 'Doktor',
        department_id: departments[1]._id,
        email: 'ali.sahin@hastane.com',
        phone: '+90 535 456 7890',
        specialization: 'Nöroloji',
        hire_date: new Date('2017-09-01'),
        salary: 27000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Zeynep Çelik',
        role: 'Doktor',
        department_id: departments[1]._id,
        email: 'zeynep.celik@hastane.com',
        phone: '+90 536 567 8901',
        specialization: 'Nöroloji',
        hire_date: new Date('2019-11-20'),
        salary: 22000,
        status: 'active',
        permLevel: 2
      },

      // Ortopedi
      {
        name: 'Prof. Dr. Mustafa Arslan',
        role: 'Doktor',
        department_id: departments[2]._id,
        email: 'mustafa.arslan@hastane.com',
        phone: '+90 537 678 9012',
        specialization: 'Ortopedi',
        hire_date: new Date('2016-05-12'),
        salary: 28000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Elif Yıldız',
        role: 'Doktor',
        department_id: departments[2]._id,
        email: 'elif.yildiz@hastane.com',
        phone: '+90 538 789 0123',
        specialization: 'Ortopedi',
        hire_date: new Date('2021-02-28'),
        salary: 18000,
        status: 'active',
        permLevel: 2
      },

      // Dahiliye
      {
        name: 'Prof. Dr. Hasan Özdemir',
        role: 'Doktor',
        department_id: departments[3]._id,
        email: 'hasan.ozdemir@hastane.com',
        phone: '+90 539 890 1234',
        specialization: 'Dahiliye',
        hire_date: new Date('2015-08-10'),
        salary: 26000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Merve Doğan',
        role: 'Doktor',
        department_id: departments[3]._id,
        email: 'merve.dogan@hastane.com',
        phone: '+90 541 901 2345',
        specialization: 'Dahiliye',
        hire_date: new Date('2020-07-15'),
        salary: 19000,
        status: 'active',
        permLevel: 2
      },

      // Acil Tıp
      {
        name: 'Dr. Emre Kılıç',
        role: 'Doktor',
        department_id: departments[4]._id,
        email: 'emre.kilic@hastane.com',
        phone: '+90 542 012 3456',
        specialization: 'Acil Tıp',
        hire_date: new Date('2019-01-20'),
        salary: 23000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Hemşire Seda Aslan',
        role: 'Hemşire',
        department_id: departments[4]._id,
        email: 'seda.aslan@hastane.com',
        phone: '+90 543 123 4567',
        specialization: 'Acil Hemşireliği',
        hire_date: new Date('2020-04-10'),
        salary: 9000,
        status: 'active',
        permLevel: 1
      },

      // Genel Cerrahi
      {
        name: 'Prof. Dr. Ahmet Çetin',
        role: 'Doktor',
        department_id: departments[5]._id,
        email: 'ahmet.cetin@hastane.com',
        phone: '+90 544 234 5678',
        specialization: 'Genel Cerrahi',
        hire_date: new Date('2014-12-01'),
        salary: 30000,
        status: 'active',
        permLevel: 2
      },

      // Kadın Doğum
      {
        name: 'Prof. Dr. Serpil Kara',
        role: 'Doktor',
        department_id: departments[6]._id,
        email: 'serpil.kara@hastane.com',
        phone: '+90 545 345 6789',
        specialization: 'Kadın Doğum',
        hire_date: new Date('2017-03-15'),
        salary: 24000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Ebe Gül Özkan',
        role: 'Ebe',
        department_id: departments[6]._id,
        email: 'gul.ozkan@hastane.com',
        phone: '+90 546 456 7890',
        specialization: 'Ebelik',
        hire_date: new Date('2021-01-10'),
        salary: 7500,
        status: 'active',
        permLevel: 1
      },

      // Çocuk Hastalıkları
      {
        name: 'Dr. Burak Şimşek',
        role: 'Doktor',
        department_id: departments[7]._id,
        email: 'burak.simsek@hastane.com',
        phone: '+90 547 567 8901',
        specialization: 'Çocuk Hastalıkları',
        hire_date: new Date('2020-09-01'),
        salary: 21000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Hemşire Özlem Erdoğan',
        role: 'Hemşire',
        department_id: departments[7]._id,
        email: 'ozlem.erdogan@hastane.com',
        phone: '+90 548 678 9012',
        specialization: 'Çocuk Hemşireliği',
        hire_date: new Date('2021-11-15'),
        salary: 8500,
        status: 'active',
        permLevel: 1
      },

      // Ek personel
      {
        name: 'Hemşire Pınar Güneş',
        role: 'Hemşire',
        department_id: departments[0]._id,
        email: 'pinar.gunes@hastane.com',
        phone: '+90 549 789 0123',
        specialization: 'Genel Hemşirelik',
        hire_date: new Date('2022-02-01'),
        salary: 7800,
        status: 'active',
        permLevel: 1
      },
      {
        name: 'Teknisyen Kemal Akın',
        role: 'Teknisyen',
        department_id: departments[1]._id,
        email: 'kemal.akin@hastane.com',
        phone: '+90 531 890 1234',
        specialization: 'Tıbbi Teknoloji',
        hire_date: new Date('2020-12-15'),
        salary: 6500,
        status: 'active',
        permLevel: 1
      }
    ];

    await Staff.insertMany(staffData);

    console.log('🎉 Başarılı! Personel verileri eklendi!');
    console.log('📊 Özet:');
    console.log(`   - Toplam personel: ${staffData.length}`);
    console.log(`   - Doktor: ${staffData.filter(s => s.role === 'Doktor').length}`);
    console.log(`   - Hemşire: ${staffData.filter(s => s.role === 'Hemşire').length}`);
    console.log(`   - Ebe: ${staffData.filter(s => s.role === 'Ebe').length}`);
    console.log(`   - Teknisyen: ${staffData.filter(s => s.role === 'Teknisyen').length}`);

  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    console.log('🔌 MongoDB bağlantısı kapatılıyor...');
    await mongoose.connection.close();
    console.log('✅ Bağlantı kapatıldı. Script tamamlandı!');
    process.exit(0);
  }
};

if (require.main === module) {
  seedStaff();
}

module.exports = { seedStaff };
