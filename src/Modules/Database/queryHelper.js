const db = require('./db');

// Helper function to execute queries with better error handling and logging
const executeQuery = (sql, params = [], callback) => {
    console.log('Executing query:', sql);
    console.log('With parameters:', params);
    
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Query execution error:', err);
            return callback(err, null);
        }
        
        console.log('Query results:', JSON.stringify(results, null, 2));
        return callback(null, results);
    });
};

module.exports = { executeQuery };
