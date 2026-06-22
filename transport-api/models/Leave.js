const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee reference is required']
    },
    leaveType: {
      type: String,
      enum: ['Annual', 'Sick', 'Casual', 'Emergency', 'Unpaid', 'Maternity', 'Other'],
      required: [true, 'Leave type is required']
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    totalDays: {
      type: Number,
      min: [1, 'Leave must be at least 1 day']
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending'
    },
    approvedBy: {
      type: String,
      trim: true
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

// Auto-calculate totalDays before saving
leaveSchema.pre('save', function (next) {
  if (this.startDate && this.endDate) {
    const diff = (this.endDate - this.startDate) / (1000 * 60 * 60 * 24);
    this.totalDays = Math.ceil(diff) + 1;
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);
