# Hospital Backend

The **Hospital Backend** is a Node.js-based API developed to manage hospital operations. It provides tools for handling hospital staff, patients, equipment, appointments, surgeries, and other related tasks efficiently.

## Features

- Patient and staff management
- Equipment and room tracking
- Appointment scheduling and management
- Surgery team and procedure handling
- Laboratory test and treatment records
- Complaint management system
- Insurance information tracking

## Requirements

To run this project, you need the following installed on your machine:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MySQL](https://www.mysql.com/) (v7.1 or higher)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/xrenata/hospitalbackend.git
   cd hospitalbackend
   ```

2. Install the required dependencies:

   ```bash
   npm install
   ```

3. Create the MySQL database by running:

   ```sql
   CREATE DATABASE HospitalManagement;
   ```

4. Set up the `.env` file in the project root and add the following environment variables:

   ```plaintext
   # Database Variables
   MYSQL_USER=root
   DATABASE_NAME=HospitalManagement
   DATABASE_HOST=localhost
   DATABASE_PASSWORD=your-password

   # Express Variables
   HOST=localhost
   PORT=3000
   ```

5. Apply migrations to set up the database schema:

   ```bash
   npx sequelize-cli db:migrate
   ```

6. Start the server:

   ```bash
   npm start
   ```

## API Endpoints

| HTTP Method | Endpoint               | Description                                |
|-------------|------------------------|--------------------------------------------|
| GET         | `/hospitals`           | Get a list of all hospitals               |
| POST        | `/hospitals`           | Create a new hospital                     |
| GET         | `/patients`            | Get a list of all patients                |
| POST        | `/patients`            | Register a new patient                    |
| GET         | `/appointments`        | List all appointments                     |
| POST        | `/appointments`        | Create a new appointment                  |

**Note:** You can integrate [Swagger](https://swagger.io/) to document the full API.

## Environment Variables Table

| Variable Name     | Description                         | Example Value        |
|-------------------|-------------------------------------|----------------------|
| `MYSQL_USER`      | MySQL username                     | `root`               |
| `DATABASE_NAME`   | Name of the database               | `HospitalManagement` |
| `DATABASE_HOST`   | Hostname or IP of the database      | `localhost`          |
| `DATABASE_PASSWORD` | MySQL user password              | `your-password`      |
| `HOST`            | Express server host address         | `localhost`          |
| `PORT`            | Port number for the Express server  | `3000`               |

## Project Structure

```plaintext
hospital-backend/src
├── Setup/           # Sequelize models (e.g., Patient, Staff)
├── Routes/          # API endpoint routes
├── Controllers/     # Business logic controllers
├── .env             # Environment variables file
├── package.json     # Project metadata and dependencies
└── README.md        # Documentation
```

## Technologies Used

- **Node.js**: Backend development
- **Express.js**: API routing
- **MySQL**: Relational database
- **dotenv**: Manage environment variables

## Contribution Guidelines

1. Fork this repository.
2. Create a new branch: `git checkout -b feature/new-feature`.
3. Make your changes and commit them: `git commit -m 'Add a new feature'`.
4. Push your branch: `git push origin feature/new-feature`.
5. Open a Pull Request.

## Contact

If you encounter any issues or have suggestions, feel free to reach out at: ![Emirhan](https://lantern.rest/api/v1/users/937316083533230110?svg=1) ![HasanBocek](https://lantern.rest/api/v1/users/903614114662858814?svg=1) 
