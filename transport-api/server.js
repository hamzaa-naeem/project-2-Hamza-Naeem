require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { errorHandler, requestLogger } = require('./middleware');

const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const salaryRoutes = require('./routes/salary');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transport_ems';

// ── Middleware ───────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/salary', salaryRoutes);

// ── Root / Health Check ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    system: 'Transport Company — Employee Management System API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      employees: {
        'GET    /api/employees': 'List employees (search, filter by category/status/department/shift, paginate)',
        'GET    /api/employees/stats': 'Summary stats (totals by category, status, shift)',
        'GET    /api/employees/:id': 'Get one employee',
        'POST   /api/employees': 'Create employee',
        'PUT    /api/employees/:id': 'Update employee (full)',
        'PATCH  /api/employees/:id/status': 'Change status (Active/On Leave/Suspended/Terminated/Retired)',
        'PATCH  /api/employees/:id/salary': 'Update salary (basic/allowances/deductions)',
        'DELETE /api/employees/:id': 'Delete employee'
      },
      attendance: {
        'POST   /api/attendance': 'Mark attendance',
        'POST   /api/attendance/bulk': 'Bulk attendance entry',
        'GET    /api/attendance': 'Get attendance (filter by employee/date/month/year/status)',
        'GET    /api/attendance/report/:employeeId': 'Monthly attendance report for one employee',
        'PUT    /api/attendance/:id': 'Update attendance record',
        'DELETE /api/attendance/:id': 'Delete attendance record'
      },
      leaves: {
        'POST   /api/leaves': 'Apply for leave',
        'GET    /api/leaves': 'List leave requests (filter by employee/status/leaveType/month/year)',
        'GET    /api/leaves/:id': 'Get one leave request',
        'PATCH  /api/leaves/:id/approve': 'Approve leave',
        'PATCH  /api/leaves/:id/reject': 'Reject leave',
        'PATCH  /api/leaves/:id/cancel': 'Cancel leave',
        'DELETE /api/leaves/:id': 'Delete leave request'
      },
      salary: {
        'POST   /api/salary': 'Create salary record',
        'POST   /api/salary/generate-payroll': 'Auto-generate payroll for all active employees',
        'GET    /api/salary': 'List salary records (filter by employee/month/year/paymentStatus)',
        'GET    /api/salary/:id': 'Get one salary record',
        'PATCH  /api/salary/:id/pay': 'Mark salary as paid',
        'PUT    /api/salary/:id': 'Edit salary record (bonus/deductions)',
        'DELETE /api/salary/:id': 'Delete salary record'
      }
    }
  });
});

// ── 404 ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error Handler ────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB:', MONGO_URI);
    app.listen(PORT, () => {
      console.log(`🚀 EMS API running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
