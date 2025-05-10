require('dotenv').config();
// Variables
const express = require('express');
const app = express();
const cors = require('cors');
const Project = require('./src/Modules/Functions/Control');
const router = require('./src/Routes/');
const PORT = process.env.PORT || 3000;
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerOptions = {
    swaggerDefinition: {
      openapi: '3.0.0',
      info: {
        title: 'Hospital Management API',
        version: '1.0.0',
        description: 'Hospital Management API',
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
        },
      ],
    },
    apis: ['./src/Routes/*.js'],
  };
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Control Projects Variables
Project.requireCheck();

// App Config
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/api', router);
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.listen(PORT, () => {
    console.log(`Backend on: http://${process.env.HOST}:${PORT}`);
});

module.exports = router;