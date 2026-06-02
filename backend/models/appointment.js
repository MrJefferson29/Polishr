const mongoose = require('mongoose');

const appointmentServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  duration: { type: Number, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  services: [appointmentServiceSchema],
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  totalDuration: { type: Number, required: true }, // minutes
  totalPrice: { type: Number, required: true },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
    default: 'pending',
  },
  paymentSessionId: { type: String },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  payoutStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  canReview: { type: Boolean, default: false },
  hasReview: { type: Boolean, default: false },
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

appointmentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

appointmentSchema.methods.updateStatusBasedOnTime = async function () {
  if (this.paymentStatus !== 'completed') return this.status;

  const now = new Date();
  if (this.status === 'cancelled' || this.status === 'no_show') return this.status;

  if (now >= this.endTime && this.status !== 'completed') {
    this.status = 'completed';
    this.canReview = true;
    return 'completed';
  }

  if (now >= this.startTime && this.status === 'confirmed') {
    if (!this.hasReview) this.canReview = true;
    return this.status;
  }

  return this.status;
};

appointmentSchema.statics.getAppointmentsNeedingStatusUpdate = function () {
  const now = new Date();
  return this.find({
    paymentStatus: 'completed',
    status: { $in: ['confirmed'] },
    endTime: { $lte: now },
  }).populate('salon', 'name').populate('user', 'firstName lastName email');
};

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'];

appointmentSchema.statics.countOverlappingAtSlot = async function (
  filter,
  startTime,
  endTime,
  excludeId = null
) {
  const query = {
    ...filter,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return this.countDocuments(query);
};

/**
 * Whether a new booking fits salon staff capacity and host-wide limits.
 */
appointmentSchema.statics.canBookSlot = async function ({
  salonId,
  hostId,
  startTime,
  endTime,
  numberOfEmployees = 1,
  excludeId = null,
}) {
  const { getSalonConcurrentLimit, HOST_MAX_CONCURRENT } = require('../utils/bookingCapacity');

  const salonLimit = getSalonConcurrentLimit(numberOfEmployees);
  const salonCount = await this.countOverlappingAtSlot(
    { salon: salonId },
    startTime,
    endTime,
    excludeId
  );

  if (salonCount >= salonLimit) {
    return {
      available: false,
      reason: 'salon_capacity',
      message:
        salonLimit === 1
          ? 'This time slot is already booked. Please choose a different date or time.'
          : `This salon is fully booked for this time (${salonLimit} appointments at once). Please choose another slot.`,
      salonCount,
      salonLimit,
    };
  }

  let hostCount = 0;
  if (hostId) {
    hostCount = await this.countOverlappingAtSlot(
      { host: hostId },
      startTime,
      endTime,
      excludeId
    );
    if (hostCount >= HOST_MAX_CONCURRENT) {
      return {
        available: false,
        reason: 'host_capacity',
        message:
          'The salon team is at maximum capacity for this time (10 concurrent appointments). Please try another slot.',
        salonCount,
        salonLimit,
        hostCount,
        hostLimit: HOST_MAX_CONCURRENT,
      };
    }
  }

  return {
    available: true,
    salonCount,
    salonLimit,
    hostCount,
    hostLimit: hostId ? HOST_MAX_CONCURRENT : null,
    slotsRemaining: salonLimit - salonCount,
  };
};

/** @deprecated Use canBookSlot — kept for callers that only need a boolean */
appointmentSchema.statics.checkTimeOverlap = async function (
  salonId,
  startTime,
  endTime,
  excludeId = null,
  numberOfEmployees = 1,
  hostId = null
) {
  const result = await this.canBookSlot({
    salonId,
    hostId,
    startTime,
    endTime,
    numberOfEmployees,
    excludeId,
  });
  return !result.available;
};

module.exports = mongoose.model('Appointment', appointmentSchema);
