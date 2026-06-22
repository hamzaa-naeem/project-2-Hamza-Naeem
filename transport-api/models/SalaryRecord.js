const mongoose = require('mongoose');

const salaryRecordSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: 2000
    },
    basic: {
      type: Number,
      required: [true, 'Basic salary is required'],
      min: 0
    },
    allowances: {
      type: Number,
      default: 0
    },
    overtime: {
      hours: { type: Number, default: 0 },
      amount: { type: Number, default: 0 }
    },
    deductions: {
      type: Number,
      default: 0
    },
    bonus: {
      type: Number,
      default: 0
    },
    netPay: {
      type: Number
    },
    daysPresent: {
      type: Number,
      default: 0
    },
    daysAbsent: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'On Hold'],
      default: 'Pending'
    },
    paymentDate: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate payroll for same employee in same month/year
salaryRecordSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// Auto-calculate netPay before saving
salaryRecordSchema.pre('save', function (next) {
  this.netPay =
    this.basic +
    this.allowances +
    (this.overtime?.amount || 0) +
    (this.bonus || 0) -
    this.deductions;
  next();
});

module.exports = mongoose.model('SalaryRecord', salaryRecordSchema);
