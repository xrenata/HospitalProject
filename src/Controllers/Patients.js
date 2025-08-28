const { Patient } = require("../Modules/Database/models");

// Hasta arama endpoint'i (autocomplete için)
const searchPatients = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(200).json([]);
    }
    
    const searchTerm = q.trim();
    
    const patients = await Patient.find({
      $or: [
        { firstName: { $regex: searchTerm, $options: "i" } },
        { lastName: { $regex: searchTerm, $options: "i" } },
        { tcNumber: { $regex: searchTerm, $options: "i" } },
        { phone: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } }
      ]
    })
    .limit(parseInt(limit))
    .select('firstName lastName tcNumber phone email dateOfBirth gender');
    
    const transformedPatients = patients.map((patient) => ({
      patient_id: patient._id.toString(),
      first_name: patient.firstName,
      last_name: patient.lastName,
      tc_number: patient.tcNumber,
      phone: patient.phone,
      email: patient.email,
      fullName: patient.fullName,
      age: patient.age,
      gender: patient.gender
    }));
    
    res.status(200).json(transformedPatients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllPatients = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      gender,
      bloodType,
      minAge,
      maxAge,
      hasAllergies,
      hasInsurance,
      city,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;
    
    let filter = {};
    let searchConditions = [];

    // Add search functionality
    if (search) {
      searchConditions.push({
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { tcNumber: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { address: { $regex: search, $options: "i" } },
        ],
      });
    }

    // Add filter conditions
    if (gender) {
      filter.gender = gender;
    }

    if (bloodType) {
      filter.bloodType = bloodType;
    }

    // Age filtering - calculate birth date range
    if (minAge || maxAge) {
      const today = new Date();
      const dateFilter = {};
      
      if (maxAge) {
        // For max age, calculate the earliest birth date
        const earliestBirth = new Date(today.getFullYear() - parseInt(maxAge) - 1, today.getMonth(), today.getDate());
        dateFilter.$gte = earliestBirth;
      }
      
      if (minAge) {
        // For min age, calculate the latest birth date
        const latestBirth = new Date(today.getFullYear() - parseInt(minAge), today.getMonth(), today.getDate());
        dateFilter.$lte = latestBirth;
      }
      
      if (Object.keys(dateFilter).length > 0) {
        filter.dateOfBirth = dateFilter;
      }
    }

    // Allergies filter
    if (hasAllergies === "yes") {
      filter.allergies = { $exists: true, $ne: "", $ne: null };
    } else if (hasAllergies === "no") {
      filter.$or = [
        { allergies: { $exists: false } },
        { allergies: "" },
        { allergies: null }
      ];
    }

    // Insurance filter
    if (hasInsurance === "yes") {
      filter.insuranceInfo = { $exists: true, $ne: "", $ne: null };
    } else if (hasInsurance === "no") {
      filter.$or = [
        { insuranceInfo: { $exists: false } },
        { insuranceInfo: "" },
        { insuranceInfo: null }
      ];
    }

    // City filter
    if (city) {
      filter.address = { $regex: city, $options: "i" };
    }

    // Combine search conditions with filters
    if (searchConditions.length > 0) {
      if (Object.keys(filter).length > 0) {
        filter = { $and: [filter, ...searchConditions] };
      } else {
        filter = searchConditions[0];
      }
    }

    // Handle sorting
    let sortOptions = {};
    switch (sortBy) {
      case "name":
        sortOptions = { firstName: sortOrder === "asc" ? 1 : -1, lastName: sortOrder === "asc" ? 1 : -1 };
        break;
      case "age":
        sortOptions = { dateOfBirth: sortOrder === "asc" ? 1 : -1 };
        break;
      case "gender":
        sortOptions = { gender: sortOrder === "asc" ? 1 : -1 };
        break;
      case "created":
      default:
        sortOptions = { createdAt: sortOrder === "asc" ? 1 : -1 };
        break;
    }

    const patients = await Patient.find(filter)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Patient.countDocuments(filter);

    // Transform data to match frontend expectations
    const transformedPatients = patients.map((patient) => ({
      patient_id: patient._id.toString(),
      first_name: patient.firstName,
      last_name: patient.lastName,
      tc_number: patient.tcNumber,
      date_of_birth: patient.dateOfBirth,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      emergency_contact_name: patient.emergencyContactName,
      emergency_contact_phone: patient.emergencyContactPhone,
      blood_type: patient.bloodType,
      insurance_info: patient.insuranceInfo,
      age: patient.age,
      fullName: patient.fullName,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    }));

    // Get total count without filters for comparison
    const totalPatientsCount = await Patient.countDocuments({});

    res.status(200).json({
      patients: transformedPatients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        totalPatientsCount: totalPatientsCount,
        itemsPerPage: parseInt(limit),
        hasFilters: Object.keys(filter).length > 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPatient = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const patient = await Patient.findById(patient_id);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPatient = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      tc_number,
      date_of_birth,
      gender,
      address,
      phone,
      email,
      emergency_contact_name,
      emergency_contact_phone,
      blood_type,
      insurance_info,
    } = req.body;

    const patient = new Patient({
      firstName: first_name,
      lastName: last_name,
      tcNumber: tc_number,
      dateOfBirth: new Date(date_of_birth),
      gender,
      address,
      phone,
      email,
      emergencyContactName: emergency_contact_name,
      emergencyContactPhone: emergency_contact_phone,
      bloodType: blood_type,
      insuranceInfo: insurance_info,
    });

    const savedPatient = await patient.save();
    res.status(201).json({
      message: "Patient created successfully",
      patient: savedPatient,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const updateData = req.body;

    const patient = await Patient.findByIdAndUpdate(patient_id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.status(200).json({
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const patient = await Patient.findByIdAndDelete(patient_id);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients,
};
