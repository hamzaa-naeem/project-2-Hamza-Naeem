const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// ── POST /api/attendance ─────────────────────────────────────────
// Mark attendance for an employee
router.post('/', async (req, res) => {
  try {
    const { employee, date, status, checkIn, checkOut, overtime, remarks } = req.body;

    const emp = await Employee.findById(employee);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    const record = new Attendance({ employee, date, status, checkIn, checkOut, overtime, remarks });
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Attendance already marked for this employee on this date' });
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ error: 'Failed to mark attendance', details: err.message });
  }
});

// ── POST /api/attendance/bulk ────────────────────────────────────
// Mark attendance for multiple employees at once
router.post('/bulk', async (req, res) => {
  try {
    const { records } = req.body; // array of { employee, date, status, checkIn, checkOut }
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'records must be a non-empty array' });
    }
    const result = await Attendance.insertMany(records, { ordered: false });
    res.status(201).json({ message: `${result.length} attendance records saved`, records: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to bulk mark attendance', details: err.message });
  }
});

// ── GET /api/attendance ──────────────────────────────────────────
// Query: employeeId, date, month, year, status
router.get('/', async (req, res) => {
  try {
    const { employee, date, month, year, status } = req.query;
    const filter = {};

    if (employee) filter.employee = employee;
    if (status) filter.status = status;

    if (date) {
      const d = new Date(date);
      filter.date = {
        $gte: new Date(d.setHours(0, 0, 0, 0)),
        $lte: new Date(d.setHours(23, 59, 59, 999))
      };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (year) {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(filter)
      .populate('employee', 'name employeeId category department')
      .sort({ date: -1 });

    res.json({ count: records.length, records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attendance', details: err.message });
  }
});

// ── GET /api/attendance/report/:employeeId ───────────────────────
// Monthly attendance summary for one employee
router.get('/report/:employeeId', async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'month and year query params are required' });
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const records = await Attendance.find({
      employee: req.params.employeeId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    const summary = {
      Present: 0, Absent: 0, 'Half Day': 0, Late: 0, 'On Leave': 0, Holiday: 0, totalOvertime: 0
    };
    records.forEach((r) => {
      if (summary[r.status] !== undefined) summary[r.status]++;
      summary.totalOvertime += r.overtime || 0;
    });

    res.json({ employeeId: req.params.employeeId, month, year, summary, records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate report', details: err.message });
  }
});

// ── PUT /api/attendance/:id ──────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!record) return res.status(404).json({ error: 'Attendance record not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update attendance', details: err.message });
  }
});

// ── DELETE /api/attendance/:id ───────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: 'Attendance record not found' });
    res.json({ message: 'Attendance record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete attendance', details: err.message });
  }
});

module.exports = router;
