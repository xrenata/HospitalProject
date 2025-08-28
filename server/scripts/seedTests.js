const mongoose = require('mongoose');
const { Test, Patient, Staff, Department } = require('../src/Modules/Database/models');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hospital_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testTypes = [
  { type: 'Kan Tahlili', name: 'Tam Kan Sayımı', sampleType: 'Kan' },
  { type: 'Kan Tahlili', name: 'Biyokimya Paneli', sampleType: 'Kan' },
  { type: 'Kan Tahlili', name: 'Lipid Profili', sampleType: 'Kan' },
  { type: 'Kan Tahlili', name: 'Karaciğer Fonksiyonları', sampleType: 'Kan' },
  { type: 'Kan Tahlili', name: 'Böbrek Fonksiyonları', sampleType: 'Kan' },
  { type: 'Kan Tahlili', name: 'Tiroid Fonksiyonları', sampleType: 'Kan' },
  { type: 'Kan Tahlili', name: 'HbA1c', sampleType: 'Kan' },
  { type: 'İdrar Tahlili', name: 'Tam İdrar Tahlili', sampleType: 'İdrar' },
  { type: 'İdrar Tahlili', name: 'İdrar Kültürü', sampleType: 'İdrar' },
  { type: 'Röntgen', name: 'Akciğer Röntgeni', sampleType: 'Yok' },
  { type: 'Röntgen', name: 'Kalp Röntgeni', sampleType: 'Yok' },
  { type: 'Röntgen', name: 'Kemik Röntgeni', sampleType: 'Yok' },
  { type: 'MR', name: 'Beyin MR', sampleType: 'Yok' },
  { type: 'MR', name: 'Omurga MR', sampleType: 'Yok' },
  { type: 'MR', name: 'Diz MR', sampleType: 'Yok' },
  { type: 'CT', name: 'Beyin CT', sampleType: 'Yok' },
  { type: 'CT', name: 'Toraks CT', sampleType: 'Yok' },
  { type: 'CT', name: 'Karın CT', sampleType: 'Yok' },
  { type: 'Ultrason', name: 'Karın Ultrason', sampleType: 'Yok' },
  { type: 'Ultrason', name: 'Pelvik Ultrason', sampleType: 'Yok' },
  { type: 'Ultrason', name: 'Tiroid Ultrason', sampleType: 'Yok' },
  { type: 'EKG', name: 'Dinlenim EKG', sampleType: 'Yok' },
  { type: 'EKG', name: 'Efor Testi', sampleType: 'Yok' },
  { type: 'Biyopsi', name: 'Cilt Biyopsisi', sampleType: 'Doku' },
  { type: 'Biyopsi', name: 'Karaciğer Biyopsisi', sampleType: 'Doku' },
  { type: 'Endoskopi', name: 'Üst Endoskopi', sampleType: 'Yok' },
  { type: 'Kolonoskopi', name: 'Kolonoskopi', sampleType: 'Yok' },
  { type: 'Mamografi', name: 'Mamografi', sampleType: 'Yok' }
];

const priorities = ['low', 'normal', 'high', 'urgent'];
const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];

const normalRanges = {
  'Tam Kan Sayımı': {
    'Hemoglobin': { range: '12-16 g/dL', unit: 'g/dL' },
    'Hematokrit': { range: '36-46%', unit: '%' },
    'Lökosit': { range: '4000-11000/mm³', unit: '/mm³' },
    'Trombosit': { range: '150000-450000/mm³', unit: '/mm³' }
  },
  'Biyokimya Paneli': {
    'Glukoz': { range: '70-100 mg/dL', unit: 'mg/dL' },
    'Kreatinin': { range: '0.6-1.2 mg/dL', unit: 'mg/dL' },
    'Üre': { range: '10-50 mg/dL', unit: 'mg/dL' },
    'ALT': { range: '7-56 U/L', unit: 'U/L' },
    'AST': { range: '10-40 U/L', unit: 'U/L' }
  },
  'Lipid Profili': {
    'Total Kolesterol': { range: '<200 mg/dL', unit: 'mg/dL' },
    'LDL': { range: '<100 mg/dL', unit: 'mg/dL' },
    'HDL': { range: '>40 mg/dL', unit: 'mg/dL' },
    'Trigliserid': { range: '<150 mg/dL', unit: 'mg/dL' }
  },
  'Tiroid Fonksiyonları': {
    'TSH': { range: '0.27-4.2 mIU/L', unit: 'mIU/L' },
    'T3': { range: '2.3-4.2 pg/mL', unit: 'pg/mL' },
    'T4': { range: '0.93-1.7 ng/dL', unit: 'ng/dL' }
  },
  'HbA1c': {
    'HbA1c': { range: '<5.7%', unit: '%' }
  }
};

const generateRandomResult = (testName) => {
  if (normalRanges[testName]) {
    const tests = Object.keys(normalRanges[testName]);
    const randomTest = tests[Math.floor(Math.random() * tests.length)];
    const testInfo = normalRanges[testName][randomTest];
    
    let value;
    if (testInfo.range.includes('-')) {
      const [min, max] = testInfo.range.split('-').map(v => parseFloat(v));
      value = (Math.random() * (max - min) + min).toFixed(1);
    } else if (testInfo.range.includes('<')) {
      const max = parseFloat(testInfo.range.replace('<', ''));
      value = (Math.random() * max * 0.8).toFixed(1);
    } else if (testInfo.range.includes('>')) {
      const min = parseFloat(testInfo.range.replace('>', ''));
      value = (Math.random() * min * 0.5 + min).toFixed(1);
    } else {
      value = (Math.random() * 100).toFixed(1);
    }
    
    return {
      resultValue: value,
      unit: testInfo.unit,
      normalRange: testInfo.range
    };
  }
  
  return null;
};

const generateRandomDate = (daysFromNow = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

const generateRandomTime = () => {
  const hours = Math.floor(Math.random() * 9) + 9; // 9-17 arası
  const minutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const costs = {
  'Kan Tahlili': { min: 50, max: 200 },
  'İdrar Tahlili': { min: 30, max: 100 },
  'Röntgen': { min: 100, max: 300 },
  'MR': { min: 800, max: 1500 },
  'CT': { min: 400, max: 800 },
  'Ultrason': { min: 150, max: 400 },
  'EKG': { min: 80, max: 200 },
  'Biyopsi': { min: 300, max: 800 },
  'Endoskopi': { min: 500, max: 1000 },
  'Kolonoskopi': { min: 600, max: 1200 },
  'Mamografi': { min: 200, max: 400 }
};

const instructions = {
  'Kan Tahlili': '12 saat açlık gereklidir. Su içebilirsiniz.',
  'İdrar Tahlili': 'Temiz kap kullanın. İlk idrarın ortasını alın.',
  'Röntgen': 'Metal aksesuarları çıkarın.',
  'MR': 'Metal implantlarınız varsa bildiriniz. Claustrophobia varsa önceden bildiriniz.',
  'CT': 'Kontrast madde alerjiniz varsa bildiriniz.',
  'Ultrason': 'Karın ultrason için 4-6 saat açlık gereklidir.',
  'EKG': 'Rahat kıyafet giyiniz.',
  'Biyopsi': 'Kan sulandırıcı ilaç kullanıyorsanız bildiriniz.',
  'Endoskopi': '12 saat açlık gereklidir.',
  'Kolonoskopi': 'Bağırsak temizliği gereklidir. Verilen talimatları uygulayınız.',
  'Mamografi': 'Deodorant, pudra kullanmayınız.'
};

const seedTests = async () => {
  try {
    console.log('🧪 Starting to seed tests...');

    // Clear existing tests
    await Test.deleteMany({});
    console.log('✅ Cleared existing tests');

    // Get patients, staff, and departments
    const patients = await Patient.find();
    const staff = await Staff.find();
    const departments = await Department.find();

    if (!patients.length || !staff.length || !departments.length) {
      console.error('❌ No patients, staff, or departments found. Please seed them first.');
      return;
    }

    console.log(`📊 Found ${patients.length} patients, ${staff.length} staff, ${departments.length} departments`);

    const tests = [];
    const numTests = 150; // 150 test oluşturalım

    for (let i = 0; i < numTests; i++) {
      const testInfo = testTypes[Math.floor(Math.random() * testTypes.length)];
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const staffMember = staff[Math.floor(Math.random() * staff.length)];
      const department = departments[Math.floor(Math.random() * departments.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Test tarihini belirle (geçmiş, bugün veya gelecek)
      const dayOffset = Math.floor(Math.random() * 60) - 30; // -30 ile +30 gün arası
      const testDate = generateRandomDate(dayOffset);
      const testTime = generateRandomTime();
      
      // Maliyet hesapla
      const costRange = costs[testInfo.type];
      const cost = Math.floor(Math.random() * (costRange.max - costRange.min) + costRange.min);
      
      // Sonuçları oluştur (eğer test tamamlandıysa)
      let results = null;
      if (status === 'completed') {
        results = generateRandomResult(testInfo.name);
      }

      const test = {
        patientId: patient._id,
        patient_id: patient._id,
        staffId: staffMember._id,
        staff_id: staffMember._id,
        departmentId: department._id,
        department_id: department._id,
        testType: testInfo.type,
        test_type: testInfo.type,
        testName: testInfo.name,
        test_name: testInfo.name,
        testDate: testDate,
        test_date: testDate,
        testTime: testTime,
        test_time: testTime,
        priority: priority,
        status: status,
        cost: cost,
        notes: Math.random() > 0.7 ? `Test ${i + 1} için ek notlar` : undefined,
        instructions: instructions[testInfo.type] || 'Özel talimat bulunmamaktadır.',
        sampleType: testInfo.sampleType,
        sample_type: testInfo.sampleType,
        resultValue: results?.resultValue,
        result_value: results?.resultValue,
        normalRange: results?.normalRange,
        normal_range: results?.normalRange,
        unit: results?.unit,
        results: status === 'completed' && Math.random() > 0.5 ? 
          `${testInfo.name} test sonuçları normal sınırlarda bulunmuştur. Herhangi bir patolojik bulguya rastlanmamıştır.` : 
          undefined
      };

      tests.push(test);
    }

    // Insert tests
    await Test.insertMany(tests);
    console.log(`✅ Successfully created ${tests.length} tests`);

    // Show statistics
    const totalTests = await Test.countDocuments();
    const pendingTests = await Test.countDocuments({ status: 'pending' });
    const inProgressTests = await Test.countDocuments({ status: 'in_progress' });
    const completedTests = await Test.countDocuments({ status: 'completed' });
    const urgentTests = await Test.countDocuments({ priority: 'urgent' });

    console.log('\n📈 Test Statistics:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Pending: ${pendingTests}`);
    console.log(`In Progress: ${inProgressTests}`);
    console.log(`Completed: ${completedTests}`);
    console.log(`Urgent: ${urgentTests}`);

    // Show test types distribution
    const testsByType = await Test.aggregate([
      { $group: { _id: '$testType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n🧪 Tests by Type:');
    testsByType.forEach(type => {
      console.log(`${type._id}: ${type.count}`);
    });

    console.log('\n🎉 Test seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding tests:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeding
seedTests();
