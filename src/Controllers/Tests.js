const { Test, Patient, Staff, Department } = require('../Modules/Database/models');

// Get all tests with filtering and pagination
const getAllTests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter query
    let filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }
    
    if (req.query.testType) {
      filter.testType = { $regex: req.query.testType, $options: 'i' };
    }
    
    if (req.query.patientId) {
      filter.patientId = req.query.patientId;
    }
    
    if (req.query.staffId) {
      filter.staffId = req.query.staffId;
    }
    
    if (req.query.departmentId) {
      filter.departmentId = req.query.departmentId;
    }
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.testDate = {};
      if (req.query.startDate) {
        filter.testDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.testDate.$lte = new Date(req.query.endDate);
      }
    }

    const tests = await Test.find(filter)
      .populate('patientId', 'firstName lastName email phone')
      .populate('staffId', 'name email role specialization')
      .populate('departmentId', 'name')
      .sort({ testDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTests = await Test.countDocuments(filter);
    const totalPages = Math.ceil(totalTests / limit);

    res.json({
      tests,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalTests,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tests',
      details: error.message 
    });
  }
};

// Get test by ID
const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('patientId', 'firstName lastName email phone dateOfBirth gender')
      .populate('staffId', 'name email role specialization')
      .populate('departmentId', 'name');

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json(test);
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ 
      error: 'Failed to fetch test',
      details: error.message 
    });
  }
};

// Create new test
const createTest = async (req, res) => {
  try {
    const {
      patientId,
      patient_id,
      staffId, 
      staff_id,
      testType,
      test_type,
      testName,
      test_name,
      testDate,
      test_date,
      testTime,
      test_time,
      departmentId,
      department_id,
      priority,
      cost,
      notes,
      instructions,
      sampleType,
      sample_type
    } = req.body;

    // Use either format for IDs
    const finalPatientId = patientId || patient_id;
    const finalStaffId = staffId || staff_id;
    const finalDepartmentId = departmentId || department_id;
    const finalTestType = testType || test_type;
    const finalTestName = testName || test_name;
    const finalTestDate = testDate || test_date;
    const finalTestTime = testTime || test_time;
    const finalSampleType = sampleType || sample_type;

    // Validate required fields
    if (!finalPatientId || !finalStaffId || !finalTestType || !finalTestName || !finalTestDate || !finalTestTime) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['patientId', 'staffId', 'testType', 'testName', 'testDate', 'testTime']
      });
    }

    // Verify patient exists
    const patient = await Patient.findById(finalPatientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Verify staff exists
    const staff = await Staff.findById(finalStaffId);
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Verify department exists (if provided)
    if (finalDepartmentId) {
      const department = await Department.findById(finalDepartmentId);
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }
    }

    const test = new Test({
      patientId: finalPatientId,
      patient_id: finalPatientId,
      staffId: finalStaffId,
      staff_id: finalStaffId,
      testType: finalTestType,
      test_type: finalTestType,
      testName: finalTestName,
      test_name: finalTestName,
      testDate: new Date(finalTestDate),
      test_date: new Date(finalTestDate),
      testTime: finalTestTime,
      test_time: finalTestTime,
      departmentId: finalDepartmentId,
      department_id: finalDepartmentId,
      priority: priority || 'normal',
      cost,
      notes,
      instructions,
      sampleType: finalSampleType,
      sample_type: finalSampleType,
      status: 'pending'
    });

    await test.save();

    // Populate and return the created test
    const populatedTest = await Test.findById(test._id)
      .populate('patientId', 'firstName lastName email phone')
      .populate('staffId', 'name email role specialization')
      .populate('departmentId', 'name');

    res.status(201).json(populatedTest);
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ 
      error: 'Failed to create test',
      details: error.message 
    });
  }
};

// Update test
const updateTest = async (req, res) => {
  try {
    const testId = req.params.id;
    const updateData = { ...req.body };
    
    // Update timestamp
    updateData.updatedAt = new Date();
    updateData.updated_at = new Date();

    // Handle dual field naming
    if (updateData.patientId) updateData.patient_id = updateData.patientId;
    if (updateData.patient_id) updateData.patientId = updateData.patient_id;
    if (updateData.staffId) updateData.staff_id = updateData.staffId;
    if (updateData.staff_id) updateData.staffId = updateData.staff_id;
    if (updateData.departmentId) updateData.department_id = updateData.departmentId;
    if (updateData.department_id) updateData.departmentId = updateData.department_id;
    if (updateData.testType) updateData.test_type = updateData.testType;
    if (updateData.test_type) updateData.testType = updateData.test_type;
    if (updateData.testName) updateData.test_name = updateData.testName;
    if (updateData.test_name) updateData.testName = updateData.test_name;
    if (updateData.testDate) updateData.test_date = updateData.testDate;
    if (updateData.test_date) updateData.testDate = updateData.test_date;
    if (updateData.testTime) updateData.test_time = updateData.testTime;
    if (updateData.test_time) updateData.testTime = updateData.test_time;
    if (updateData.sampleType) updateData.sample_type = updateData.sampleType;
    if (updateData.sample_type) updateData.sampleType = updateData.sample_type;
    if (updateData.resultValue) updateData.result_value = updateData.resultValue;
    if (updateData.result_value) updateData.resultValue = updateData.result_value;
    if (updateData.normalRange) updateData.normal_range = updateData.normalRange;
    if (updateData.normal_range) updateData.normalRange = updateData.normal_range;

    const test = await Test.findByIdAndUpdate(
      testId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('patientId', 'firstName lastName email phone')
    .populate('staffId', 'name email role specialization')
    .populate('departmentId', 'name');

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json(test);
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({ 
      error: 'Failed to update test',
      details: error.message 
    });
  }
};

// Delete test
const deleteTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({ 
      error: 'Failed to delete test',
      details: error.message 
    });
  }
};

// Get test statistics
const getTestStats = async (req, res) => {
  try {
    const totalTests = await Test.countDocuments();
    const pendingTests = await Test.countDocuments({ status: 'pending' });
    const inProgressTests = await Test.countDocuments({ status: 'in_progress' });
    const completedTests = await Test.countDocuments({ status: 'completed' });
    const urgentTests = await Test.countDocuments({ priority: 'urgent' });
    
    // Tests by type
    const testsByType = await Test.aggregate([
      { $group: { _id: '$testType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Tests by priority
    const testsByPriority = await Test.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Recent tests (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTests = await Test.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      totalTests,
      pendingTests,
      inProgressTests,
      completedTests,
      urgentTests,
      recentTests,
      testsByType,
      testsByPriority
    });
  } catch (error) {
    console.error('Error fetching test stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch test statistics',
      details: error.message 
    });
  }
};

module.exports = {
  getAllTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  getTestStats
};