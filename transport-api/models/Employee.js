const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    // ── Identification ───────────────────────────────────────────
    employeeId: {
      type: String,
      unique: true,
      trim: true
    },

    // ── Personal Info ────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true
    },
    fatherName: {
      type: String,
      trim: true
    },
    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      unique: true,
      trim: true,
      match: [/^\d{5}-\d{7}-\d{1}$/, 'CNIC must be in format XXXXX-XXXXXXX-X']
    },
    dateOfBirth: {
      type: Date
    },
    age: {
      type: Number,
      min: [18, 'Employee must be at least 18'],
      max: [65, 'Age cannot exceed 65']
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^(\+92|0)?[0-9]{10}$/, 'Enter a valid Pakistani phone number']
    },
    alternatePhone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address']
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      province: { type: String, trim: true }
    },

    // ── Emergency Contact ────────────────────────────────────────
    emergencyContact: {
      name: { type: String, trim: true },
      relation: { type: String, trim: true },
      phone: { type: String, trim: true }
    },

    // ── Job Info ─────────────────────────────────────────────────
    category: {
      type: String,
      required: [true, 'Employee category is required'],
      enum: [
        'Driver',
        'Bus Staff',
        'Mechanic',
        'Cleaner',
        'Security',
        'Admin',
        'Supervisor',
        'Conductor',
        'Dispatcher',
        'Other'
      ]
    },
    designation: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true
    },
    shift: {
      type: String,
      enum: ['Morning', 'Evening', 'Night', 'Rotational'],
      default: 'Morning'
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Suspended', 'Terminated', 'Retired'],
      default: 'Active'
    },

    // ── Salary ───────────────────────────────────────────────────
    salary: {
      basic: { type: Number, required: [true, 'Basic salary is required'], min: 0 },
      allowances: { type: Number, default: 0 },
      deductions: { type: Number, default: 0 }
    },

    // ── Documents ────────────────────────────────────────────────
    documents: {
      drivingLicense: {
        number: { type: String, trim: true },
        type: { type: String, enum: ['LTV', 'HTV', 'PSV', 'None'], default: 'None' },
        expiryDate: { type: Date }
      },
      certificates: [
        {
          name: { type: String, trim: true },
          issuedBy: { type: String, trim: true },
          issueDate: { type: Date },
          expiryDate: { type: Date }
        }
      ]
    },

    // ── Notes ────────────────────────────────────────────────────
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Auto-generate employeeId before saving if not provided
employeeSchema.pre('save', async function (next) {
  if (!this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual: net salary
employeeSchema.virtual('netSalary').get(function () {
  return (this.salary?.basic || 0) + (this.salary?.allowances || 0) - (this.salary?.deductions || 0);
});

employeeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Employee', employeeSchema);
