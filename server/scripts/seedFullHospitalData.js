const mongoose = require('mongoose');
const { Staff, Department } = require('../src/Modules/Database/models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management';

const seedFullHospitalData = async () => {
  try {
    console.log('🔌 MongoDB\'ye bağlanılıyor...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı!');

    // Önce mevcut verileri temizle
    console.log('🗑️ Mevcut departman ve personel verileri temizleniyor...');
    await Staff.deleteMany({});
    await Department.deleteMany({});
    console.log('✅ Mevcut veriler temizlendi!');

    // Departmanları oluştur
    console.log('🏥 Departmanlar oluşturuluyor...');
    const departments = await Department.insertMany([
      {
        name: 'Kardiyoloji',
        description: 'Kalp ve damar hastalıkları tanı ve tedavisi',
        status: 'active'
      },
      {
        name: 'Nöroloji', 
        description: 'Beyin ve sinir sistemi hastalıkları',
        status: 'active'
      },
      {
        name: 'Ortopedi',
        description: 'Kemik, eklem ve kas sistemi hastalıkları',
        status: 'active'
      },
      {
        name: 'Dahiliye',
        description: 'İç hastalıkları genel tanı ve tedavi',
        status: 'active'
      },
      {
        name: 'Acil Tıp',
        description: 'Acil müdahale ve kritik bakım hizmetleri',
        status: 'active'
      },
      {
        name: 'Genel Cerrahi',
        description: 'Genel cerrahi operasyonları ve müdahaleler',
        status: 'active'
      },
      {
        name: 'Kadın Doğum',
        description: 'Kadın hastalıkları ve doğum hizmetleri',
        status: 'active'
      },
      {
        name: 'Çocuk Hastalıkları',
        description: 'Pediatri ve çocuk sağlığı hizmetleri',
        status: 'active'
      },
      {
        name: 'Göz Hastalıkları',
        description: 'Oftalmoloji ve göz sağlığı',
        status: 'active'
      },
      {
        name: 'Kulak Burun Boğaz',
        description: 'KBB hastalıkları tanı ve tedavisi',
        status: 'active'
      },
      {
        name: 'Dermatoloji',
        description: 'Cilt hastalıkları ve estetik dermatologi',
        status: 'active'
      },
      {
        name: 'Psikiyatri',
        description: 'Ruh sağlığı ve psikiyatrik tedavi',
        status: 'active'
      }
    ]);

    console.log(`✅ ${departments.length} departman oluşturuldu!`);

    // Daha kapsamlı personel verileri
    console.log('👨‍⚕️ Personel verileri oluşturuluyor...');
    
    const staffData = [
      // Kardiyoloji - 6 personel
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
        name: 'Dr. Can Özdemir',
        role: 'Doktor',
        department_id: departments[0]._id,
        email: 'can.ozdemir@hastane.com',
        phone: '+90 534 345 6789',
        specialization: 'Kardiyoloji',
        hire_date: new Date('2021-08-20'),
        salary: 18000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Hemşire Fatma Demir',
        role: 'Hemşire',
        department_id: departments[0]._id,
        email: 'fatma.demir@hastane.com',
        phone: '+90 535 456 7890',
        specialization: 'Kardiyoloji Hemşireliği',
        hire_date: new Date('2021-06-15'),
        salary: 8000,
        status: 'active',
        permLevel: 1
      },
      {
        name: 'Hemşire Pınar Güneş',
        role: 'Hemşire',
        department_id: departments[0]._id,
        email: 'pinar.gunes@hastane.com',
        phone: '+90 536 567 8901',
        specialization: 'Kardiyoloji Hemşireliği',
        hire_date: new Date('2022-02-01'),
        salary: 7800,
        status: 'active',
        permLevel: 1
      },
      {
        name: 'Hemşire Sevgi Acar',
        role: 'Hemşire',
        department_id: departments[0]._id,
        email: 'sevgi.acar@hastane.com',
        phone: '+90 537 678 9012',
        specialization: 'Kardiyoloji Hemşireliği',
        hire_date: new Date('2022-05-10'),
        salary: 7800,
        status: 'active',
        permLevel: 1
      },

      // Nöroloji - 5 personel
      {
        name: 'Prof. Dr. Ali Şahin',
        role: 'Doktor',
        department_id: departments[1]._id,
        email: 'ali.sahin@hastane.com',
        phone: '+90 538 789 0123',
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
        phone: '+90 539 890 1234',
        specialization: 'Nöroloji',
        hire_date: new Date('2019-11-20'),
        salary: 22000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Murat Arslan',
        role: 'Doktor',
        department_id: departments[1]._id,
        email: 'murat.arslan@hastane.com',
        phone: '+90 541 901 2345',
        specialization: 'Nöroloji',
        hire_date: new Date('2020-06-15'),
        salary: 19000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Hemşire Derya Koç',
        role: 'Hemşire',
        department_id: departments[1]._id,
        email: 'derya.koc@hastane.com',
        phone: '+90 542 012 3456',
        specialization: 'Nöroloji Hemşireliği',
        hire_date: new Date('2021-03-20'),
        salary: 8200,
        status: 'active',
        permLevel: 1
      },
      {
        name: 'Teknisyen Kemal Akın',
        role: 'Teknisyen',
        department_id: departments[1]._id,
        email: 'kemal.akin@hastane.com',
        phone: '+90 543 123 4567',
        specialization: 'Nöroloji Teknisyeni',
        hire_date: new Date('2020-12-15'),
        salary: 6500,
        status: 'active',
        permLevel: 1
      },

      // Ortopedi - 4 personel
      {
        name: 'Prof. Dr. Mustafa Arslan',
        role: 'Doktor',
        department_id: departments[2]._id,
        email: 'mustafa.arslan@hastane.com',
        phone: '+90 544 234 5678',
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
        phone: '+90 545 345 6789',
        specialization: 'Ortopedi',
        hire_date: new Date('2021-02-28'),
        salary: 18000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Okan Yılmaz',
        role: 'Doktor',
        department_id: departments[2]._id,
        email: 'okan.yilmaz@hastane.com',
        phone: '+90 546 456 7890',
        specialization: 'Ortopedi',
        hire_date: new Date('2022-01-10'),
        salary: 17000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Hemşire Aysun Kara',
        role: 'Hemşire',
        department_id: departments[2]._id,
        email: 'aysun.kara@hastane.com',
        phone: '+90 547 567 8901',
        specialization: 'Ortopedi Hemşireliği',
        hire_date: new Date('2021-07-05'),
        salary: 8000,
        status: 'active',
        permLevel: 1
      },

      // Dahiliye - 5 personel
      {
        name: 'Prof. Dr. Hasan Özdemir',
        role: 'Doktor',
        department_id: departments[3]._id,
        email: 'hasan.ozdemir@hastane.com',
        phone: '+90 548 678 9012',
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
        phone: '+90 549 789 0123',
        specialization: 'Dahiliye',
        hire_date: new Date('2020-07-15'),
        salary: 19000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Turan Koç',
        role: 'Doktor',
        department_id: departments[3]._id,
        email: 'turan.koc@hastane.com',
        phone: '+90 531 890 1234',
        specialization: 'Dahiliye',
        hire_date: new Date('2021-09-20'),
        salary: 18000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Hemşire Şule Demir',
        role: 'Hemşire',
        department_id: departments[3]._id,
        email: 'sule.demir@hastane.com',
        phone: '+90 532 901 2345',
        specialization: 'Dahiliye Hemşireliği',
        hire_date: new Date('2021-11-08'),
        salary: 8100,
        status: 'active',
        permLevel: 1
      },
      {
        name: 'Hemşire Gönül Yıldırım',
        role: 'Hemşire',
        department_id: departments[3]._id,
        email: 'gonul.yildirim@hastane.com',
        phone: '+90 533 012 3456',
        specialization: 'Dahiliye Hemşireliği',
        hire_date: new Date('2022-03-15'),
        salary: 7900,
        status: 'active',
        permLevel: 1
      },

      // Acil Tıp - 6 personel
      {
        name: 'Dr. Emre Kılıç',
        role: 'Doktor',
        department_id: departments[4]._id,
        email: 'emre.kilic@hastane.com',
        phone: '+90 534 123 4567',
        specialization: 'Acil Tıp',
        hire_date: new Date('2019-01-20'),
        salary: 23000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Burcu Özkan',
        role: 'Doktor',
        department_id: departments[4]._id,
        email: 'burcu.ozkan@hastane.com',
        phone: '+90 535 234 5678',
        specialization: 'Acil Tıp',
        hire_date: new Date('2020-08-12'),
        salary: 21000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Tolga Aydın',
        role: 'Doktor',
        department_id: departments[4]._id,
        email: 'tolga.aydin@hastane.com',
        phone: '+90 536 345 6789',
        specialization: 'Acil Tıp',
        hire_date: new Date('2021-04-18'),
        salary: 20000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Hemşire Seda Aslan',
        role: 'Hemşire',
        department_id: departments[4]._id,
        email: 'seda.aslan@hastane.com',
        phone: '+90 537 456 7890',
        specialization: 'Acil Hemşireliği',
        hire_date: new Date('2020-04-10'),
        salary: 9000,
        status: 'active',
        permLevel: 1
      },
      {
        name: 'Hemşire Melih Çakır',
        role: 'Hemşire',
        department_id: departments[4]._id,
        email: 'melih.cakir@hastane.com',
        phone: '+90 538 567 8901',
        specialization: 'Acil Hemşireliği',
        hire_date: new Date('2021-01-25'),
        salary: 8800,
        status: 'active',
        permLevel: 1
      },
      {
        name: 'Hemşire Nazlı Türk',
        role: 'Hemşire',
        department_id: departments[4]._id,
        email: 'nazli.turk@hastane.com',
        phone: '+90 539 678 9012',
        specialization: 'Acil Hemşireliği',
        hire_date: new Date('2022-06-10'),
        salary: 8500,
        status: 'active',
        permLevel: 1
      },

      // Genel Cerrahi - 4 personel
      {
        name: 'Prof. Dr. Ahmet Çetin',
        role: 'Doktor',
        department_id: departments[5]._id,
        email: 'ahmet.cetin@hastane.com',
        phone: '+90 541 789 0123',
        specialization: 'Genel Cerrahi',
        hire_date: new Date('2014-12-01'),
        salary: 30000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. İbrahim Polat',
        role: 'Doktor',
        department_id: departments[5]._id,
        email: 'ibrahim.polat@hastane.com',
        phone: '+90 542 890 1234',
        specialization: 'Genel Cerrahi',
        hire_date: new Date('2019-05-15'),
        salary: 22000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Selma Acar',
        role: 'Doktor',
        department_id: departments[5]._id,
        email: 'selma.acar@hastane.com',
        phone: '+90 543 901 2345',
        specialization: 'Genel Cerrahi',
        hire_date: new Date('2021-03-08'),
        salary: 20000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Hemşire Murat Yıldız',
        role: 'Hemşire',
        department_id: departments[5]._id,
        email: 'murat.yildiz@hastane.com',
        phone: '+90 544 012 3456',
        specialization: 'Cerrahi Hemşireliği',
        hire_date: new Date('2020-10-20'),
        salary: 8500,
        status: 'active',
        permLevel: 1
      },

      // Kadın Doğum - 4 personel
      {
        name: 'Prof. Dr. Serpil Kara',
        role: 'Doktor',
        department_id: departments[6]._id,
        email: 'serpil.kara@hastane.com',
        phone: '+90 545 123 4567',
        specialization: 'Kadın Doğum',
        hire_date: new Date('2017-03-15'),
        salary: 24000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Nevin Özkan',
        role: 'Doktor',
        department_id: departments[6]._id,
        email: 'nevin.ozkan@hastane.com',
        phone: '+90 546 234 5678',
        specialization: 'Kadın Doğum',
        hire_date: new Date('2020-11-22'),
        salary: 21000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Ebe Gül Özkan',
        role: 'Ebe',
        department_id: departments[6]._id,
        email: 'gul.ozkan@hastane.com',
        phone: '+90 547 345 6789',
        specialization: 'Ebelik',
        hire_date: new Date('2021-01-10'),
        salary: 7500,
        status: 'active',
        permLevel: 1
      },
      {
        name: 'Hemşire Ayşen Bulut',
        role: 'Hemşire',
        department_id: departments[6]._id,
        email: 'aysen.bulut@hastane.com',
        phone: '+90 548 456 7890',
        specialization: 'Kadın Doğum Hemşireliği',
        hire_date: new Date('2021-08-30'),
        salary: 8000,
        status: 'active',
        permLevel: 1
      },

      // Çocuk Hastalıkları - 4 personel
      {
        name: 'Dr. Burak Şimşek',
        role: 'Doktor',
        department_id: departments[7]._id,
        email: 'burak.simsek@hastane.com',
        phone: '+90 549 567 8901',
        specialization: 'Çocuk Hastalıkları',
        hire_date: new Date('2020-09-01'),
        salary: 21000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Esra Korkmaz',
        role: 'Doktor',
        department_id: departments[7]._id,
        email: 'esra.korkmaz@hastane.com',
        phone: '+90 531 678 9012',
        specialization: 'Çocuk Hastalıkları',
        hire_date: new Date('2021-12-05'),
        salary: 19000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Hemşire Özlem Erdoğan',
        role: 'Hemşire',
        department_id: departments[7]._id,
        email: 'ozlem.erdogan@hastane.com',
        phone: '+90 532 789 0123',
        specialization: 'Çocuk Hemşireliği',
        hire_date: new Date('2021-11-15'),
        salary: 8500,
        status: 'active',
        permLevel: 1
      },
      {
        name: 'Hemşire Gamze Yıldırım',
        role: 'Hemşire',
        department_id: departments[7]._id,
        email: 'gamze.yildirim@hastane.com',
        phone: '+90 533 890 1234',
        specialization: 'Çocuk Hemşireliği',
        hire_date: new Date('2022-04-12'),
        salary: 8200,
        status: 'active',
        permLevel: 1
      },

      // Göz Hastalıkları - 3 personel
      {
        name: 'Prof. Dr. Kenan Bulut',
        role: 'Doktor',
        department_id: departments[8]._id,
        email: 'kenan.bulut@hastane.com',
        phone: '+90 534 901 2345',
        specialization: 'Göz Hastalıkları',
        hire_date: new Date('2018-07-20'),
        salary: 25000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Sinem Özdemir',
        role: 'Doktor',
        department_id: departments[8]._id,
        email: 'sinem.ozdemir@hastane.com',
        phone: '+90 535 012 3456',
        specialization: 'Göz Hastalıkları',
        hire_date: new Date('2021-06-18'),
        salary: 20000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Hemşire Fatih Güler',
        role: 'Hemşire',
        department_id: departments[8]._id,
        email: 'fatih.guler@hastane.com',
        phone: '+90 536 123 4567',
        specialization: 'Göz Hemşireliği',
        hire_date: new Date('2022-01-25'),
        salary: 7800,
        status: 'active',
        permLevel: 1
      },

      // Kulak Burun Boğaz - 3 personel
      {
        name: 'Dr. Cem Aydın',
        role: 'Doktor',
        department_id: departments[9]._id,
        email: 'cem.aydin@hastane.com',
        phone: '+90 537 234 5678',
        specialization: 'Kulak Burun Boğaz',
        hire_date: new Date('2019-10-12'),
        salary: 22000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Sevda Yılmaz',
        role: 'Doktor',
        department_id: departments[9]._id,
        email: 'sevda.yilmaz@hastane.com',
        phone: '+90 538 345 6789',
        specialization: 'Kulak Burun Boğaz',
        hire_date: new Date('2021-01-30'),
        salary: 19000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Hemşire Deniz Kara',
        role: 'Hemşire',
        department_id: departments[9]._id,
        email: 'deniz.kara@hastane.com',
        phone: '+90 539 456 7890',
        specialization: 'KBB Hemşireliği',
        hire_date: new Date('2021-09-15'),
        salary: 7900,
        status: 'active',
        permLevel: 1
      },

      // Dermatoloji - 3 personel
      {
        name: 'Dr. Hatice Demir',
        role: 'Doktor',
        department_id: departments[10]._id,
        email: 'hatice.demir@hastane.com',
        phone: '+90 541 567 8901',
        specialization: 'Dermatoloji',
        hire_date: new Date('2020-04-25'),
        salary: 23000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Levent Özkan',
        role: 'Doktor',
        department_id: departments[10]._id,
        email: 'levent.ozkan@hastane.com',
        phone: '+90 542 678 9012',
        specialization: 'Dermatoloji',
        hire_date: new Date('2021-11-08'),
        salary: 21000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Hemşire Canan Şahin',
        role: 'Hemşire',
        department_id: departments[10]._id,
        email: 'canan.sahin@hastane.com',
        phone: '+90 543 789 0123',
        specialization: 'Dermatoloji Hemşireliği',
        hire_date: new Date('2022-02-20'),
        salary: 8000,
        status: 'active',
        permLevel: 1
      },

      // Psikiyatri - 3 personel
      {
        name: 'Prof. Dr. Arda Yıldız',
        role: 'Doktor',
        department_id: departments[11]._id,
        email: 'arda.yildiz@hastane.com',
        phone: '+90 544 890 1234',
        specialization: 'Psikiyatri',
        hire_date: new Date('2017-12-10'),
        salary: 26000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Dr. Mine Polat',
        role: 'Doktor',
        department_id: departments[11]._id,
        email: 'mine.polat@hastane.com',
        phone: '+90 545 901 2345',
        specialization: 'Psikiyatri',
        hire_date: new Date('2020-08-22'),
        salary: 22000,
        status: 'active',
        permLevel: 2
      },
      {
        name: 'Hemşire Ercan Güneş',
        role: 'Hemşire',
        department_id: departments[11]._id,
        email: 'ercan.gunes@hastane.com',
        phone: '+90 546 012 3456',
        specialization: 'Psikiyatri Hemşireliği',
        hire_date: new Date('2021-05-18'),
        salary: 8300,
        status: 'active',
        permLevel: 1
      }
    ];

    await Staff.insertMany(staffData);

    console.log('🎉 Başarılı! Tam hastane verileri eklendi!');
    console.log('📊 Özet:');
    console.log(`   - Toplam departman: ${departments.length}`);
    console.log(`   - Toplam personel: ${staffData.length}`);
    
    // Role bazında özet
    const roleCount = staffData.reduce((acc, person) => {
      acc[person.role] = (acc[person.role] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Role bazında dağılım:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count} kişi`);
    });

    // Departman bazında özet
    console.log('\n🏥 Departman bazında personel sayıları:');
    departments.forEach((dept, index) => {
      const deptStaffCount = staffData.filter(person => 
        person.department_id.toString() === dept._id.toString()
      ).length;
      console.log(`   - ${dept.name}: ${deptStaffCount} personel`);
    });

  } catch (error) {
    console.error('❌ Hata oluştu:', error);
  } finally {
    console.log('\n🔌 MongoDB bağlantısı kapatılıyor...');
    await mongoose.connection.close();
    console.log('✅ Bağlantı kapatıldı. Script tamamlandı!');
    process.exit(0);
  }
};

if (require.main === module) {
  seedFullHospitalData();
}

module.exports = { seedFullHospitalData };
