const Review = require('../models/review');
const Appointment = require('../models/appointment');
const Salon = require('../models/salon');

async function updateSalonRating(salonId) {
  const stats = await Review.getAverageRating(salonId);
  await Salon.findByIdAndUpdate(salonId, {
    averageRating: stats.averageRating || 0,
    totalReviews: stats.totalReviews || 0,
    detailedRatings: {
      skill: stats.averageSkill || 0,
      cleanliness: stats.averageCleanliness || 0,
      atmosphere: stats.averageAtmosphere || 0,
      value: stats.averageValue || 0,
      punctuality: stats.averagePunctuality || 0,
      communication: stats.averageCommunication || 0,
    },
  });
}

exports.createReview = async (req, res) => {
  try {
    const { appointmentId, rating, detailedRatings, title, content } = req.body;

    if (!appointmentId || !rating || !detailedRatings || !title || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const appointment = await Appointment.findById(appointmentId).populate('salon');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const visitStarted = appointment.startTime && new Date(appointment.startTime) <= new Date();
    const eligible =
      !appointment.hasReview &&
      !['cancelled', 'no_show'].includes(appointment.status) &&
      appointment.paymentStatus === 'completed' &&
      visitStarted;

    if (!eligible) {
      return res.status(400).json({
        message: 'You can leave a review once your appointment has started.',
      });
    }

    if (appointment.status === 'confirmed') {
      appointment.status = 'completed';
      appointment.canReview = true;
      await appointment.save();
    }

    if (appointment.hasReview) {
      return res.status(400).json({ message: 'Review already exists for this appointment' });
    }

    const requiredRatings = ['skill', 'cleanliness', 'atmosphere', 'value', 'punctuality', 'communication'];
    for (const key of requiredRatings) {
      const val = detailedRatings[key];
      if (!val || val < 1 || val > 5) {
        return res.status(400).json({ message: `Invalid ${key} rating` });
      }
    }

    const review = await Review.create({
      user: req.user._id,
      salon: appointment.salon._id,
      appointment: appointmentId,
      host: appointment.host,
      rating,
      detailedRatings,
      title: title.trim(),
      content: content.trim(),
    });

    await Appointment.findByIdAndUpdate(appointmentId, { hasReview: true, reviewId: review._id });
    await updateSalonRating(appointment.salon._id);
    await review.populate('user', 'firstName lastName profileImage');

    res.status(201).json({ message: 'Review created', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getSalonReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ salon: req.params.salonId, status: 'published' })
      .populate('user', 'firstName lastName profileImage')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const reviews = await Review.find({ user: userId })
      .populate('salon', 'name placeImages')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.body.rating) review.rating = req.body.rating;
    if (req.body.detailedRatings) review.detailedRatings = req.body.detailedRatings;
    if (req.body.title) review.title = req.body.title.trim();
    if (req.body.content) review.content = req.body.content.trim();
    await review.save();
    await updateSalonRating(review.salon);
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const salonId = review.salon;
    await Appointment.findByIdAndUpdate(review.appointment, { hasReview: false, reviewId: null });
    await review.deleteOne();
    await updateSalonRating(salonId);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.addHostResponse = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    review.hostResponse = { content: req.body.content.trim(), respondedAt: new Date() };
    await review.save();
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.toggleHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const userId = req.user._id;
    const idx = review.helpfulUsers.findIndex((id) => id.toString() === userId.toString());
    if (idx >= 0) {
      review.helpfulUsers.splice(idx, 1);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      review.helpfulUsers.push(userId);
      review.helpfulCount += 1;
    }
    await review.save();
    res.json({ helpfulCount: review.helpfulCount, isHelpful: idx < 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
