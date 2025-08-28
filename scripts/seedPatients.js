const mongoose = require("mongoose");
const { Patient } = require("../src/Modules/Database/models");

// MongoDB bağlantısı için environment variable'ları kontrol et
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/hospital_management";

// Gerçekçi isim listeleri
const firstNames = {
  Male: [
    "Ahmet",
    "Mehmet",
    "Mustafa",
    "Ali",
    "Hasan",
    "Hüseyin",
    "İbrahim",
    "İsmail",
    "Ömer",
    "Osman",
    "Murat",
    "Emre",
    "Burak",
    "Serkan",
    "Kemal",
    "Fatih",
    "Erhan",
    "Tolga",
    "Cem",
    "Deniz",
    "Barış",
    "Onur",
    "Kaan",
    "Volkan mustafa",
    "Selçuk",
    "Taner",
    "Erdem",
    "Gökhan",
    "Sinan",
    "Uğur",
  ],
  Female: [
    "Fatma",
    "Ayşe",
    "Emine",
    "Hatice",
    "Zeynep",
    "Elif",
    "Merve",
    "Seda",
    "Büşra",
    "Esra",
    "Özlem",
    "Pınar",
    "Gül",
    "Sevgi",
    "Derya",
    "Sibel",
    "Tülay",
    "Serpil",
    "Filiz",
    "Nurcan",
    "Serap",
    "Dilek",
    "Aylin",
    "Burcu",
    "Cansu",
    "Duygu",
    "Ebru",
    "Funda",
    "Gamze",
    "Hande",
  ],
};

const lastNames = [
  "Yılmaz",
  "Kaya",
  "Demir",
  "Şahin",
  "Çelik",
  "Yıldız",
  "Yıldırım",
  "Öztürk",
  "Aydin",
  "Özdemir",
  "Arslan",
  "Doğan",
  "Kilic",
  "Aslan",
  "Çetin",
  "Kara",
  "Koç",
  "Kurt",
  "Özkan",
  "Şimşek",
  "Erdoğan",
  "Güneş",
  "Akın",
  "Acar",
  "Polat",
  "Korkmaz",
  "Bulut",
  "Güler",
  "Türk",
  "Özer",
  "Aktaş",
  "Karaca",
  "Taş",
  "Çakır",
  "Erdem",
  "Keskin",
  "Bozkurt",
  "Öz",
  "Çiftçi",
  "Ateş",
];

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const cities = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Adana",
  "Konya",
  "Şanlıurfa",
  "Gaziantep",
  "Kocaeli",
  "Mersin",
  "Diyarbakır",
  "Hatay",
  "Manisa",
  "Kayseri",
  "Samsun",
  "Balıkesir",
  "Kahramanmaraş",
  "Van",
  "Aydın",
];

const districts = [
  "Merkez",
  "Çankaya",
  "Kadıköy",
  "Beşiktaş",
  "Şişli",
  "Bakırköy",
  "Ümraniye",
  "Pendik",
  "Maltepe",
  "Kartal",
  "Ataşehir",
  "Üsküdar",
  "Beyoğlu",
  "Fatih",
  "Zeytinburnu",
  "Bahçelievler",
  "Esenler",
  "Sultangazi",
  "Arnavutköy",
];

// Random veri üretme fonksiyonları
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateTCNumber() {
  // TC kimlik numarası algoritması (basitleştirilmiş)
  let tc = '';
  
  // İlk hane 1-9 arası
  tc += Math.floor(Math.random() * 9) + 1;
  
  // Sonraki 9 hane 0-9 arası
  for (let i = 0; i < 9; i++) {
    tc += Math.floor(Math.random() * 10);
  }
  
  // Son hane kontrol hanesi (basit bir algoritma)
  const lastDigit = Math.floor(Math.random() * 10);
  tc += lastDigit;
  
  return tc;
}

function getRandomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

function generatePhoneNumber() {
  const operators = [
    "532",
    "533",
    "534",
    "535",
    "536",
    "537",
    "538",
    "539",
    "541",
    "542",
    "543",
    "544",
    "545",
    "546",
    "547",
    "548",
    "549",
  ];
  const operator = getRandomElement(operators);
  const number = Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, "0");
  return `+90${operator}${number}`;
}

function generateEmail(firstName, lastName) {
  const domains = [
    "gmail.com",
    "hotmail.com",
    "yahoo.com",
    "outlook.com",
    "yandex.com",
  ];
  const domain = getRandomElement(domains);
  const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(
    Math.random() * 100
  )}`;
  return `${username}@${domain}`;
}

function generateAddress(city) {
  const district = getRandomElement(districts);
  const streetNames = [
    "Atatürk",
    "İnönü",
    "Cumhuriyet",
    "Gazi",
    "Mimar Sinan",
    "Barbaros",
    "Fatih",
    "Mehmet Akif",
  ];
  const streetName = getRandomElement(streetNames);
  const streetNumber = Math.floor(Math.random() * 200) + 1;
  const apartmentNumber = Math.floor(Math.random() * 50) + 1;

  return `${streetName} Caddesi No:${streetNumber} Daire:${apartmentNumber}, ${district}/${city}`;
}

function generateMedicalHistory() {
  const conditions = [
    "Hipertansiyon",
    "Diyabet",
    "Astım",
    "Migren",
    "Artrit",
    "Kalp hastalığı",
    "Böbrek taşı",
    "Gastrit",
    "Anemi",
    "Tiroid hastalığı",
    "Kolesterol yüksekliği",
    "Depresyon",
    "Anksiyete",
    "Ekzema",
    "Sinüzit",
    "Bronşit",
  ];

  const hasCondition = Math.random() > 0.3; // %70 ihtimalle bir hastalık geçmişi var
  if (!hasCondition) return "";

  const numConditions = Math.floor(Math.random() * 3) + 1; // 1-3 arası hastalık
  const selectedConditions = [];

  for (let i = 0; i < numConditions; i++) {
    const condition = getRandomElement(conditions);
    if (!selectedConditions.includes(condition)) {
      selectedConditions.push(condition);
    }
  }

  return selectedConditions.join(", ");
}

function generateAllergies() {
  const allergies = [
    "Penisilin",
    "Aspirin",
    "Fındık",
    "Yumurta",
    "Süt ürünleri",
    "Gluten",
    "Polen",
    "Toz akarı",
    "Kedi tüyü",
    "Köpek tüyü",
    "Çilek",
    "Balık",
    "İyot",
    "Lateks",
    "Nikel",
    "Parfüm",
  ];

  const hasAllergy = Math.random() > 0.6; // %40 ihtimalle alerji var
  if (!hasAllergy) return "";

  const numAllergies = Math.floor(Math.random() * 2) + 1; // 1-2 alerji
  const selectedAllergies = [];

  for (let i = 0; i < numAllergies; i++) {
    const allergy = getRandomElement(allergies);
    if (!selectedAllergies.includes(allergy)) {
      selectedAllergies.push(allergy);
    }
  }

  return selectedAllergies.join(", ");
}

function generateInsuranceInfo() {
  const insuranceCompanies = [
    "SGK",
    "Allianz Sigorta",
    "Axa Sigorta",
    "Aksigorta",
    "Mapfre Sigorta",
    "Türkiye Sigorta",
    "HDI Sigorta",
    "Sompo Sigorta",
    "Zurich Sigorta",
  ];

  const hasInsurance = Math.random() > 0.1; // %90 ihtimalle sigorta var
  if (!hasInsurance) return "";

  const company = getRandomElement(insuranceCompanies);
  const policyNumber = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(10, "0");

  return `${company} - Poliçe No: ${policyNumber}`;
}

// Ana seed fonksiyonu
async function seedPatients() {
  try {
    console.log("🔌 MongoDB'ye bağlanılıyor...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB bağlantısı başarılı!");

    console.log("🗑️  Mevcut hasta verileri temizleniyor...");
    await Patient.deleteMany({});
    console.log("✅ Mevcut veriler temizlendi!");

    console.log("👥 100 hasta verisi oluşturuluyor...");

    const patients = [];

    for (let i = 0; i < 100; i++) {
      const gender = Math.random() > 0.5 ? "Male" : "Female";
      const firstName = getRandomElement(firstNames[gender]);
      const lastName = getRandomElement(lastNames);

      // 18-85 yaş arası doğum tarihi
      const minAge = 18;
      const maxAge = 85;
      const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - age;
      const birthMonth = Math.floor(Math.random() * 12);
      const birthDay = Math.floor(Math.random() * 28) + 1; // 28 güne kadar güvenli

      const dateOfBirth = new Date(birthYear, birthMonth, birthDay);
      const city = getRandomElement(cities);

      // Acil durum kişisi (bazen boş)
      const hasEmergencyContact = Math.random() > 0.2; // %80 ihtimalle var
      let emergencyContactName = "";
      let emergencyContactPhone = "";

      if (hasEmergencyContact) {
        const emergencyGender = Math.random() > 0.5 ? "Male" : "Female";
        emergencyContactName =
          getRandomElement(firstNames[emergencyGender]) +
          " " +
          getRandomElement(lastNames);
        emergencyContactPhone = generatePhoneNumber();
      }

      const patient = {
        firstName,
        lastName,
        tcNumber: generateTCNumber(),
        dateOfBirth,
        gender,
        phone: generatePhoneNumber(),
        email: generateEmail(firstName, lastName),
        address: generateAddress(city),
        emergencyContactName,
        emergencyContactPhone,
        bloodType: getRandomElement(bloodTypes),
        allergies: generateAllergies(),
        medicalHistory: generateMedicalHistory(),
        insuranceInfo: generateInsuranceInfo(),
        createdAt: getRandomDate(new Date(2023, 0, 1), new Date()), // 2023 başından bugüne
        updatedAt: new Date(),
      };

      patients.push(patient);

      // Progress göstergesi
      if ((i + 1) % 10 === 0) {
        console.log(`📝 ${i + 1}/100 hasta verisi hazırlandı...`);
      }
    }

    console.log("💾 Veritabanına kaydediliyor...");
    await Patient.insertMany(patients);

    console.log("🎉 Başarılı! 100 hasta verisi eklendi!");
    console.log("📊 Özet:");
    console.log(`   - Toplam hasta: ${patients.length}`);
    console.log(
      `   - Erkek hasta: ${patients.filter((p) => p.gender === "Male").length}`
    );
    console.log(
      `   - Kadın hasta: ${
        patients.filter((p) => p.gender === "Female").length
      }`
    );
    console.log(
      `   - Alerjisi olan: ${patients.filter((p) => p.allergies).length}`
    );
    console.log(
      `   - Tıbbi geçmişi olan: ${
        patients.filter((p) => p.medicalHistory).length
      }`
    );
    console.log(
      `   - Sigortası olan: ${patients.filter((p) => p.insuranceInfo).length}`
    );
  } catch (error) {
    console.error("❌ Hata oluştu:", error);
  } finally {
    console.log("🔌 MongoDB bağlantısı kapatılıyor...");
    await mongoose.connection.close();
    console.log("✅ Bağlantı kapatıldı. Script tamamlandı!");
    process.exit(0);
  }
}

// Script'i çalıştır
if (require.main === module) {
  seedPatients();
}

module.exports = { seedPatients };
