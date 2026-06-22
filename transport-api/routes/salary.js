const express = require('express');
const router = express.Router();
const SalaryRecord = require('../models/SalaryRecord');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');

// ── POST /api/salary ─────────────────────────────────────────────
// Generate or create a salary record for an employee
router.post('/', async (req, res) => {
  try {
    const { employee, month, year } = req.body;

    const emp = await Employee.findById(employee);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    // Auto-fill from employee's salary if not provided
    const record = new SalaryRecord({
      basic: emp.salary?.basic || 0,
      allowances: emp.salary?.allowances || 0,
      deductions: emp.salary?.deductions || 0,
      ...req.body
    });

    await record.save();
    res.status(201).json(record);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Salary record already exists for this employee for this month/year' });
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ error: 'Failed to create salary record', details: err.message });
  }
});

// ── POST /api/salary/generate-payroll ───────────────────────────
// Auto-generate payroll for ALL active employees for a given month/year
router.post('/generate-payroll', async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ error: 'month and year are required' });

    const activeEmployees = await Employee.find({ status: 'Active' });
    const results = { created: [], skipped: [], errors: [] };

    for (const emp of activeEmployees) {
      // Count attendance for the month
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      const attendance = await Attendance.find({ employee: emp._id, date: { $gte: start, $lte: end } });

      const daysPresent = attendance.filter((a) => ['Present', 'Half Day', 'Late'].includes(a.status)).length;
      const daysAbsent = attendance.filter((a) => a.status === 'Absent').length;
      const totalOvertime = attendance.reduce((sum, a) => sum + (a.overtime || 0), 0);
      const overtimeAmount = totalOvertime * (emp.salary.basic / 240); // per-hour rate approximation

      try {
        const record = new SalaryRecord({
          employee: emp._id,
          month,
          year,
          basic: emp.salary.basic,
          allowances: emp.salary.allowances,
          deductions: emp.salary.deductions,
          overtime: { hours: totalOvertime, amount: Math.round(overtimeAmount) },
          daysPresent,
          daysAbsent
        });
        await record.save();
        results.created.push({ name: emp.name, employeeId: emp.employeeId, netPay: record.netPay });
      } catch (e) {
        if (e.code === 11000) {
          results.skipped.push({ name: emp.name, reason: 'Already generated' });
        } else {
          results.errors.push({ name: emp.name, reason: e.message });
        }
      }
    }

    res.status(201).json({
      message: `Payroll generated for ${month}/${year}`,
      summary: {
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
        totalPayroll: results.created.reduce((s, r) => s + (r.netPay || 0), 0)
      },
      details: results
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate payroll', details: err.message });
  }
});

// ── GET /api/salary ──────────────────────────────────────────────
// Filter by employee, month, year, paymentStatus
router.get('/', async (req, res) => {
  try {
    const { employee, month, year, paymentStatus } = req.query;
    const filter = {};
    if (employee) filter.employee = employee;
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const records = await SalaryRecord.find(filter)
      .populate('employee', 'name employeeId category department')
      .sort({ year: -1, month: -1 });

    const totalPayroll = records.reduce((s, r) => s + (r.netPay || 0), 0);
    res.json({ count: records.length, totalPayroll, records });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch salary records', details: err.message });
  }
});

// ── GET /api/salary/:id ──────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const record = await SalaryRecord.findById(req.params.id).populate('employee', 'name employeeId category');
    if (!record) return res.status(404).json({ error: 'Salary record not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch salary record', details: err.message });
  }
});

// ── PATCH /api/salary/:id/pay ────────────────────────────────────
// Mark salary record as paid
router.patch('/:id/pay', async (req, res) => {
  try {
    const record = await SalaryRecord.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'Paid', paymentDate: new Date(), notes: req.body.notes },
      { new: true }
    ).populate('employee', 'name employeeId');
    if (!record) return res.status(404).json({ error: 'Salary record not found' });
    res.json({ message: 'Salary marked as paid', record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment status', details: err.message });
  }
});

// ── PUT /api/salary/:id ──────────────────────────────────────────
// Edit a salary record (adjust bonus, deductions, etc.)
router.put('/:id', async (req, res) => {
  try {
    const record = await SalaryRecord.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!record) return res.status(404).json({ error: 'Salary record not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update salary record', details: err.message });
  }
});

// ── DELETE /api/salary/:id ───────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const record = await SalaryRecord.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: 'Salary record not found' });
    res.json({ message: 'Salary record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete salary record', details: err.message });
  }
});

module.exports = router;
