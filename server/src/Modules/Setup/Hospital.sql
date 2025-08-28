-- Hospital Table
CREATE TABLE Hospital (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255),
    Type VARCHAR(255),
    Capacity INT,
    Address TEXT,
    Ambulance_Count INT,
    Equipment TEXT
);

-- Patients Table
CREATE TABLE Patients (
    ID BIGINT PRIMARY KEY,
    First_Name VARCHAR(255),
    Last_Name VARCHAR(255),
    Gender VARCHAR(50),
    Contact_Info VARCHAR(255),
    HES_Code VARCHAR(50),
    Insurance VARCHAR(255),
    Medications TEXT,
    Health_Status TEXT,
    Blood_Type VARCHAR(10),
    Appointment_Info VARCHAR(255),
    Weight FLOAT,
    Height FLOAT,
    Date_Of_Birth DATE,
    Emergency_Contact VARCHAR(255)
);

-- Staff Table
CREATE TABLE Staff (
    ID BIGINT PRIMARY KEY,
    Hospital_ID INT,
    First_Name VARCHAR(255),
    Last_Name VARCHAR(255),
    Gender VARCHAR(50),
    Contact_Info VARCHAR(255),
    Department VARCHAR(255),
    Leave_Status VARCHAR(255),
    Salary DECIMAL(10, 2),
    Working_Hours TEXT,
    Date_Of_Birth DATE,
    Emergency_Contact VARCHAR(255),
    FOREIGN KEY (Hospital_ID) REFERENCES Hospital(ID)
);

-- Rooms Table
CREATE TABLE Rooms (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Hospital_ID INT,
    Patient_ID BIGINT,
    Floor INT,
    Capacity INT,
    Companion_Allowed BOOLEAN,
    Status VARCHAR(255),
    Admission_Date DATE,
    Discharge_Date DATE,
    FOREIGN KEY (Hospital_ID) REFERENCES Hospital(ID),
    FOREIGN KEY (Patient_ID) REFERENCES Patients(ID)
);

-- Department Table
CREATE TABLE Departments (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Hospital_ID INT,
    Name VARCHAR(255),
    Floor INT,
    Supervisor VARCHAR(255),
    FOREIGN KEY (Hospital_ID) REFERENCES Hospital(ID)
);

-- Staff Department Table
CREATE TABLE Staff_Department (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Staff_ID BIGINT,
    Department_ID INT,
    FOREIGN KEY (Staff_ID) REFERENCES Staff(ID),
    FOREIGN KEY (Department_ID) REFERENCES Departments(ID)
);

-- Appointments Table
CREATE TABLE Appointments (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Patient_ID BIGINT,
    Doctor_ID BIGINT,
    Department_ID INT,
    Appointment_Date DATETIME,
    Status VARCHAR(255),
    FOREIGN KEY (Patient_ID) REFERENCES Patients(ID),
    FOREIGN KEY (Doctor_ID) REFERENCES Staff(ID),
    FOREIGN KEY (Department_ID) REFERENCES Departments(ID)
);

-- Medication Table
CREATE TABLE Medications (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255),
    Dosage VARCHAR(255),
    Type VARCHAR(255)
);

-- Treatment Table
CREATE TABLE Treatments (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Date DATE,
    Status VARCHAR(255),
    Description TEXT
);

-- Tests Table
CREATE TABLE Tests (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Patient_ID BIGINT,
    Test_Name VARCHAR(255),
    Results TEXT,
    Date DATE,
    FOREIGN KEY (Patient_ID) REFERENCES Patients(ID)
);

-- Insurance Table
CREATE TABLE Insurance (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Patient_ID BIGINT,
    Company_Name VARCHAR(255),
    Policy_Number VARCHAR(255),
    Coverage TEXT,
    FOREIGN KEY (Patient_ID) REFERENCES Patients(ID)
);

-- Surgeries Table
CREATE TABLE Surgeries (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Patient_ID BIGINT,
    Participants TEXT,
    Type VARCHAR(255),
    Date DATE,
    Duration TIME,
    Outcome TEXT,
    FOREIGN KEY (Patient_ID) REFERENCES Patients(ID)
);

-- Surgery Team Table
CREATE TABLE Surgery_Team (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Staff_ID BIGINT,
    Surgery_Type VARCHAR(255),
    Surgery_Date DATE,
    Surgery_Duration TIME,
    Outcome TEXT,
    FOREIGN KEY (Staff_ID) REFERENCES Staff(ID)
);

-- Equipment Table
CREATE TABLE Equipment (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255),
    Condition VARCHAR(255),
    Stock_Quantity INT,
    Department_ID INT,
    FOREIGN KEY (Department_ID) REFERENCES Departments(ID)
);

-- Complaints Table
CREATE TABLE Complaints (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Department_Name VARCHAR(255),
    Description TEXT,
    Status VARCHAR(255),
    Outcome TEXT,
    Complainer_ID BIGINT,
    FOREIGN KEY (Complainer_ID) REFERENCES Patients(ID)
);

-- Users Table
CREATE TABLE Users (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(255) UNIQUE,
    Password VARCHAR(255),
    PermLevel INT DEFAULT 0
);

-- Visits Table
CREATE TABLE Visits (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Patient_ID BIGINT,
    Visit_Date DATE,
    Reason TEXT,
    FOREIGN KEY (Patient_ID) REFERENCES Patients(ID)
);

-- Prescriptions Table
CREATE TABLE Prescriptions (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Patient_ID BIGINT,
    Medication_ID INT,
    Dosage VARCHAR(255),
    Start_Date DATE,
    End_Date DATE,
    FOREIGN KEY (Patient_ID) REFERENCES Patients(ID),
    FOREIGN KEY (Medication_ID) REFERENCES Medications(ID)
);

-- Shifts Table
CREATE TABLE Shifts (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Staff_ID BIGINT,
    Shift_Start DATETIME,
    Shift_End DATETIME,
    FOREIGN KEY (Staff_ID) REFERENCES Staff(ID)
);

-- Feedback Table
CREATE TABLE Feedback (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Patient_ID BIGINT,
    Staff_ID BIGINT,
    Feedback_Date DATE,
    Comments TEXT,
    Rating INT,
    FOREIGN KEY (Patient_ID) REFERENCES Patients(ID),
    FOREIGN KEY (Staff_ID) REFERENCES Staff(ID)
);
