const cron = require('node-cron');
const Appointment = require('../models/appointment');
const Salon = require('../models/salon');
const NotificationService = require('./notificationService');

const updateAppointmentStatuses = async () => {
  try {
    console.log('🔄 Updating appointment statuses at', new Date().toISOString());

    const appointments = await Appointment.getAppointmentsNeedingStatusUpdate();
    let updated = 0;

    for (const appointment of appointments) {
      if (appointment.paymentStatus !== 'completed') continue;

      const oldStatus = appointment.status;
      const newStatus = await appointment.updateStatusBasedOnTime();

      if (newStatus !== oldStatus) {
        await appointment.save();
        updated++;
        if (newStatus === 'completed') {
          await Salon.findByIdAndUpdate(appointment.salon, { $inc: { appointmentCount: 1 } });
        }
      }
    }

    // Cancel unpaid appointments older than 24 hours
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stale = await Appointment.find({
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: { $lt: cutoff },
    });

    for (const appt of stale) {
      appt.status = 'cancelled';
      await appt.save();
    }

    console.log(`✅ Updated ${updated} appointments, cancelled ${stale.length} stale pending`);
  } catch (err) {
    console.error('Appointment status update error:', err);
  }
};

const startAppointmentStatusScheduler = () => {
  cron.schedule('*/15 * * * *', updateAppointmentStatuses);
  cron.schedule('0 * * * *', updateAppointmentStatuses);
  console.log('📅 Appointment status scheduler started');
};

const runInitialStatusCheck = async () => {
  await updateAppointmentStatuses();
};

module.exports = {
  startAppointmentStatusScheduler,
  startBookingStatusScheduler: startAppointmentStatusScheduler,
  runInitialStatusCheck,
  updateAppointmentStatuses,
  updateBookingStatuses: updateAppointmentStatuses,
};
