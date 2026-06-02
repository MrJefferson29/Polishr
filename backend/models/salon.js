const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: [
      'manicure',
      'pedicure',
      'gel_manicure',
      'gel_pedicure',
      'acrylic',
      'nail_art',
      'dip_powder',
      'spa_pedicure',
      'combo',
      'hair_cut',
      'hair_styling',
      'hair_color',
      'hair_treatment',
      'hair_braiding',
      'hair_weaving',
      'hair_extensions',
      'wig_install',
      'wig_maintenance',
      'wig_custom',
      'lace_front_install',
      'closure_install',
      'braiding',
      'cornrows',
      'twists',
      'loc_maintenance',
      'other',
    ],
    required: true,
  },
  duration: { type: Number, required: true }, // minutes
  price: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
});

const dayHoursSchema = new mongoose.Schema({
  open: { type: String, default: '09:00' },
  close: { type: String, default: '18:00' },
  closed: { type: Boolean, default: false },
}, { _id: false });

const salonSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  title: { type: String, default: '' }, // tagline
  description: { type: String, required: true },
  placeImages: [{ type: String }],
  workImages: [{ type: String }],
  address: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  postalCode: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  numberOfEmployees: { type: Number, default: 1 },
  openingHours: {
    monday: { type: dayHoursSchema, default: () => ({}) },
    tuesday: { type: dayHoursSchema, default: () => ({}) },
    wednesday: { type: dayHoursSchema, default: () => ({}) },
    thursday: { type: dayHoursSchema, default: () => ({}) },
    friday: { type: dayHoursSchema, default: () => ({}) },
    saturday: { type: dayHoursSchema, default: () => ({}) },
    sunday: { type: dayHoursSchema, default: () => ({ closed: true }) },
  },
  services: [serviceSchema],
  amenities: [{ type: String }], // wifi, parking, wheelchair_accessible, etc.
  cancellationPolicy: { type: String, default: '24 hours before appointment' },
  appointmentCount: { type: Number, default: 0 },
  followerCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  detailedRatings: {
    skill: { type: Number, default: 0 },
    cleanliness: { type: Number, default: 0 },
    atmosphere: { type: Number, default: 0 },
    value: { type: Number, default: 0 },
    punctuality: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
  },
  isActive: { type: Boolean, default: true },
  deactivationInfo: {
    isDeactivated: { type: Boolean, default: false },
    deactivatedAt: { type: Date },
    deactivatedUntil: { type: Date },
    deactivationReason: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

salonSchema.index({ location: '2dsphere' });
salonSchema.index({ owner: 1 });
salonSchema.index({ city: 1, isActive: 1 });

salonSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (this.lat != null && this.lng != null) {
    this.location = { type: 'Point', coordinates: [this.lng, this.lat] };
  }
  next();
});

module.exports = mongoose.model('Salon', salonSchema);
