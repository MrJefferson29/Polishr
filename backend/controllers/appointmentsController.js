const Appointment = require('../models/appointment');
const Salon = require('../models/salon');
const NotificationService = require('../services/notificationService');

/** Allow reviews once visit starts; mark completed after end time */
const syncAppointmentReviewState = async (appointment) => {
  if (!appointment) return appointment;
  const now = new Date();
  let dirty = false;

  const activeVisit =
    appointment.paymentStatus === 'completed' &&
    !['cancelled', 'no_show'].includes(appointment.status);

  if (activeVisit && appointment.startTime && new Date(appointment.startTime) <= now) {
    if (!appointment.hasReview && !appointment.canReview) {
      appointment.canReview = true;
      dirty = true;
    }
  }

  if (activeVisit && appointment.endTime && new Date(appointment.endTime) <= now) {
    if (appointment.status === 'confirmed') {
      appointment.status = 'completed';
      dirty = true;
    }
    if (!appointment.hasReview && !appointment.canReview) {
      appointment.canReview = true;
      dirty = true;
    }
  }

  if (dirty) await appointment.save();
  return appointment;
};

const mapAppointmentsForClient = async (appointments) => {
  const list = Array.isArray(appointments) ? appointments : [];
  return Promise.all(list.map((doc) => syncAppointmentReviewState(doc)));
};

exports.createAppointment = async (req, res) => {
  try {
    const {
      salonId,
      services,
      startTime,
      totalPrice,
      notes = '',
    } = req.body;
    const userId = req.user._id;

    const salonDoc = await Salon.findById(salonId).populate('owner');
    if (!salonDoc) {
      return res.status(404).json({ message: 'Salon not found', error: 'SALON_NOT_FOUND' });
    }
    if (!salonDoc.isActive || salonDoc.deactivationInfo?.isDeactivated) {
      return res.status(400).json({ message: 'This salon is not accepting appointments.', error: 'SALON_INACTIVE' });
    }

    if (!services || !services.length) {
      return res.status(400).json({ message: 'Select at least one service', error: 'NO_SERVICES' });
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid appointment time', error: 'INVALID_TIME' });
    }

    const totalDuration = services.reduce((sum, s) => sum + (s.duration || 0), 0);
    const end = new Date(start.getTime() + totalDuration * 60 * 1000);

    const capacity = await Appointment.canBookSlot({
      salonId,
      hostId: salonDoc.owner._id,
      startTime: start,
      endTime: end,
      numberOfEmployees: salonDoc.numberOfEmployees,
    });
    if (!capacity.available) {
      return res.status(400).json({
        message: capacity.message,
        error: capacity.reason === 'host_capacity' ? 'HOST_CAPACITY' : 'SALON_CAPACITY',
        ...capacity,
      });
    }

    const appointment = await Appointment.create({
      user: userId,
      salon: salonId,
      host: salonDoc.owner._id,
      services,
      startTime: start,
      endTime: end,
      totalDuration,
      totalPrice,
      notes,
      status: 'confirmed',
      paymentStatus: 'completed',
    });

    await Salon.findByIdAndUpdate(salonId, { $inc: { appointmentCount: 1 } });

    try {
      await NotificationService.createAppointmentNotification(appointment._id, 'appointment_confirmed');
    } catch (notificationError) {
      console.error('Appointment notification error:', notificationError);
    }

    const populated = await Appointment.findById(appointment._id)
      .populate('salon', 'name placeImages city address')
      .populate('host', 'firstName lastName profileImage');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      appointment: populated,
    });
  } catch (err) {
    console.error('Create appointment error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('salon', 'name placeImages city address')
      .populate('host', 'firstName lastName profileImage')
      .populate('user', 'firstName lastName email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const isGuest = appointment.user._id.toString() === req.user._id.toString();
    const isHost = appointment.host._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isGuest && !isHost && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await syncAppointmentReviewState(appointment);
    res.json({ appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getGuestAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user._id })
      .populate('salon', 'name placeImages city address')
      .populate('host', 'firstName lastName profileImage')
      .sort({ startTime: -1 });
    res.json(await mapAppointmentsForClient(appointments));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getHostAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ host: req.user._id })
      .populate('salon', 'name city address phone')
      .populate('user', 'firstName lastName email phoneNumber profileImage')
      .sort({ startTime: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { salonId, startTime, duration } = req.params;
    const salon = await Salon.findById(salonId).select('owner numberOfEmployees');
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found', available: false });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + parseInt(duration, 10) * 60 * 1000);
    const capacity = await Appointment.canBookSlot({
      salonId,
      hostId: salon.owner,
      startTime: start,
      endTime: end,
      numberOfEmployees: salon.numberOfEmployees,
    });

    res.json({
      available: capacity.available,
      reason: capacity.reason || null,
      salonLimit: capacity.salonLimit,
      salonCount: capacity.salonCount,
      slotsRemaining: capacity.slotsRemaining,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/** Legacy: still resolves Stripe session IDs; also accepts MongoDB appointment ids */
exports.verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    let appointment = null;

    if (sessionId.match(/^[0-9a-fA-F]{24}$/)) {
      appointment = await Appointment.findById(sessionId)
        .populate('salon', 'name placeImages city address')
        .populate('user', 'firstName lastName email');
    } else {
      appointment = await Appointment.findOne({ paymentSessionId: sessionId })
        .populate('salon', 'name placeImages city address')
        .populate('user', 'firstName lastName email');
    }

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await syncAppointmentReviewState(appointment);

    res.json({
      appointment,
      paymentStatus: appointment.paymentStatus,
      status: appointment.status,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const isGuest = appointment.user.toString() === req.user._id.toString();
    const isHost = appointment.host.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isGuest && !isHost && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (['cancelled', 'completed'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Appointment cannot be cancelled' });
    }

    appointment.status = 'cancelled';
    await appointment.save();
    await NotificationService.createAppointmentNotification(appointment._id, 'appointment_cancelled');
    res.json({ message: 'Appointment cancelled', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getSalonAppointments = async (req, res) => {
  try {
    const { salonId } = req.params;
    const salon = await Salon.findById(salonId);
    if (!salon) return res.status(404).json({ message: 'Salon not found' });

    const isOwner = salon.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const appointments = await Appointment.find({
      salon: salonId,
      status: { $in: ['pending', 'confirmed'] },
    }).select('startTime endTime status');

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.cancelPayment = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const appointment = await Appointment.findOne({
      $or: [{ paymentSessionId: sessionId }, { _id: sessionId }],
    });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = 'cancelled';
    appointment.paymentStatus = 'failed';
    await appointment.save();

    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
