exports.getAllPaymentsAdmin = async (req, res) => {
  try {
    const Payment = require('../models/payment');

    const payments = await Payment.find({})
      .populate('user', 'firstName lastName email role')
      .populate({
        path: 'appointment',
        select: 'startTime endTime totalPrice status user salon host services',
        populate: [
          { path: 'user', select: 'firstName lastName email' },
          {
            path: 'salon',
            select: 'name owner',
            populate: { path: 'owner', select: 'firstName lastName email role' },
          },
        ],
      })
      .sort({ createdAt: -1 });

    const result = payments.map((p) => {
      const salon = p.appointment?.salon || null;
      const host = p.appointment?.host || salon?.owner || null;
      const guest = p.user || p.appointment?.user || null;

      return {
        _id: p._id,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        paymentMethod: p.paymentMethod,
        transactionId: p.transactionId,
        stripePaymentIntentId: p.stripePaymentIntentId,
        stripeSessionId: p.stripeSessionId,
        payoutStatus: p.payoutStatus,
        payoutMethod: p.payoutMethod,
        payoutDate: p.payoutDate,
        platformFee: p.platformFee,
        guest: guest
          ? { _id: guest._id, firstName: guest.firstName, lastName: guest.lastName, email: guest.email }
          : null,
        host: host && host.firstName
          ? { _id: host._id, firstName: host.firstName, lastName: host.lastName, email: host.email }
          : host,
        salon: salon ? { _id: salon._id, name: salon.name } : null,
        appointment: p.appointment
          ? {
              _id: p.appointment._id,
              startTime: p.appointment.startTime,
              endTime: p.appointment.endTime,
              status: p.appointment.status,
            }
          : null,
      };
    });

    res.json({ payments: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createPaymentIntent = async (req, res) => {
  const { amount, currency = 'usd' } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({ amount, currency, capture_method: 'automatic' });
    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPaymentStatus = async (req, res) => {
  const { paymentId } = req.params;
  try {
    const Payment = require('../models/payment');
    const payment = await Payment.findById(paymentId)
      .populate('appointment', 'startTime endTime totalPrice status')
      .populate('user', 'firstName lastName email');

    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json({ payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserPayments = async (req, res) => {
  try {
    const Payment = require('../models/payment');
    const payments = await Payment.find({ user: req.user._id })
      .populate('appointment', 'startTime endTime totalPrice status')
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.syncAppointmentPayoutStatuses = async (req, res) => {
  try {
    const { syncAppointmentPayoutStatuses } = require('../services/delayedPayoutProcessor');
    const result = await syncAppointmentPayoutStatuses();
    res.json({ message: 'Payout status synchronization completed', result, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Backward-compatible alias
exports.syncBookingPayoutStatuses = exports.syncAppointmentPayoutStatuses;
