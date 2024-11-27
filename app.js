require('dotenv').config();
// Variables
const express = require('express');
const app = express();
const Project = require('./src/Modules/Functions/Control');
const router = require('./src/Routes/');
const PORT = process.env.PORT || 3000;

// Control Projects Variables
Project.requireCheck();

// App Config
app.use(express.json());
app.use('/api', router);

app.listen(PORT, () => {
    console.log(`Backend on: http://${process.env.HOST}:${PORT}`);
});
