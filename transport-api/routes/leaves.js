const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');

// ── POST /api/leaves ─────────────────────────────────────────────
// Apply for leave
router.post('/', async (req, res) => {
  try {
    const { employee } = req.body;

    const emp = await Employee.findById(employee);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    if (emp.status === 'Terminated' || emp.status === 'Retired') {
      return res.status(400).json({ error: 'Cannot apply leave for terminated/retired employee' });
    }

    const leave = new Leave(req.body);
    await leave.save();
    res.status(201).json(leave);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ errors });
    }
    res.status(500).json({ error: 'Failed to apply leave', details: err.message });
  }
});

// ── GET /api/leaves ──────────────────────────────────────────────
// Filter by employee, status, leaveType, month, year
router.get('/', async (req, res) => {
  try {
    const { employee, status, leaveType, month, year } = req.query;
    const filter = {};

    if (employee) filter.employee = employee;
    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.startDate = { $gte: start, $lte: end };
    } else if (year) {
      filter.startDate = {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31, 23, 59, 59)
      };
    }

    const leaves = await Leave.find(filter)
      .populate('employee', 'name employeeId category department')
      .sort({ createdAt: -1 });

    res.json({ count: leaves.length, leaves });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaves', details: err.message });
  }
});

// ── GET /api/leaves/:id ──────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate('employee', 'name employeeId category');
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leave', details: err.message });
  }
});

// ── PATCH /api/leaves/:id/approve ───────────────────────────────
router.patch('/:id/approve', async (req, res) => {
  try {
    const { approvedBy, remarks } = req.body;
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: 'Approved', approvedBy, remarks },
      { new: true }
    ).populate('employee', 'name employeeId');
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    // Reflect On Leave status on employee
    await Employee.findByIdAndUpdate(leave.employee._id, { status: 'On Leave' });
    res.json({ message: 'Leave approved', leave });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve leave', details: err.message });
  }
});

// ── PATCH /api/leaves/:id/reject ────────────────────────────────
router.patch('/:id/reject', async (req, res) => {
  try {
    const { approvedBy, remarks } = req.body;
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: 'Rejected', approvedBy, remarks },
      { new: true }
    );
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    res.json({ message: 'Leave rejected', leave });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject leave', details: err.message });
  }
});

// ── PATCH /api/leaves/:id/cancel ────────────────────────────────
router.patch('/:id/cancel', async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    if (leave.status === 'Approved') {
      // Reinstate employee as Active
      await Employee.findByIdAndUpdate(leave.employee, { status: 'Active' });
    }
    leave.status = 'Cancelled';
    await leave.save();
    res.json({ message: 'Leave cancelled', leave });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel leave', details: err.message });
  }
});

// ── DELETE /api/leaves/:id ───────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });
    res.json({ message: 'Leave request deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete leave', details: err.message });
  }
});

module.exports = router;
