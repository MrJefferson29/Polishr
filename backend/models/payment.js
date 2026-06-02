const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cashapp', 'bank_transfer', 'samsung_pay'],
    required: true,
  },
  stripePaymentIntentId: { type: String },
  stripeSessionId: { type: String },
  transactionId: { type: String },
  failureReason: { type: String },
  refundReason: { type: String },
  refundedAt: { type: Date },
  payoutStatus: {
    type: String,
    enum: ['pending', 'scheduled', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  payoutMethod: { type: String, enum: ['stripe_connect'], default: 'stripe_connect' },
  payoutDate: { type: Date },
  payoutTransactionId: { type: String },
  payoutFailureReason: { type: String },
  payoutFailureDetails: { type: String },
  payoutCompletedAt: { type: Date },
  stripeTransferId: { type: String },
  transferStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transferCompletedAt: { type: Date },
  platformFee: { type: Number, default: 0 },
  scheduledPayoutAt: { type: Date },
  payoutScheduled: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ appointment: 1 });
paymentSchema.index({ stripeSessionId: 1 });
paymentSchema.index({ payoutStatus: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
