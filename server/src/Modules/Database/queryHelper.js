const { mongoose } = require('./db');

// Helper functions for MongoDB operations with better error handling and logging
const executeQuery = async (operation, description = '') => {
    try {
        console.log('Executing MongoDB operation:', description);
        const result = await operation();
        console.log('Operation successful:', description);
        return { success: true, data: result };
    } catch (error) {
        console.error('MongoDB operation error:', error);
        console.error('Operation description:', description);
        return { success: false, error: error.message };
    }
};

// Pagination helper
const getPaginatedResults = async (Model, filter = {}, options = {}) => {
    const { page = 1, limit = 10, sort = { created_at: -1 } } = options;
    const skip = (page - 1) * limit;
    
    try {
        const [data, total] = await Promise.all([
            Model.find(filter).sort(sort).skip(skip).limit(limit),
            Model.countDocuments(filter)
        ]);
        
        return {
            success: true,
            data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error('Pagination error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { executeQuery, getPaginatedResults };
