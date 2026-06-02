const mongoose = require('mongoose');

const applicationServiceSchema = new mongoose.Schema({
  catalogId: { type: String },
  name: { type: String, required: true },
  category: { type: String, default: 'other' },
  duration: { type: Number, default: 45 },
  price: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  description: { type: String, default: '' },
}, { _id: false });

const addressSchema = new mongoose.Schema({
  street: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  country: { type: String, default: 'Cameroon' },
}, { _id: false });

const hostApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  postalAddress: { type: addressSchema, required: true },
  lat: { type: Number },
  lng: { type: Number },
  salonName: { type: String, required: true },
  salonDescription: { type: String, required: true },
  /** Mirrors postalAddress — salon uses the applicant's location */
  salonAddress: { type: addressSchema },
  numberOfEmployees: { type: Number, default: 1 },
  yearsOfExperience: { type: Number, default: 0 },
  services: [applicationServiceSchema],
  certifications: [{ type: String }],
  adminNote: { type: String },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

hostApplicationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (this.postalAddress && !this.salonAddress?.street) {
    this.salonAddress = { ...this.postalAddress.toObject?.() || this.postalAddress };
  }
  next();
});

module.exports = mongoose.model('HostApplication', hostApplicationSchema);
