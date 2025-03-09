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

| HTTP Method | Endpoint                                  | Description                                  |
|-------------|-------------------------------------------|----------------------------------------------|
| GET         | `/hospitals`                                | Get a list of all hospitals                  |
| GET         | `/hospitals/{hospital_id}`                                | Get a specific hospital                |
| POST        | `/hospitals`                                | Create a new hospital                        |
| PUT        | `/hospitals/{hospital_id}`                                | Update a specific hospital                        |
| DELETE        | `/hospitals/{hospital_id}`                                | Delete a specific hospital                        |
| GET         | `/patients`                                 | Get a list of all patients                   |
| POST        | `/patients`                                 | Register a new patient                       |
| PUT        | `/patients/{patient_id}`                                 | Update a specific patient                       |
| DELETE        | `/patients/{patient_id}`                                 | Delete a specific patient                       |
| GET        | `/patients/{patient_id}`                                 | Get a specific patient                       |
| GET         | `/appointments`                             | List all appointments                        |
| POST        | `/appointments`                             | Create a new appointment                     |
| GET         | `/appointments/{appointments_id}`           | Get a specific appointment                    |
| PUT         | `/appointments/{appointments_id}`           | Update a specific appointment                    |
| DELETE      | `/appointments/{appointments_id}`           | Delete a specific appointment                    |
| GET         | `/surgeries`                                | List all surgeries                           |
| POST         | `/surgeries/{surgery_id}`                     | Create a specific surgery                       |
| GET         | `/surgeries/{surgery_id}`                     | Get a specific surgery                       |
| PUT         | `/surgeries/{surgery_id}`                     | Update a specific surgery                       |
| DELETE      | `/surgeries/{surgery_id}`                     | Delete a specific surgery                    |
| GET         | `/surgery-team`                             | List all surgery teams                       |
| GET         | `/surgery-team/{surgery_team_id}`             | Get a specific surgery team                  |
| POST        | `/surgery-team`                             | Create a new surgery team                    |
| PUT         | `/surgery-team/{surgery_team_id}`             | Update a specific surgery team               |
| DELETE      | `/surgery-team/{surgery_team_id}`             | Delete a specific surgery team               |
| GET         | `/staff`                                    | List all staff members                       |
| GET         | `/staff/{staff_id}`                          | Get a specific staff member                  |
| POST        | `/staff`                                    | Create a new staff member                    |
| PUT         | `/staff/{staff_id}`                          | Update a specific staff member               |
| DELETE      | `/staff/{staff_id}`                          | Delete a specific staff member               |
| GET         | `/staff_departments`                        | List all staff departments                   |
| GET         | `/staff_departments/{staff_department_id}`    | Get a specific staff department              |
| POST        | `/staff_departments`                        | Create a new staff department                |
| PUT         | `/staff_departments/{staff_department_id}`    | Update a specific staff department           |
| DELETE      | `/staff_departments/{staff_department_id}`    | Delete a specific staff department           |
| GET         | `/rooms`                                    | List all rooms                               |
| GET         | `/rooms/{room_id}`                           | Get a specific room                          |
| POST        | `/rooms`                                    | Create a new room                            |
| PUT         | `/rooms/{room_id}`                           | Update a specific room                       |
| DELETE      | `/rooms/{room_id}`                           | Delete a specific room                       |
| GET         | `/medications`                              | List all medications                         |
| GET         | `/medications/{medication_id}`               | Get a specific medication                    |
| POST        | `/medications`                              | Create a new medication                      |
| PUT         | `/medications/{medication_id}`               | Update a specific medication                 |
| DELETE      | `/medications/{medication_id}`               | Delete a specific medication                 |
| GET         | `/insurance`                                | List all insurance policies                  |
| POST        | `/insurance`                                | Create a new insurance policy                |
| GET         | `/insurance/{id}`                            | Get a specific insurance policy              |
| PUT         | `/insurance/{id}`                            | Update a specific insurance policy           |
| DELETE      | `/insurance/{id}`                            | Delete a specific insurance policy           |

**Swagger:** You can reach full documantation from [Swagger](http://localhost:3000/api-docs) on your local.

## Environment Variables Table

| Variable Name     | Description                         | Example Value        |
|-------------------|-------------------------------------|----------------------|
| `MYSQL_USER`      | MySQL username                     | `root`               |
| `DATABASE_NAME`   | Name of the database               | `HospitalManagement` |
| `DATABASE_HOST`   | Hostname or IP of the database      | `localhost`          |
| `DATABASE_PASSWORD` | MySQL user password              | `your-password`      |
| `HOST`            | Express server host address         | `localhost`          |
| `PORT`            | Port number for the Express server  | `3000`               |
| `JWT_SECRET`            | Secret key for jwt signature  | `secret`               |

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

If you encounter any issues or have suggestions, feel free to reach out at: ![Emirhan](https://lantern.rest/api/v1/users/937316083533230110?svg=1) ![HasanBocek](https://hasanbocek.com)
