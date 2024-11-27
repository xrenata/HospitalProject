require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./src/Modules/Database/db');
const hospitalRoutes = require('./src/Routes/Hospitals');

const app = express();
app.use(express.json());
app.use('/hospitals', hospitalRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`System active on: http://localhost:${PORT}`);
});
