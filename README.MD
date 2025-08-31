# Hospital Management System

A modern and comprehensive hospital management system. This project is a full-stack web application developed to manage hospital operations efficiently.

## 🏥 About the Project

This hospital management system is designed to efficiently manage hospital staff, patients, equipment, appointments, surgeries, and other related tasks. Built with modern web technologies, it features a user-friendly interface and a powerful backend API that simplifies hospital management.

## ✨ Features

### 🎯 Core Features
- **Patient Management**: Patient registration, information updates, and tracking system
- **Staff Management**: Doctor, nurse, and other staff management
- **Appointment System**: Automated appointment scheduling and management
- **Surgery Management**: Surgery planning and team management
- **Room and Equipment Tracking**: Hospital rooms and medical equipment management
- **Medication Management**: Drug inventory tracking and prescription management
- **Laboratory Tests**: Test results and reporting
- **Insurance Management**: Patient insurance information tracking
- **Complaint Management**: Patient complaints and feedback system
- **Analytics and Reporting**: Detailed analysis and reporting tools

### 🎨 User Interface
- Modern and responsive design
- Dark/Light theme support
- Turkish and English language support
- User-friendly dashboard
- Real-time notifications

## 🛠️ Technologies

### Frontend (Client)
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **HeroUI v2** - Modern UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animations
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **next-themes** - Theme management

### Backend (Server)
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Swagger** - API documentation
- **CORS** - Cross-origin resource sharing

## 📋 Requirements

To run this project, you need the following software installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (v4.4 or higher)
- [pnpm](https://pnpm.io/) (recommended) or npm

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/xrenata/hospital.git
cd hospital
```

### 2. Backend Setup

```bash
cd server
npm install
```

### 3. Database Setup

Make sure MongoDB is running on your system. The application will automatically create the database if it doesn't exist.

### 4. Backend Environment Variables

Create a `.env` file in the `server` directory:

```plaintext
# Database Variables
MONGODB_URI=mongodb://localhost:27017/hospital_management

# Express Variables
HOST=localhost
PORT=3000
JWT_SECRET=your-secret-key
```

### 5. Frontend Setup

```bash
cd ../client
pnpm install
```

### 6. Frontend Environment Variables

Create a `.env.local` file in the `client` directory:

```plaintext
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 🏃‍♂️ Running the Application

### Start the Backend

```bash
cd server
npm run dev
```

The backend server will run at `http://localhost:3000`.

### Start the Frontend

```bash
cd client
pnpm dev
```

The frontend application will run at `http://localhost:3001`.

## 📊 Database Schema

The project uses MongoDB with Mongoose schemas for data modeling. Key collections include:

- **Patients**: Patient information and medical history
- **Staff**: Hospital staff and personnel data
- **Departments**: Hospital departments and their details
- **Appointments**: Patient appointment scheduling
- **Surgeries**: Surgery planning and management
- **Medications**: Drug inventory and prescriptions
- **Rooms**: Hospital room management
- **Equipment**: Medical equipment tracking

## 🔧 API Endpoints

### Authentication
| HTTP Method | Endpoint | Description |
|------------|----------|-------------|
| POST | `/api/auth/register` | Create a new user |
| POST | `/api/auth/login` | User login |

### Hospitals
| HTTP Method | Endpoint | Description |
|------------|----------|-------------|
| GET | `/api/hospitals` | Get all hospitals |
| GET | `/api/hospitals/{hospital_id}` | Get specific hospital |
| POST | `/api/hospitals` | Create new hospital |
| PUT | `/api/hospitals/{hospital_id}` | Update hospital information |
| DELETE | `/api/hospitals/{hospital_id}` | Delete hospital |

### Patients
| HTTP Method | Endpoint | Description |
|------------|----------|-------------|
| GET | `/api/patients` | Get all patients |
| GET | `/api/patients/{patient_id}` | Get specific patient |
| POST | `/api/patients` | Register new patient |
| PUT | `/api/patients/{patient_id}` | Update patient information |
| DELETE | `/api/patients/{patient_id}` | Delete patient |

### Appointments
| HTTP Method | Endpoint | Description |
|------------|----------|-------------|
| GET | `/api/appointments` | Get all appointments |
| GET | `/api/appointments/{appointment_id}` | Get specific appointment |
| POST | `/api/appointments` | Create new appointment |
| PUT | `/api/appointments/{appointment_id}` | Update appointment information |
| DELETE | `/api/appointments/{appointment_id}` | Delete appointment |

### Surgeries
| HTTP Method | Endpoint | Description |
|------------|----------|-------------|
| GET | `/api/surgeries` | Get all surgeries |
| GET | `/api/surgeries/{surgery_id}` | Get specific surgery |
| POST | `/api/surgeries` | Create new surgery |
| PUT | `/api/surgeries/{surgery_id}` | Update surgery information |
| DELETE | `/api/surgeries/{surgery_id}` | Delete surgery |

### Staff
| HTTP Method | Endpoint | Description |
|------------|----------|-------------|
| GET | `/api/staff` | Get all staff members |
| GET | `/api/staff/{staff_id}` | Get specific staff member |
| POST | `/api/staff` | Add new staff member |
| PUT | `/api/staff/{staff_id}` | Update staff information |
| DELETE | `/api/staff/{staff_id}` | Delete staff member |

### Other Endpoints
- **Rooms**: `/api/rooms`
- **Medications**: `/api/medications`
- **Insurance**: `/api/insurance`
- **Visits**: `/api/visits`
- **Prescriptions**: `/api/prescriptions`
- **Shifts**: `/api/shifts`
- **Feedback**: `/api/feedback`
- **Complaints**: `/api/complaints`
- **Equipment**: `/api/equipment`
- **Tests**: `/api/tests`
- **Treatments**: `/api/treatments`
- **Departments**: `/api/departments`
- **Analytics**: `/api/analytics`
- **Reports**: `/api/reports`

**Swagger Documentation**: You can access the complete API documentation at [Swagger](http://localhost:3000/api-docs) on your local environment.

## 📁 Project Structure

```
hospital/
├── client/                 # Frontend (Next.js)
│   ├── app/               # Next.js app directory
│   │   ├── dashboard/     # Dashboard pages
│   │   ├── login/         # Login page
│   │   └── layout.tsx     # Main layout
│   ├── components/        # React components
│   ├── config/           # Configuration files
│   ├── contexts/         # React contexts
│   ├── lib/              # Helper functions
│   ├── locales/          # Language files
│   ├── styles/           # CSS files
│   └── types/            # TypeScript types
├── server/               # Backend (Node.js)
│   ├── src/
│   │   ├── Controllers/  # Business logic controllers
│   │   ├── Routes/       # API endpoint routes
│   │   └── Modules/      # Helper modules
│   │       └── Database/ # MongoDB models and connection
│   ├── scripts/          # Database scripts
│   └── app.js           # Main application file
└── README.MD            # This file
```

## 🌍 Environment Variables

### Backend (.env)
| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/hospital_management` |
| `HOST` | Express server host address | `localhost` |
| `PORT` | Express server port | `3000` |
| `JWT_SECRET` | JWT signature key | `your-secret-key` |

### Frontend (.env.local)
| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000/api` |

## 🗄️ Database Setup

### Automatic Setup
To automatically populate the database with sample data:

```bash
cd server
npm run seed
```

### Manual Setup
The application will automatically create the MongoDB database and collections when it first connects.

## 🤝 Contributing

1. Fork this repository
2. Create a new branch: `git checkout -b feature/new-feature`
3. Make your changes and commit them: `git commit -m 'Add new feature'`
4. Push your branch: `git push origin feature/new-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📞 Contact

If you encounter any issues or have suggestions, feel free to reach out to the developers:

![Emirhan](https://lantern.rest/api/v1/users/937316083533230110?svg=1)

## 🙏 Acknowledgments

This project was developed using the following open-source projects:

- [Next.js](https://nextjs.org/)
- [HeroUI](https://heroui.com/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
