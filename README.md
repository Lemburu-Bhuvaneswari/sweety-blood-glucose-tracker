# Sweety – Blood Glucose Tracker

Sweety is a full-stack blood glucose tracking application designed for people with diabetes. It allows users to record daily glucose readings, manage their reading history, and monitor glucose trends through daily and monthly reports.

## Features

### Authentication
- User registration and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Protected user-specific data.

### Glucose Reading Management
- Add, view, update, and delete glucose readings.
- Four daily reading slots:
  - Morning fasting
  - After breakfast
  - After lunch
  - After dinner
- Glucose value validation between 40 and 600 mg/dl.
- Prevents duplicate readings for the same time slot and date.
- Maximum of four readings per day.
- Prevents future-dated readings.

### Reports and Dashboard
- Dashboard with glucose summary and reading progress.
- Daily glucose report.
- Month-to-date report.
- Previous-month report.
- Highest, lowest, average, and total reading statistics.
- Average glucose rounded to one decimal place.
- Reading history and graphical visualizations.

### User Settings
- Update profile information.
- Change account password.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT |
| Password Security | bcrypt |
| API Requests | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| PDF Export | jsPDF |

## Project Structure

```text
sweety/
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── seed.js
│   ├── app.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── screenshots/
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the application:

- Node.js and npm
- PostgreSQL
- Git
- Visual Studio Code (recommended)

## Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_PUBLIC_GITHUB_REPOSITORY_URL
cd sweety
```

### 2. Database Setup

Open PostgreSQL or pgAdmin and create a database:

```sql
CREATE DATABASE sweety_db;
```

Connect to `sweety_db` and execute the following SQL:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE glucose_readings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    reading_date DATE NOT NULL,
    time_slot VARCHAR(30) NOT NULL,
    glucose_value INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_glucose_value
        CHECK (glucose_value BETWEEN 40 AND 600),
    CONSTRAINT chk_time_slot
        CHECK (
            time_slot IN (
                'Morning fasting',
                'After breakfast',
                'After lunch',
                'After dinner'
            )
        ),
    CONSTRAINT unique_user_reading_slot
        UNIQUE (user_id, reading_date, time_slot)
);

CREATE INDEX idx_glucose_readings_user_date
ON glucose_readings(user_id, reading_date);
```

### 3. Backend Setup

Navigate to the server directory:

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory using `.env.example` as a reference.

Configure your local database credentials and JWT secret:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=sweety_db
DB_USER=postgres
DB_PASSWORD=your_postgresql_password

JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=1d

CLIENT_URL=http://localhost:5173
```

Do not commit your actual `.env` file.

### 4. Seed Demo Data

Run:

```bash
npm run seed
```

This creates a demo user and sample glucose readings.

**Demo Login:**

- Email: `demo@sweety.app`
- Password: `SweetyDemo@123`

### 5. Start the Backend

```bash
npm run dev
```

Backend API:

`http://localhost:5000`

Health check:

`http://localhost:5000/api/health`

### 6. Frontend Setup

Open another terminal from the project root:

```bash
cd client
npm install
npm run dev
```

Open the Vite URL displayed in your terminal, normally:

`http://localhost:5173`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |

### Glucose Readings

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/readings` | Add a reading |
| GET | `/api/readings` | Get reading history |
| PUT | `/api/readings/:id` | Update a reading |
| DELETE | `/api/readings/:id` | Delete a reading |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/daily?date=YYYY-MM-DD` | Daily report |
| GET | `/api/reports/month-to-date?date=YYYY-MM-DD` | Month-to-date report |
| GET | `/api/reports/previous-month?date=YYYY-MM-DD` | Previous-month report |

Protected endpoints require a valid JWT Bearer token.

## Testing

Run backend tests from the server directory:

```bash
npm test
```

API endpoints can also be tested using Thunder Client or Postman.

## Validation Rules

- Glucose value is required.
- Glucose value must be an integer between 40 and 600 mg/dl.
- Only one reading is allowed per time slot per day.
- A maximum of four readings is allowed per day.
- Future dates are not allowed.
- Users can access only their own readings.

## Assumptions

- Each user can record a maximum of four glucose readings per day.
- The four reading slots are fixed.
- Glucose values are recorded in mg/dl.
- Users must be authenticated to manage readings and view reports.
- Daily reports cover the selected date.
- Month-to-date reports cover the first day of the selected month through the selected date.
- Monthly reports cover the entire previous calendar month.

## Future Improvements

- Pagination for reading history.
- Automated reminders for glucose readings.
- Doctor access and patient monitoring.
- Docker-based deployment.
- Automated frontend and backend testing.

## Author

**Bhuvaneswari Lemburu**

Full Stack Developer

---

**Sweety – Blood Glucose Tracker**