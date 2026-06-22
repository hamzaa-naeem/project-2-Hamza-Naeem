# Transport Company — Employee Management System API

A complete backend REST API built with **Node.js + Express + MongoDB** to manage all employees of a transport company.

## Employee Categories Supported
Driver | Bus Staff | Mechanic | Cleaner | Security | Admin | Supervisor | Conductor | Dispatcher | Other

---

## Project Structure
```
transport-api/
├── server.js                  # Entry point
├── .env.example               # Environment variables
├── package.json
├── middleware/
│   └── index.js               # Logger + error handler
├── models/
│   ├── Employee.js            # Full employee schema
│   ├── Attendance.js          # Attendance records
│   ├── Leave.js               # Leave requests
│   └── SalaryRecord.js        # Monthly payroll records
└── routes/
    ├── employees.js           # Employee CRUD + status + salary
    ├── attendance.js          # Attendance management
    ├── leaves.js              # Leave management
    └── salary.js              # Payroll management
```

---

## Setup

### 1. Install & start MongoDB locally
```bash
# macOS
brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community

# Windows/Linux: download from https://www.mongodb.com/try/download/community
```

### 2. Install dependencies and start
```bash
cd transport-api
npm install
cp .env.example .env
npm start         # production
npm run dev       # development (auto-restart with nodemon)
```

API runs at: `http://localhost:5000`

---

## API Reference

### Employees `/api/employees`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/employees` | List all employees. Params: `search`, `category`, `status`, `department`, `shift`, `page`, `limit` |
| GET | `/api/employees/stats` | Summary: totals by category, status, shift |
| GET | `/api/employees/:id` | Get one employee |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/:id` | Update employee |
| PATCH | `/api/employees/:id/status` | Change status |
| PATCH | `/api/employees/:id/salary` | Update salary/allowances |
| DELETE | `/api/employees/:id` | Delete employee |

**Status values:** `Active` | `On Leave` | `Suspended` | `Terminated` | `Retired`

**Create employee example:**
```json
{
  "name": "Muhammad Ali",
  "fatherName": "Abdul Ali",
  "cnic": "35201-1234567-1",
  "phone": "03001234567",
  "age": 32,
  "gender": "Male",
  "category": "Driver",
  "designation": "Senior Driver",
  "department": "Operations",
  "shift": "Morning",
  "joiningDate": "2022-01-01",
  "salary": { "basic": 35000, "allowances": 5000, "deductions": 1000 },
  "address": { "street": "Main Road", "city": "Lahore", "province": "Punjab" },
  "emergencyContact": { "name": "Ahmed Ali", "relation": "Brother", "phone": "03009876543" },
  "documents": {
    "drivingLicense": { "number": "DL-12345", "type": "HTV", "expiryDate": "2026-12-31" }
  }
}
```

---

### Attendance `/api/attendance`

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/attendance` | Mark attendance for one employee |
| POST | `/api/attendance/bulk` | Bulk mark attendance for many employees |
| GET | `/api/attendance` | List records. Params: `employee`, `date`, `month`, `year`, `status` |
| GET | `/api/attendance/report/:employeeId` | Monthly report. Params: `month`, `year` |
| PUT | `/api/attendance/:id` | Update record |
| DELETE | `/api/attendance/:id` | Delete record |

**Status values:** `Present` | `Absent` | `Half Day` | `Late` | `On Leave` | `Holiday`

**Mark attendance example:**
```json
{
  "employee": "<employee_id>",
  "date": "2024-07-15",
  "status": "Present",
  "checkIn": "08:00",
  "checkOut": "17:00",
  "overtime": 2
}
```

**Bulk attendance example:**
```json
{
  "records": [
    { "employee": "<id1>", "date": "2024-07-15", "status": "Present", "checkIn": "08:00" },
    { "employee": "<id2>", "date": "2024-07-15", "status": "Absent" }
  ]
}
```

---

### Leaves `/api/leaves`

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/leaves` | Apply for leave |
| GET | `/api/leaves` | List requests. Params: `employee`, `status`, `leaveType`, `month`, `year` |
| GET | `/api/leaves/:id` | Get one request |
| PATCH | `/api/leaves/:id/approve` | Approve leave |
| PATCH | `/api/leaves/:id/reject` | Reject leave |
| PATCH | `/api/leaves/:id/cancel` | Cancel leave |
| DELETE | `/api/leaves/:id` | Delete request |

**Leave types:** `Annual` | `Sick` | `Casual` | `Emergency` | `Unpaid` | `Maternity` | `Other`

**Apply leave example:**
```json
{
  "employee": "<employee_id>",
  "leaveType": "Sick",
  "startDate": "2024-07-20",
  "endDate": "2024-07-22",
  "reason": "Fever and flu"
}
```

---

### Salary & Payroll `/api/salary`

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/salary` | Create salary record manually |
| POST | `/api/salary/generate-payroll` | Auto-generate payroll for ALL active employees |
| GET | `/api/salary` | List records. Params: `employee`, `month`, `year`, `paymentStatus` |
| GET | `/api/salary/:id` | Get one record |
| PATCH | `/api/salary/:id/pay` | Mark as paid |
| PUT | `/api/salary/:id` | Edit record (add bonus, adjust deductions) |
| DELETE | `/api/salary/:id` | Delete record |

**Generate payroll example:**
```json
{
  "month": 7,
  "year": 2024
}
```

**Mark as paid example:**
```json
{
  "notes": "Paid via bank transfer"
}
```

---

## Search & Filter Examples

```bash
# Search by name / CNIC / phone / employeeId
GET /api/employees?search=Ali

# Filter all Drivers
GET /api/employees?category=Driver

# Filter Active Drivers in Morning shift
GET /api/employees?category=Driver&status=Active&shift=Morning

# Get attendance for a specific employee this month
GET /api/attendance?employee=<id>&month=7&year=2024

# Get all pending leaves
GET /api/leaves?status=Pending

# Get unpaid salary records for July 2024
GET /api/salary?month=7&year=2024&paymentStatus=Pending
```

---

## Troubleshooting

- **MongoDB not connecting** → Run `mongod` or `brew services start mongodb-community`
- **CNIC validation error** → Must be format `XXXXX-XXXXXXX-X` (e.g., `35201-1234567-1`)
- **Phone validation error** → Use Pakistani format: `03XXXXXXXXX` or `+923XXXXXXXXX`
- **Duplicate attendance** → Each employee can only have one attendance record per date
- **Duplicate payroll** → Each employee can only have one salary record per month/year
