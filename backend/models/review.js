const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  salon: { type: mongoose.Schema.Types.ObjectId, ref: 'Salon', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: { validator: Number.isInteger, message: 'Rating must be 1-5' },
  },
  detailedRatings: {
    skill: { type: Number, min: 1, max: 5, required: true },
    cleanliness: { type: Number, min: 1, max: 5, required: true },
    atmosphere: { type: Number, min: 1, max: 5, required: true },
    value: { type: Number, min: 1, max: 5, required: true },
    punctuality: { type: Number, min: 1, max: 5, required: true },
    communication: { type: Number, min: 1, max: 5, required: true },
  },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  content: { type: String, required: true, trim: true, maxlength: 1000 },
  status: {
    type: String,
    enum: ['pending', 'published', 'hidden', 'flagged'],
    default: 'published',
  },
  helpfulCount: { type: Number, default: 0 },
  helpfulUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  hostResponse: {
    content: { type: String, trim: true, maxlength: 1000 },
    respondedAt: { type: Date },
  },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
  moderationReason: { type: String, trim: true },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

reviewSchema.index({ salon: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ host: 1, createdAt: -1 });
reviewSchema.index({ appointment: 1 }, { unique: true });

reviewSchema.statics.getAverageRating = async function (salonId) {
  const result = await this.aggregate([
    { $match: { salon: new mongoose.Types.ObjectId(salonId), status: 'published' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        averageSkill: { $avg: '$detailedRatings.skill' },
        averageCleanliness: { $avg: '$detailedRatings.cleanliness' },
        averageAtmosphere: { $avg: '$detailedRatings.atmosphere' },
        averageValue: { $avg: '$detailedRatings.value' },
        averagePunctuality: { $avg: '$detailedRatings.punctuality' },
        averageCommunication: { $avg: '$detailedRatings.communication' },
      },
    },
  ]);

  const defaults = {
    averageRating: 0,
    totalReviews: 0,
    averageSkill: 0,
    averageCleanliness: 0,
    averageAtmosphere: 0,
    averageValue: 0,
    averagePunctuality: 0,
    averageCommunication: 0,
  };
  return result.length ? result[0] : defaults;
};

reviewSchema.statics.getAverageRatingsForSalons = async function (salonIds) {
  const objectIds = salonIds.map((id) => new mongoose.Types.ObjectId(id));
  const result = await this.aggregate([
    { $match: { salon: { $in: objectIds }, status: 'published' } },
    {
      $group: {
        _id: '$salon',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const map = {};
  result.forEach((item) => {
    map[item._id.toString()] = {
      averageRating: item.averageRating,
      totalReviews: item.totalReviews,
    };
  });

  return salonIds.map((id) => map[id.toString()] || { averageRating: 0, totalReviews: 0 });
};

module.exports = mongoose.model('Review', reviewSchema);
