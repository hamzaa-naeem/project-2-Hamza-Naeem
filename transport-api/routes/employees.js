const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// ── GET /api/employees ───────────────────────────────────────────
// Query params: search, category, status, department, shift, page, limit
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      status,
      department,
      shift,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { employeeId: regex },
        { cnic: regex },
        { phone: regex },
        { designation: regex }
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (department) filter.department = new RegExp(department, 'i');
    if (shift) filter.shift = shift;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Employee.countDocuments(filter);
    const employees = await Employee.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      count: employees.length,
      employees
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees', details: err.message });
  }
});

// ── GET /api/employees/stats ─────────────────────────────────────
// Summary stats: total by category, status breakdown
router.get('/stats', async (req, res) => {
  try {
    const [byCategory, byStatus, byShift, total] = await Promise.all([
      Employee.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Employee.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Employee.aggregate([{ $group: { _id: '$shift', count: { $sum: 1 } } }]),
      Employee.countDocuments()
    ]);
    res.json({ total, byCategory, byStatus, byShift });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats', details: err.message });
  }
});

// ── GET /api/employees/:id ───────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(400).json({ error: 'Invalid employee id' });
    res.status(500).json({ error: 'Failed to fetch employee', details: err.message });
  }
});

// ── POST /api/employees ──────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();
    res.status(201).json(employee);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ errors: [`${field} already exists`] });
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ error: 'Failed to create employee', details: err.message });
  }
});

// ── PUT /api/employees/:id ───────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ errors: [`${field} already exists`] });
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ error: 'Failed to update employee', details: err.message });
  }
});

// ── PATCH /api/employees/:id/status ─────────────────────────────
// Change status: Active / On Leave / Suspended / Terminated / Retired
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const allowed = ['Active', 'On Leave', 'Suspended', 'Terminated', 'Retired'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }
    const update = { status };
    if (notes) update.notes = notes;
    const employee = await Employee.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: `Status updated to ${status}`, employee });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
});

// ── PATCH /api/employees/:id/salary ─────────────────────────────
// Update salary (increment / change allowances / deductions)
router.patch('/:id/salary', async (req, res) => {
  try {
    const { basic, allowances, deductions } = req.body;
    const update = {};
    if (basic !== undefined) update['salary.basic'] = basic;
    if (allowances !== undefined) update['salary.allowances'] = allowances;
    if (deductions !== undefined) update['salary.deductions'] = deductions;

    const employee = await Employee.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Salary updated', salary: employee.salary, netSalary: employee.netSalary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update salary', details: err.message });
  }
});

// ── DELETE /api/employees/:id ────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    res.json({ message: 'Employee deleted', employee });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete employee', details: err.message });
  }
});

module.exports = router;
