const cron = require('node-cron');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/payment');
const Appointment = require('../models/appointment');
const HostApplication = require('../models/HostApplication');
const Salon = require('../models/salon');

const processDailyPayouts = async () => {
  try {
    console.log('🔄 Processing daily payouts at', new Date().toISOString());

    const paymentsToProcess = await Payment.find({
      status: 'completed',
      payoutStatus: 'pending',
    }).populate('appointment');

    let processedCount = 0;
    let errorCount = 0;

    for (const payment of paymentsToProcess) {
      try {
        const appointment = payment.appointment;
        if (!appointment) {
          errorCount++;
          continue;
        }

        if (!['confirmed', 'completed'].includes(appointment.status)) {
          continue;
        }

        const salon = await Salon.findById(appointment.salon).populate('owner');
        if (!salon) {
          errorCount++;
          continue;
        }

        const hostApplication = await HostApplication.findOne({
          user: salon.owner._id,
          status: 'approved',
        });

        if (!hostApplication?.stripeConnect?.accountId) {
          errorCount++;
          continue;
        }

        const platformFee = Math.round(payment.amount * 0.10 * 100);
        const hostAmount = Math.round(payment.amount * 0.90 * 100);

        const transfer = await stripe.transfers.create({
          amount: hostAmount,
          currency: payment.currency,
          destination: hostApplication.stripeConnect.accountId,
          description: `Payout for appointment ${appointment._id}`,
          metadata: {
            appointmentId: appointment._id.toString(),
            paymentId: payment._id.toString(),
            platformFee,
          },
        });

        payment.payoutStatus = 'completed';
        payment.payoutCompletedAt = new Date();
        payment.stripeTransferId = transfer.id;
        payment.transferStatus = 'completed';
        payment.transferCompletedAt = new Date();
        payment.platformFee = platformFee / 100;
        await payment.save();

        await Appointment.findByIdAndUpdate(appointment._id, {
          payoutStatus: 'completed',
          updatedAt: new Date(),
        });

        processedCount++;
      } catch (error) {
        console.error(`Payout error for payment ${payment._id}:`, error.message);
        payment.payoutStatus = 'failed';
        payment.payoutFailureReason = error.message;
        await payment.save();
        errorCount++;
      }
    }

    console.log(`✅ Payouts processed: ${processedCount}, errors: ${errorCount}`);
  } catch (error) {
    console.error('Daily payout processing error:', error);
  }
};

const syncAppointmentPayoutStatuses = async () => {
  const payments = await Payment.find({ status: 'completed', payoutStatus: 'completed' }).populate('appointment');
  let syncedCount = 0;
  for (const payment of payments) {
    if (payment.appointment && payment.appointment.payoutStatus !== 'completed') {
      await Appointment.findByIdAndUpdate(payment.appointment._id, { payoutStatus: 'completed' });
      syncedCount++;
    }
  }
  return { syncedCount };
};

const syncBookingPayoutStatuses = syncAppointmentPayoutStatuses;

const startDailyPayoutProcessor = () => {
  ['0 12 * * *', '0 17 * * *', '0 20 * * *'].forEach((schedule) => {
    cron.schedule(schedule, processDailyPayouts);
  });
  console.log('✅ Daily payout processor started');
};

module.exports = {
  startDailyPayoutProcessor,
  processDailyPayouts,
  syncAppointmentPayoutStatuses,
  syncBookingPayoutStatuses,
};
