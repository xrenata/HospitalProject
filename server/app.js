require("dotenv").config();
// Variables
const express = require("express");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const { connectDB } = require("./src/Modules/Database/db");
const Project = require("./src/Modules/Functions/Control");
const router = require("./src/Routes/");
const { ensureAccessControl } = require("./src/Modules/Functions/access");
const { ensureHospitals } = require("./src/Modules/Functions/hospitals");
const PORT = process.env.PORT || 3000;
const { apiReference } = require('@scalar/express-api-reference');
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hospital Management API",
      version: "1.0.0",
      description: "Comprehensive API for Hospital Management System including patient care, medical operations, staff management, and administrative functions.",
      contact: {
        name: "Hospital Management Team",
        email: "dev@hospital.com"
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT"
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: "Development server"
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ["./src/Routes/*.js"],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);

// Control Projects Variables
Project.requireCheck();

app.use(helmet({ contentSecurityPolicy: false }));

// Apply CORS middleware first (before routes)
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001")
      .split(",")
      .map((o) => o.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Hospital-Id",
      "Access-Control-Allow-Origin",
    ],
  })
);

// App Config
app.use(express.json());
// Scalar API Documentation
app.use('/api-docs', apiReference({
  theme: 'linear',
  layout: 'modern',
  spec: {
    content: swaggerDocs,
  },
  metaData: {
    title: 'Hospital Management API Documentation',
    description: 'Interactive API documentation for Hospital Management System',
    ogDescription: 'Modern, comprehensive API documentation for managing hospital operations',
  },
  searchHotKey: 'k',
  hideDownloadButton: false,
  hideTestRequestButton: false,
  hideModels: false,
}));
app.use("/api", router);

// Initialize MongoDB connection
connectDB()
  .then(ensureAccessControl)
  .then(ensureHospitals)
  .catch((error) => console.error("Could not set up access roles:", error));

app.listen(PORT, () => {
  console.log(`Backend on: http://${process.env.HOST || "localhost"}:${PORT}`);
});
