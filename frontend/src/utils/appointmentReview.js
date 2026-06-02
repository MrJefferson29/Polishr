/** Guest can leave a review once the appointment start time has passed */
export const canLeaveReview = (appointment) => {
  if (!appointment || appointment.hasReview) return false;
  if (['cancelled', 'no_show'].includes(appointment.status)) return false;
  if (appointment.paymentStatus && appointment.paymentStatus !== 'completed') return false;
  if (!appointment.startTime) return false;
  const started = new Date(appointment.startTime) <= new Date();
  if (!started) return false;
  return ['confirmed', 'completed'].includes(appointment.status);
};

export const reviewStatusLabel = (appointment) => {
  if (appointment?.hasReview) return 'Review submitted';
  if (canLeaveReview(appointment)) return 'Ready to review';
  if (appointment?.startTime && new Date(appointment.startTime) > new Date()) {
    return 'Review available when your appointment starts';
  }
  return null;
};
