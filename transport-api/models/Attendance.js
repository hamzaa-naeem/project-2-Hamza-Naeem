const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    date: {
      type: Date,
      required: [true, 'Date is required']
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half Day', 'Late', 'On Leave', 'Holiday'],
      required: [true, 'Attendance status is required']
    },
    checkIn: {
      type: String, // e.g. "08:30"
      trim: true
    },
    checkOut: {
      type: String,
      trim: true
    },
    overtime: {
      type: Number,
      default: 0,
      min: 0
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate attendance for the same employee on the same date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
