const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, default: '' },
  password: { type: String, required: true },
  profileImage: { type: String, default: '' },
  role: {
    type: String,
    enum: ['guest', 'host', 'admin'],
    default: 'guest',
  },
  isVerified: { type: Boolean, default: false },
  googleId: { type: String, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  // Guest preferences
  preferences: {
    favoriteServices: [{ type: String }],
    preferredLocations: [{ type: String }],
    notificationsEnabled: { type: Boolean, default: true },
  },
  // Business / payout info (populated when host application is approved)
  hostProfile: {
    businessName: { type: String },
    businessTaxId: { type: String },
    businessAddress: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    businessPhone: { type: String },
    phoneNumber: { type: String },
    ssnLast4: { type: String },
    bankAccount: {
      accountNumber: { type: String },
      routingNumber: { type: String },
      accountType: { type: String, enum: ['checking', 'savings'] },
    },
    stripeConnectAccountId: { type: String },
    stripeConnectStatus: {
      type: String,
      enum: ['pending', 'active', 'restricted', 'disabled'],
    },
    yearsOfExperience: { type: Number },
    certifications: [{ type: String }],
    applicationApprovedAt: { type: Date },
    applicationApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  permissions: [{
    type: String,
    enum: [
      'create_salon',
      'edit_salon',
      'delete_salon',
      'create_appointment',
      'cancel_appointment',
      'create_post',
      'edit_post',
      'delete_post',
      'create_review',
      'edit_review',
      'delete_review',
      'manage_users',
      'manage_salons',
      'manage_appointments',
      'manage_reviews',
      'view_admin_panel',
    ],
  }],
  followerCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
